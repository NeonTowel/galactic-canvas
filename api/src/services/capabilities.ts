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

const FLUX_MODEL_PATHS: Record<'flux-2-pro' | 'flux-1-kontext-pro', string> = {
  'flux-2-pro': 'flux-2-pro',
  'flux-1-kontext-pro': 'flux-kontext-pro',
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
