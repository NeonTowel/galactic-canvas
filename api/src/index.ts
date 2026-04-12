import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { generateImage } from './services/azureAI'
import { getCapabilities } from './services/capabilities'
import { createCloudflareAccessMiddleware } from './services/cloudflareAccess'

type Bindings = {
  API_KEY: string
  API_ENDPOINT: string
  TEAM_DOMAIN: string
  POLICY_AUD: string
  MODEL_NAME: string
}

type GenerateImageRequest = {
  prompt?: string
  size?: string
  width?: number
  height?: number
  aspectRatio?: string
  style?: string
  quality?: string
  referenceImage?: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use(secureHeaders())
app.use('*', createCloudflareAccessMiddleware())

app.get('/api/capabilities', (c) => {
  const capabilities = getCapabilities(c.env.MODEL_NAME)
  return c.json(capabilities)
})

app.get('/api', (c) => {
  return c.text('hello. this is the galactic canvas dev api.')
})

app.post('/api/generate-image', async (c) => {
  const { prompt, size, width, height, aspectRatio, style, quality, referenceImage } = await c.req.json<GenerateImageRequest>()

  if (!prompt) {
    return c.json({ error: 'Prompt is required' }, 400)
  }

  try {
    const imageUrl = await generateImage({
      modelName: c.env.MODEL_NAME,
      prompt,
      endpoint: c.env.API_ENDPOINT,
      apiKey: c.env.API_KEY,
      size,
      width,
      height,
      aspectRatio,
      style,
      quality,
      referenceImageBase64: referenceImage,
    })

    return c.json({ imageUrl })
  } catch (error: any) {
    const errorMessage = error.message || 'Failed to generate image'
    return c.json({ error: errorMessage }, 500)
  }
})

export default app
