<script>
  let prompt = '';
  let imageUrl = '';
  let loading = false;
  let error = '';
  let apiKey = import.meta.env.TOKEN;

  async function generateImage() {
    if (!prompt) {
      error = 'Prompt is required';
      return;
    }

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
        body: JSON.stringify({ prompt })
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
</style>

<div class="flex flex-col min-h-screen">
  <div class="flex-grow flex flex-col items-center justify-center bg-gray-900 text-gray-200">
    <h1 class="text-4xl font-bold mb-2">🚀 Galactic Canvas 🌌</h1>
    <p class="text-lg mb-6 text-center">
      Dive into the cosmos with Galactic Canvas! 🚀✨<br>
      Powered by Azure AI and DALL-E, our app lets you craft stellar visuals from mere words.<br>
      Running smoothly on Cloudflare Workers, our private Azure OpenAI ensures your creativity knows no bounds. Ready to paint the universe? 🌌
    </p>
    <input type="text" bind:value={prompt} placeholder="Enter a prompt" class="p-2 border border-gray-700 rounded mb-4 w-160 bg-gray-800 text-gray-200" on:keydown={(e) => e.key === 'Enter' && generateImage()} />
    <button on:click={generateImage} disabled={loading} class="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
      Generate Image
    </button>

    {#if loading}
      <div class="loading mt-4 text-lg">Loading...</div>
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
