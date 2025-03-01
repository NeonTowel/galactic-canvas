<script>
  let prompt = '';
  let imageUrl = '';
  let loading = false;
  let error = '';
  let apiKey = import.meta.env.TOKEN;
  let size = '1024x1024';
  let style = 'natural';
  let quality = 'standard';

  async function generateImage() {
    if (!prompt) {
      error = 'Prompt is required';
      return;
    }

    console.log('Generating image with size:', size);

    loading = true;
    error = '';
    imageUrl = '';

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ prompt, size, style, quality })
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      imageUrl = data.imageUrl;
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
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
</style>

<div class="flex flex-col min-h-screen">
  <div class="flex-grow flex flex-col items-center justify-center bg-gray-900 text-gray-200">
    <h1 class="text-4xl font-bold mb-2">🚀 Galactic Canvas 🌌</h1>
    <p class="text-lg mb-6 text-center">
      Dive into the cosmos with Galactic Canvas! 🚀✨<br>
      Powered by Azure AI and DALL-E, our app lets you craft stellar visuals from mere words.<br>
      Running smoothly on <a href="https://workers.cloudflare.com" target="_blank" class="text-blue-400 hover:text-blue-600">Cloudflare Workers</a>, our private <a href="https://azure.microsoft.com/en-us/products/ai-services/openai-service" target="_blank" class="text-blue-400 hover:text-blue-600">Azure OpenAI</a> ensures your creativity knows no bounds. Ready to paint the universe? 🌌
    </p>
    <input type="text" bind:value={prompt} placeholder="Enter a prompt" class="p-2 border border-gray-700 rounded mb-4 w-160 bg-gray-800 text-gray-200" on:keydown={(e) => e.key === 'Enter' && generateImage()} />
    <div class="flex space-x-4 mb-4">
      <select bind:value={size} class="p-2 bg-gray-800 text-gray-200 rounded">
        <option value="1024x1024">1024x1024</option>
        <option value="1024x1792">1024x1792</option>
        <option value="1792x1024">1792x1024</option>
      </select>
      <select bind:value={style} class="p-2 bg-gray-800 text-gray-200 rounded">
        <option value="natural">Natural</option>
        <option value="vivid">Vivid</option>
      </select>
      <select bind:value={quality} class="p-2 bg-gray-800 text-gray-200 rounded">
        <option value="hd">HD</option>
        <option value="standard">Standard</option>
      </select>
    </div>
    <button on:click={generateImage} disabled={loading} class="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
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
      <img src={imageUrl} alt="Generated Image" class="mt-4 max-w-full h-auto" />
    {/if}
  </div>

  <footer class="w-full text-center py-2 bg-gray-800 text-gray-400">
    <p>
      Built by <a href="https://github.com/NeonTowel/galactic-canvas" target="_blank" class="text-blue-400 hover:text-blue-600">NeonTowel</a> 🚀✨ - Where code meets the cosmos!
    </p>
  </footer>
</div>
