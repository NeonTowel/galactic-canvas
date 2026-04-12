export type ModelName = 'dall-e-3' | 'flux-2-pro' | 'flux-1-kontext-pro'

export type ModelCapabilities = {
  model: ModelName
  supportsStyleParam: boolean
  supportsQualityParam: boolean
  supportsReferenceImage: boolean
  sizeMode: 'preset' | 'dimensions' | 'aspect_ratio'
  sizeOptions?: string[]
  aspectRatioOptions?: string[]
  dimensions?: {
    min: number
    max: number
    step: number
    maxMegapixels: number
  }
}

const DALL_E_CAPABILITIES: ModelCapabilities = {
  model: 'dall-e-3',
  supportsStyleParam: true,
  supportsQualityParam: true,
  supportsReferenceImage: false,
  sizeMode: 'preset',
  sizeOptions: ['1024x1024', '1024x1792', '1792x1024'],
}

const FLUX_2_CAPABILITIES: ModelCapabilities = {
  model: 'flux-2-pro',
  supportsStyleParam: false,
  supportsQualityParam: false,
  supportsReferenceImage: false,
  sizeMode: 'dimensions',
  sizeOptions: ['1024x1024', '1536x1024', '1024x1536', '1344x768', '768x1344'],
  dimensions: {
    min: 64,
    max: 2048,
    step: 16,
    maxMegapixels: 4,
  },
}

const FLUX_KONTEXT_CAPABILITIES: ModelCapabilities = {
  model: 'flux-1-kontext-pro',
  supportsStyleParam: false,
  supportsQualityParam: false,
  supportsReferenceImage: true,
  sizeMode: 'aspect_ratio',
  aspectRatioOptions: ['1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3'],
}

/**
 * URL path segments used in the upstream Foundry route:
 *   /providers/blackforestlabs/v1/<path>
 * These are lowercase slugs — distinct from the display names in the JSON body.
 */
const FLUX_MODEL_PATHS: Record<'flux-2-pro' | 'flux-1-kontext-pro', string> = {
  'flux-2-pro': 'flux-2-pro',
  'flux-1-kontext-pro': 'flux-kontext-pro',
}

/**
 * Exact model names sent in the `model` field of the FLUX request body.
 * These match the display names shown in Azure AI Foundry and are required
 * verbatim by the upstream API — casing and punctuation are significant.
 */
const FLUX_BODY_MODEL_NAMES: Record<'flux-2-pro' | 'flux-1-kontext-pro', string> = {
  'flux-2-pro': 'FLUX.2-pro',
  'flux-1-kontext-pro': 'FLUX.1-Kontext-pro',
}

export function normalizeModelName(modelName: string): ModelName {
  if (typeof modelName !== 'string' || !modelName.trim()) {
    throw new Error('MODEL_NAME is required')
  }

  const normalizedModelName = modelName.trim().toLowerCase()

  if (normalizedModelName === 'flux-kontext-pro') {
    return 'flux-1-kontext-pro'
  }

  if (normalizedModelName === 'dall-e-3' || normalizedModelName === 'flux-2-pro' || normalizedModelName === 'flux-1-kontext-pro') {
    return normalizedModelName
  }

  throw new Error(`Unsupported MODEL_NAME: ${modelName}`)
}

export function getModelPath(modelName: ModelName): string {
  if (modelName === 'dall-e-3') {
    return 'dall-e-3'
  }

  return FLUX_MODEL_PATHS[modelName]
}

/**
 * Returns the exact `model` string to embed in a FLUX request body.
 * This is the upstream Foundry display name (e.g. "FLUX.2-pro") and differs
 * from the URL path segment returned by `getModelPath`.
 *
 * Only valid for FLUX models; DALL-E requests do not include a `model` field.
 *
 * @example
 * getBodyModelName('flux-2-pro')        // → 'FLUX.2-pro'
 * getBodyModelName('flux-1-kontext-pro') // → 'FLUX.1-Kontext-pro'
 */
export function getBodyModelName(modelName: 'flux-2-pro' | 'flux-1-kontext-pro'): string {
  return FLUX_BODY_MODEL_NAMES[modelName]
}

export function getCapabilities(modelName: string): ModelCapabilities {
  const normalizedModelName = normalizeModelName(modelName)

  switch (normalizedModelName) {
    case 'dall-e-3':
      return DALL_E_CAPABILITIES
    case 'flux-2-pro':
      return FLUX_2_CAPABILITIES
    case 'flux-1-kontext-pro':
      return FLUX_KONTEXT_CAPABILITIES
    default:
      throw new Error(`Unsupported MODEL_NAME: ${modelName}`)
  }
}
