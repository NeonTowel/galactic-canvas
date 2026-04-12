import { getBodyModelName, getModelPath, normalizeModelName, type ModelName } from './capabilities'

export type GenerateImageParams = {
  modelName: string
  prompt: string
  endpoint: string
  apiKey: string
  size?: string
  width?: number
  height?: number
  aspectRatio?: string
  style?: string
  quality?: string
  referenceImageBase64?: string
}

type GenerationResponse = Record<string, unknown>

const AZURE_OPENAI_API_VERSION = '2024-02-01'
const FLUX_API_VERSION = 'preview'
const DEFAULT_OUTPUT_FORMAT = 'jpeg'
const DEFAULT_SAFETY_TOLERANCE = 2

let hasLoggedResponseShape = false

export async function generateImage(params: GenerateImageParams): Promise<string> {
  const modelName = normalizeModelName(params.modelName)

  switch (modelName) {
    case 'dall-e-3':
      return generateDallEImage(params)
    case 'flux-2-pro':
      return generateFluxImage({ ...params, modelName })
    case 'flux-1-kontext-pro':
      return generateFluxImage({ ...params, modelName })
    default:
      throw new Error(`Unsupported MODEL_NAME: ${params.modelName}`)
  }
}

async function generateDallEImage(params: GenerateImageParams): Promise<string> {
  const requestBody: Record<string, unknown> = {
    prompt: params.prompt,
    n: 1,
  }

  if (params.size) {
    requestBody.size = params.size
  }

  if (params.style) {
    requestBody.style = params.style
  }

  if (params.quality) {
    requestBody.quality = params.quality
  }

  const response = await postJson(
    buildUrl(params.endpoint, '/openai/deployments/dall-e-3/images/generations', AZURE_OPENAI_API_VERSION),
    params.apiKey,
    requestBody,
  )

  return extractImageUrl(response, 'image/png')
}

async function generateFluxImage(params: GenerateImageParams & { modelName: ModelName }): Promise<string> {
  // getBodyModelName returns the exact upstream Foundry display name (e.g. "FLUX.2-pro").
  // getModelPath is kept for the URL path segment only — the two values differ.
  const requestBody: Record<string, unknown> = {
    model: getBodyModelName(params.modelName as 'flux-2-pro' | 'flux-1-kontext-pro'),
    prompt: params.prompt,
    output_format: DEFAULT_OUTPUT_FORMAT,
    safety_tolerance: DEFAULT_SAFETY_TOLERANCE,
  }

  if (params.modelName === 'flux-2-pro') {
    assertIntegerInRange(params.width, 'width', 64, 2048, 16)
    assertIntegerInRange(params.height, 'height', 64, 2048, 16)
    requestBody.width = params.width
    requestBody.height = params.height
  }

  if (params.modelName === 'flux-1-kontext-pro') {
    if (!params.aspectRatio) {
      throw new Error('aspectRatio is required for flux-1-kontext-pro')
    }

    requestBody.aspect_ratio = params.aspectRatio

    const referenceImage = stripDataUriPrefix(params.referenceImageBase64)
    if (referenceImage) {
      requestBody.input_image = referenceImage
    }
  }

  const response = await postJson(
    buildUrl(params.endpoint, `/providers/blackforestlabs/v1/${getModelPath(params.modelName)}`, FLUX_API_VERSION),
    params.apiKey,
    requestBody,
  )

  if (!hasLoggedResponseShape) {
    hasLoggedResponseShape = true
    console.log('FLUX image response shape', describeResponseShape(response))
  }

  return extractImageUrl(response, 'image/jpeg')
}

async function postJson(url: string, apiKey: string, body: Record<string, unknown>): Promise<GenerationResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify(body),
  })

  const text = await response.text()
  const parsedBody = parseJsonResponse(text)

  if (!response.ok) {
    const fallbackMessage = text.trim() || 'Failed to generate image'
    const message = getErrorMessage(parsedBody) ?? fallbackMessage
    throw new Error(`${response.status} ${message}`.trim())
  }

  return parsedBody
}

function parseJsonResponse(text: string): GenerationResponse {
  if (!text.trim()) {
    return {}
  }

  try {
    const parsed = JSON.parse(text) as unknown
    if (parsed && typeof parsed === 'object') {
      return parsed as GenerationResponse
    }

    return { value: parsed }
  } catch {
    return { value: text }
  }
}

function extractImageUrl(response: unknown, fallbackMimeType: string): string {
  const candidate = findImageCandidate(response)

  if (!candidate) {
    throw new Error(`Could not find an image URL in the response: ${JSON.stringify(describeResponseShape(response))}`)
  }

  if (candidate.startsWith('data:') || candidate.startsWith('http://') || candidate.startsWith('https://')) {
    return candidate
  }

  return `data:${fallbackMimeType};base64,${candidate}`
}

function findImageCandidate(value: unknown): string | undefined {
  if (!value) {
    return undefined
  }

  if (typeof value === 'string') {
    return value.trim() || undefined
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const candidate = findImageCandidate(item)
      if (candidate) {
        return candidate
      }
    }

    return undefined
  }

  if (typeof value !== 'object') {
    return undefined
  }

  const record = value as Record<string, unknown>
  const preferredKeys = ['imageUrl', 'url', 'image', 'b64_json', 'base64', 'output', 'result', 'data']

  for (const key of preferredKeys) {
    const candidate = record[key]
    if (candidate === undefined) {
      continue
    }

    const resolved = findImageCandidate(candidate)
    if (resolved) {
      return resolved
    }
  }

  return undefined
}

function stripDataUriPrefix(value?: string): string | undefined {
  if (!value) {
    return undefined
  }

  return value.replace(/^data:[^;]+;base64,/, '')
}

function assertIntegerInRange(value: number | undefined, name: string, min: number, max: number, step: number): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${name} is required for flux-2-pro`)
  }

  if (!Number.isInteger(value)) {
    throw new Error(`${name} must be an integer`)
  }

  if (value < min || value > max) {
    throw new Error(`${name} must be between ${min} and ${max}`)
  }

  if (value % step !== 0) {
    throw new Error(`${name} must be a multiple of ${step}`)
  }
}

function buildUrl(endpoint: string, path: string, apiVersion: string): string {
  const normalizedEndpoint = endpoint.replace(/\/$/, '')
  return `${normalizedEndpoint}${path}?api-version=${apiVersion}`
}

function describeResponseShape(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => describeResponseShape(item))
  }

  if (!value || typeof value !== 'object') {
    return typeof value
  }

  const record = value as Record<string, unknown>
  return Object.fromEntries(Object.entries(record).map(([key, entry]) => [key, describeResponseShape(entry)]))
}

function getErrorMessage(response: GenerationResponse): string | undefined {
  const error = response.error

  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object') {
    const errorRecord = error as Record<string, unknown>
    const message = errorRecord.message
    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }

  const message = response.message
  if (typeof message === 'string' && message.trim()) {
    return message
  }

  return undefined
}
