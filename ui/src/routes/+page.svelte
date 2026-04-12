<script lang="ts">
  import { onMount } from 'svelte'

  type PresetStyleKey = keyof typeof presetStyles
  type StyleIntensity = 1 | 2 | 3

  type SizePreset = {
    value: string
    width: number
    height: number
  }

  type ModelCapabilities = {
    model: 'dall-e-3' | 'flux-2-pro' | 'flux-1-kontext-pro'
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

  type ImageResponse = {
    imageUrl: string
    error?: string
  }

  let prompt = ''
  let imageUrl = ''
  let loading = false
  let error = ''

  let capabilities: ModelCapabilities | null = null
  let capabilitiesLoading = true
  let capabilitiesError = ''

  let selectedSize = '1024x1024'
  let selectedAspectRatio = '1:1'
  let style = 'natural'
  let quality = 'standard'

  let referenceImageBase64 = ''
  let referenceImageError = ''
  let referenceImageInput: HTMLInputElement | null = null

  let presetStyle: PresetStyleKey | '' = ''
  let styleIntensity: StyleIntensity = 1

  export const presetStyles = {
    'Minimalist Low-Poly with Soft Glows':
      'A clean, modern illustration style using simplified geometric shapes and a soft, ethereal glow.',
    'Graphic Novel / Ink Noir':
      'A bold, high-contrast black-and-white illustration with dramatic lighting and heavy ink shading.',
    'Retro-Futuristic 80s Cyberpunk':
      'A neon-soaked, high-energy illustration inspired by the retro-futurism of the 1980s.',
    'Cyber-Dystopian Grit with Photobashing & Textures':
      'A hyper-detailed, layered illustration style blending photorealistic elements with cyberpunk dystopian decay.',
    'Steampunk Engraving':
      'A richly detailed steampunk world with intricate brass, elaborate filigree, and visible clockwork mechanisms.',
    'Pixel Noir':
      'Retro pixel art with a mix of grayscale and neon highlights, balanced shading, and moody lighting.',
    'Watercolor Dreamscape':
      'A rich yet balanced watercolor world with visible brushwork, textured color blending, and a serene artistic atmosphere.',
    'Anime Noir':
      'An anime style influenced by classic noir films—bold shadows, dramatic lighting, and vibrant but muted colors.',
    'Charcoal & Ink Sketch':
      'A raw, expressive charcoal drawing with deep shadows, bold strokes, and visible texture.',
    'Minimalist Contrast':
      'A refined minimalist aesthetic with controlled negative space, distinct geometric shapes, and structured, harmonious layout.',
  }

  const presetStyleEntries = Object.entries(presetStyles) as [PresetStyleKey, string][]

  export const intensityMatrix = {
    'Minimalist Low-Poly with Soft Glows': {
      1: 'Subtle, diffused glow with soft, airy gradients and very simple geometric shapes.',
      2: 'A well-balanced low-poly aesthetic with structured shapes, smooth color blending, and a luminous glow.',
      3: 'Bold, striking geometry with sharp low-poly structures, intense glowing edges, and a high-tech, futuristic ambiance.',
    },
    'Graphic Novel / Ink Noir': {
      1: 'Soft ink shading with moderate contrast, clean lines, and a balanced interplay of light and dark.',
      2: 'Strong chiaroscuro effects, deep blacks with dramatic white highlights, expressive brushwork, and a moody, cinematic tone.',
      3: 'Extreme high-contrast ink noir, overwhelming black shadows, razor-sharp white highlights, and a raw, textured, unfinished feel.',
    },
    'Retro-Futuristic 80s Cyberpunk': {
      1: 'Subtle neon highlights with soft synthwave hues, minimal grid reflections, and a restrained color palette.',
      2: 'Vibrant neon colors, glowing horizon grids, dynamic lighting, and a perfect blend of retro and futuristic aesthetics.',
      3: 'Blazing neon lights, extreme chromatic contrast, heavy VHS grain, and an electrified, saturated cyberpunk dreamscape.',
    },
    'Cyber-Dystopian Grit with Photobashing & Textures': {
      1: 'Subtle wear and tear on surfaces, muted neon lighting, and a lightly distressed urban aesthetic.',
      2: 'Balanced cyberpunk grit with realistic textures, rain-soaked streets, and flickering neon signs creating an immersive dystopian world.',
      3: 'Hyper-textured, photorealistic decay with extreme rain reflections, peeling paint, rusted metal, and heavily degraded cyberpunk infrastructure.',
    },
    'Steampunk Engraving': {
      1: 'Subtle metallic textures and light ornamental engravings on Victorian-inspired elements.',
      2: 'A balanced mix of intricate filigree, clockwork machinery, and elegant brass ornamentation.',
      3: 'Overwhelmingly detailed steampunk world, layered with deep mechanical intricacy, swirling brass etchings, and immersive, high-contrast metalwork.',
    },
    'Pixel Noir': {
      1: 'Simplified, low-resolution pixel noir with minimal shading and a monochrome aesthetic.',
      2: 'Balanced 16-bit pixel noir with controlled light and shadow, moderate pixel density, and stylized moody contrast.',
      3: 'Extreme high-contrast pixel noir with exaggerated neon accents, deep shadows, and highly stylized noir textures.',
    },
    'Watercolor Dreamscape': {
      1: 'Soft, delicate watercolor washes with gentle transitions and barely visible brushwork.',
      2: 'Balanced watercolor textures with vibrant color blending, artistic brush strokes, and rich, dreamy gradients.',
      3: 'Bold, expressive watercolor world with heavily saturated tones, visible raw brushwork, and intense bleeding color transitions.',
    },
    'Anime Noir': {
      1: 'Soft shading and moderate contrast, restrained color saturation with subtle cinematic lighting.',
      2: 'Balanced anime noir with crisp cel-shading, dramatic shadows, and an expressive film-like mood.',
      3: 'Extreme anime-noir aesthetics with razor-sharp contrast, deep shadows, and dynamic lighting effects straight from a high-stakes thriller.',
    },
    'Charcoal & Ink Sketch': {
      1: 'Soft, smudged charcoal with gentle shading, fine details, and subtle grain.',
      2: 'Deeply textured charcoal rendering with rich shadow work, expressive strokes, and a sketch-like rawness.',
      3: 'Intensely bold charcoal with extreme contrast, overwhelming black shadows, raw hand-drawn power, and near-abstraction in its energy.',
    },
    'Minimalist Contrast': {
      1: 'Soft edges, simple linework, and a balanced distribution of negative space.',
      2: 'Crisp contrast, refined shapes, and a perfect interplay between black, white, and empty space.',
      3: 'Extreme contrast, bold geometric dominance, stark abstraction with deep blacks swallowing negative space, and overwhelming clarity in simplicity.',
    },
  }

  const flux2SizePresets: SizePreset[] = [
    { value: '1024x1024', width: 1024, height: 1024 },
    { value: '1536x1024', width: 1536, height: 1024 },
    { value: '1024x1536', width: 1024, height: 1536 },
    { value: '1344x768', width: 1344, height: 768 },
    { value: '768x1344', width: 768, height: 1344 },
  ]

  function getIconForStyle(selectedStyle: string): string {
    switch (selectedStyle) {
      case 'Minimalist Low-Poly with Soft Glows':
        return '/icons/minimalist-low-poly.png'
      case 'Graphic Novel / Ink Noir':
        return '/icons/graphic-novel-ink-noir.png'
      case 'Retro-Futuristic 80s Cyberpunk':
        return '/icons/retro-futuristic-80s-cyberpunk.png'
      case 'Cyber-Dystopian Grit with Photobashing & Textures':
        return '/icons/cyber-dystopian-grit.png'
      case 'Steampunk Engraving':
        return '/icons/steampunk-engraving.png'
      case 'Pixel Noir':
        return '/icons/pixel-noir.png'
      case 'Watercolor Dreamscape':
        return '/icons/watercolor-dreamscape.png'
      case 'Anime Noir':
        return '/icons/anime-noir.png'
      case 'Charcoal & Ink Sketch':
        return '/icons/charcoal-ink-sketch.png'
      case 'Minimalist Contrast':
        return '/icons/minimalist-contrast.png'
      default:
        return ''
    }
  }

  function applyCapabilityDefaults(nextCapabilities: ModelCapabilities): void {
    if (nextCapabilities.model === 'flux-2-pro') {
      selectedSize = nextCapabilities.sizeOptions?.[0] ?? flux2SizePresets[0]?.value ?? '1024x1024'
      return
    }

    if (nextCapabilities.sizeMode === 'preset') {
      selectedSize = nextCapabilities.sizeOptions?.[0] ?? '1024x1024'
      return
    }

    selectedAspectRatio = nextCapabilities.aspectRatioOptions?.[0] ?? '1:1'
  }

  function parseSizePreset(sizePreset: string): { width: number; height: number } {
    const match = sizePreset.match(/^(\d+)x(\d+)$/)

    if (!match) {
      throw new Error(`Invalid size preset: ${sizePreset}`)
    }

    const width = Number(match[1])
    const height = Number(match[2])

    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
      throw new Error(`Invalid size preset: ${sizePreset}`)
    }

    return { width, height }
  }

  function getSizeOptions(currentCapabilities: ModelCapabilities): string[] {
    if (currentCapabilities.model === 'flux-2-pro') {
      return currentCapabilities.sizeOptions ?? flux2SizePresets.map((preset) => preset.value)
    }

    return currentCapabilities.sizeOptions ?? []
  }

  function getSelectedSizeDimensions(currentCapabilities: ModelCapabilities): { width: number; height: number } | null {
    if (currentCapabilities.model !== 'flux-2-pro' && currentCapabilities.sizeMode !== 'preset') {
      return null
    }

    return parseSizePreset(selectedSize)
  }

  async function loadCapabilities(): Promise<void> {
    const response = await fetch('/api/capabilities', {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = (await response.json()) as ModelCapabilities & { error?: string }

    if (!response.ok) {
      throw new Error(data.error || 'Failed to load model capabilities')
    }

    capabilities = data
    applyCapabilityDefaults(data)
  }

  onMount(() => {
    void (async () => {
      try {
        await loadCapabilities()
      } catch (loadError) {
        capabilitiesError = loadError instanceof Error ? loadError.message : 'Failed to load model capabilities'
      } finally {
        capabilitiesLoading = false
      }
    })()
  })

  function handleReferenceImageChange(event: Event): void {
    referenceImageError = ''

    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]

    if (!file) {
      referenceImageBase64 = ''
      return
    }

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      referenceImageError = 'Reference images must be PNG, JPEG, or WebP.'
      referenceImageBase64 = ''
      input.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      referenceImageBase64 = typeof reader.result === 'string' ? reader.result : ''
    }
    reader.onerror = () => {
      referenceImageError = 'Failed to read the selected reference image.'
      referenceImageBase64 = ''
    }
    reader.readAsDataURL(file)
  }

  function clearReferenceImage(): void {
    referenceImageBase64 = ''
    referenceImageError = ''

    if (referenceImageInput) {
      referenceImageInput.value = ''
    }
  }

  async function generateImage(): Promise<void> {
    if (!prompt) {
      error = 'Prompt is required'
      return
    }

    if (!capabilities) {
      error = 'Model capabilities are still loading'
      return
    }

    loading = true
    error = ''
    imageUrl = ''

    let modifiedPrompt = prompt
    if (presetStyle && intensityMatrix[presetStyle]) {
      const intensityAdjustment = intensityMatrix[presetStyle][styleIntensity]
      modifiedPrompt = `${intensityAdjustment} ${prompt}`
    }

    const body: Record<string, unknown> = { prompt: modifiedPrompt }

    if (capabilities.model === 'flux-2-pro') {
      const { width, height } = parseSizePreset(selectedSize)
      body.width = width
      body.height = height
    } else if (capabilities.sizeMode === 'preset') {
      body.size = selectedSize
    }

    if (capabilities.sizeMode === 'aspect_ratio') {
      body.aspectRatio = selectedAspectRatio
    }

    if (capabilities.supportsStyleParam) {
      body.style = style
    }

    if (capabilities.supportsQualityParam) {
      body.quality = quality
    }

    if (capabilities.supportsReferenceImage && referenceImageBase64) {
      body.referenceImage = referenceImageBase64
    }

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data: ImageResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image')
      }

      imageUrl = data.imageUrl
    } catch (generationError) {
      error = generationError instanceof Error ? generationError.message : 'An unexpected error occurred'
    } finally {
      loading = false
    }
  }

  function getMegapixels(width: number, height: number): number {
    return (width * height) / 1_000_000
  }
</script>

<style>
  /* Remove existing styles as Tailwind will handle them */

  .loading-dots {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .loading-dots div {
    width: 8px;
    height: 8px;
    margin: 0 4px;
    background-color: #ffffff;
    border-radius: 50%;
    animation: loading 0.8s infinite alternate;
  }

  .loading-dots div:nth-child(2) {
    animation-delay: 0.2s;
  }

  .loading-dots div:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes loading {
    from {
      transform: scale(1);
      opacity: 1;
    }
    to {
      transform: scale(1.5);
      opacity: 0.5;
    }
  }

  /* Responsive styles */
  @media (max-width: 768px) {
    p {
      font-size: 1rem;
    }
    input,
    select,
    button {
      width: 100%;
      margin-bottom: 1rem;
    }
    .flex {
      flex-direction: column;
    }
  }

  .icon-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
    max-width: 768px;
    margin: 0 auto;
  }

  @media (min-width: 768px) {
    .icon-grid {
      grid-template-columns: repeat(10, 1fr);
    }
  }

  .style-icon {
    width: 50px;
    height: 50px;
    cursor: pointer;
    border: 2px solid transparent;
    transition: border-color 0.3s;
    border-radius: 8px;
    overflow: hidden;
  }

  .style-icon.selected {
    border-color: #ff00ff;
    border-width: 3px;
    border-radius: 8px;
  }

  .heading-box {
    border: 1px solid #444;
    padding: 10px;
    margin-bottom: 10px;
    border-radius: 5px;
    position: relative;
    background-color: transparent;
  }

  .heading-label {
    position: absolute;
    top: -10px;
    left: 10px;
    background-color: transparent;
    padding: 0 5px;
    font-size: 0.8rem;
    color: #888;
  }
</style>

<div class="flex flex-col min-h-screen">
  <div class="flex-grow flex flex-col items-center justify-center bg-gray-900 text-gray-200">
    <img src="logo.png" alt="Galactic Canvas Logo" class="mb-2 max-w-full h-auto" style="max-height: 100px;" />
    <p class="text-lg mb-6 text-center">
      Craft stellar visuals from mere words with Galactic Canvas! 🚀✨<br>
      Ready to paint the universe? 🌌
    </p>

    <input
      type="text"
      bind:value={prompt}
      placeholder="Enter a prompt"
      class="p-2 border border-gray-700 rounded mb-4 w-160 bg-gray-800 text-gray-200"
      on:keydown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          void generateImage()
        }
      }}
    />

    {#if capabilitiesLoading}
      <p class="mb-4 text-sm text-gray-400">Loading model capabilities…</p>
    {:else if capabilitiesError}
      <div class="mb-4 text-red-500">{capabilitiesError}</div>
    {:else if capabilities}
      <div class="flex space-x-4 mb-4">
        {#if capabilities.model === 'flux-2-pro' || capabilities.sizeMode === 'preset'}
          <select bind:value={selectedSize} class="p-2 bg-gray-800 text-gray-200 rounded">
            {#each getSizeOptions(capabilities) as option}
              <option value={option}>{option}</option>
            {/each}
          </select>
        {/if}

        {#if capabilities.sizeMode === 'aspect_ratio'}
          <select bind:value={selectedAspectRatio} class="p-2 bg-gray-800 text-gray-200 rounded">
            {#each capabilities.aspectRatioOptions ?? [] as ratio}
              <option value={ratio}>{ratio}</option>
            {/each}
          </select>
        {/if}

        {#if capabilities.supportsStyleParam}
          <select bind:value={style} class="p-2 bg-gray-800 text-gray-200 rounded">
            <option value="natural">Natural</option>
            <option value="vivid">Vivid</option>
          </select>
        {/if}

        {#if capabilities.supportsQualityParam}
          <select bind:value={quality} class="p-2 bg-gray-800 text-gray-200 rounded">
            <option value="standard">Standard</option>
            <option value="hd">HD</option>
          </select>
        {/if}
      </div>

      {#if capabilities.model === 'flux-2-pro' || capabilities.sizeMode === 'preset'}
        {#if getSelectedSizeDimensions(capabilities)}
          <p class="mb-4 text-sm text-gray-400">
            Selected size: {selectedSize} ({getMegapixels(getSelectedSizeDimensions(capabilities)!.width, getSelectedSizeDimensions(capabilities)!.height).toFixed(2)} MP)
          </p>
        {/if}
      {/if}

      {#if capabilities.supportsReferenceImage}
        <div class="heading-box w-full max-w-3xl">
          <span class="heading-label">Reference image:</span>
          <div class="flex flex-col gap-3 mt-2">
            <input
              bind:this={referenceImageInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              on:change={handleReferenceImageChange}
              class="text-sm text-gray-300"
            />

            {#if referenceImageError}
              <div class="text-sm text-red-400">{referenceImageError}</div>
            {/if}

            {#if referenceImageBase64}
              <div class="flex items-start gap-4">
                <img src={referenceImageBase64} alt="" class="max-w-40 max-h-40 rounded border border-gray-700" />
                <button type="button" on:click={clearReferenceImage} class="px-3 py-1 rounded bg-gray-700 text-gray-200">
                  Remove
                </button>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    {/if}

    <div class="heading-box">
      <span class="heading-label">Art style:</span>
      <div class="icon-grid mb-4">
        {#each presetStyleEntries as [styleName, description] (styleName)}
          <button
            type="button"
            on:click={() => (presetStyle = presetStyle === styleName ? '' : styleName)}
            class:active={presetStyle === styleName}
            class:selected={presetStyle === styleName}
            aria-label={`Select ${styleName} style`}
            title={`${styleName}: ${description}`}
          >
            <img
              src={getIconForStyle(styleName)}
              alt={styleName}
              class="style-icon"
              class:selected={presetStyle === styleName}
            />
          </button>
        {/each}
      </div>
    </div>

    <div class="heading-box">
      <span class="heading-label">Style Intensity:</span>
      <div class="flex items-center mb-4">
        <label for="intensity" class="text-gray-200 mr-2">{styleIntensity}</label>
        <input type="range" id="intensity" min="1" max="3" step="1" bind:value={styleIntensity} class="flex-grow" />
      </div>
    </div>

    <button on:click={generateImage} disabled={loading || capabilitiesLoading || !capabilities} class="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
      Generate Image
    </button>

    {#if loading}
      <div class="loading-dots mt-4">
        <div></div>
        <div></div>
        <div></div>
      </div>
    {/if}

    {#if error}
      <div class="error mt-4 text-red-500">{error}</div>
    {/if}

    {#if imageUrl}
      <img src={imageUrl} alt="Generated artwork" class="mt-4 max-w-full h-auto" />
    {/if}
  </div>

  <footer class="w-full text-center py-2 bg-gray-800 text-gray-400">
    <p>
      Built by <a href="https://github.com/NeonTowel/galactic-canvas" target="_blank" class="text-blue-400 hover:text-blue-600">NeonTowel</a> 🚀✨<br>
      Powered by <a href="https://workers.cloudflare.com" target="_blank" class="text-blue-400 hover:text-blue-600">Cloudflare Workers</a> and private <a href="https://azure.microsoft.com/en-us/products/ai-services/openai-service" target="_blank" class="text-blue-400 hover:text-blue-600">Azure Foundry</a>.
    </p>
  </footer>
</div>
