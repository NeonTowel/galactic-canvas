import { Hono } from 'hono'
import { generateImage } from './services/azureAI'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { bearerAuth } from 'hono/bearer-auth'

type Bindings = {
  API_KEY: string
  API_ENDPOINT: string
  TOKEN: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use(secureHeaders())

// CORS should be called before the route
app.use(
  '/api/*',
  cors({
    origin: 'https://galactic-canvas-dev-ui.neontowel.dev',
    allowHeaders: [
      'X-Custom-Header',
      'Upgrade-Insecure-Requests',
      'Authorization',
      'Content-Type',
      'Accept'
    ],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  })
)

app.on('GET', '/api/*', async (c, next) => {
  const bearer = bearerAuth({ token: [c.env.TOKEN] })
  return bearer(c, next)
})

app.get('/api', (c) => {
  return c.text('hello. this is the galactic canvas dev api.')
})

app.post('/api/generate-image', async (c) => {
  const { prompt, size, style, quality } = await c.req.json()
  if (!prompt) {
    return c.json({ error: 'Prompt is required' }, 400)
  }

  try {
    const imageUrl = await generateImage(prompt, c.env.API_ENDPOINT, c.env.API_KEY, size, style, quality)
    return c.json({ imageUrl })
  } catch (error: any) {
    const errorMessage = error.message || 'Failed to generate image'
    return c.json({ error: errorMessage }, 500)
  }
})

export default app
