import { describe, expect, mock, test } from 'bun:test'
import { getBodyModelName } from './capabilities'
import { generateImage } from './azureAI'

const BASE_PARAMS = {
  endpoint: 'https://example.azure.com',
  apiKey: 'test-key',
  prompt: 'a starfield',
}

/**
 * Capture the raw request body sent to fetch for a single generateImage call.
 * Returns the parsed JSON body and restores globalThis.fetch afterward.
 */
async function captureRequestBody(call: () => Promise<unknown>): Promise<Record<string, unknown>> {
  let capturedBody: Record<string, unknown> = {}

  const originalFetch = globalThis.fetch
  globalThis.fetch = mock(async (_url: string | URL | Request, init?: RequestInit) => {
    capturedBody = JSON.parse((init?.body as string) ?? '{}') as Record<string, unknown>
    // Return a minimal valid FLUX-style response
    return new Response(JSON.stringify({ image: 'data:image/jpeg;base64,abc' }), { status: 200 })
  }) as typeof fetch

  try {
    await call()
  } finally {
    globalThis.fetch = originalFetch
  }

  return capturedBody
}

describe('generateImage — FLUX request body', () => {
  test('flux-2-pro body uses upstream Foundry model name FLUX.2-pro', async () => {
    const body = await captureRequestBody(() =>
      generateImage({
        ...BASE_PARAMS,
        modelName: 'flux-2-pro',
        width: 1024,
        height: 1024,
      }),
    )

    // Must match the display name shown in Azure AI Foundry exactly (casing + punctuation).
    expect(body.model).toBe('FLUX.2-pro')
    expect(body.model).toBe(getBodyModelName('flux-2-pro'))
  })

  test('flux-1-kontext-pro body uses upstream Foundry model name FLUX.1-Kontext-pro', async () => {
    const body = await captureRequestBody(() =>
      generateImage({
        ...BASE_PARAMS,
        modelName: 'flux-1-kontext-pro',
        aspectRatio: '1:1',
      }),
    )

    // Must match the display name shown in Azure AI Foundry exactly (casing + punctuation).
    // Note: this differs from the URL path segment ('flux-kontext-pro') used by getModelPath.
    expect(body.model).toBe('FLUX.1-Kontext-pro')
    expect(body.model).toBe(getBodyModelName('flux-1-kontext-pro'))
  })

  test('flux-2-pro body still includes prompt, output_format, safety_tolerance alongside model', async () => {
    const body = await captureRequestBody(() =>
      generateImage({
        ...BASE_PARAMS,
        modelName: 'flux-2-pro',
        width: 1024,
        height: 1024,
      }),
    )

    expect(body.prompt).toBe(BASE_PARAMS.prompt)
    expect(body.output_format).toBe('jpeg')
    expect(body.safety_tolerance).toBe(2)
  })
})

describe('generateImage — DALL-E request body', () => {
  test('dall-e-3 body does NOT include a model field', async () => {
    let capturedBody: Record<string, unknown> = {}

    const originalFetch = globalThis.fetch
    globalThis.fetch = mock(async (_url: string | URL | Request, init?: RequestInit) => {
      capturedBody = JSON.parse((init?.body as string) ?? '{}') as Record<string, unknown>
      // Return a minimal valid DALL-E response shape
      return new Response(
        JSON.stringify({ data: [{ url: 'https://example.com/img.png' }] }),
        { status: 200 },
      )
    }) as typeof fetch

    try {
      await generateImage({
        ...BASE_PARAMS,
        modelName: 'dall-e-3',
        size: '1024x1024',
      })
    } finally {
      globalThis.fetch = originalFetch
    }

    expect(capturedBody.model).toBeUndefined()
    expect(capturedBody.prompt).toBe(BASE_PARAMS.prompt)
  })
})
