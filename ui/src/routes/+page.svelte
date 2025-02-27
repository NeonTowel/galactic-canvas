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

<div class="flex flex-col items-center justify-center min-h-screen bg-gray-100">
  <h1 class="text-4xl font-bold mb-6">AI Image Generator</h1>
  <input type="text" bind:value={prompt} placeholder="Enter a prompt" class="p-2 border border-gray-300 rounded mb-4 w-80" />
  <button on:click={generateImage} disabled={loading} class="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50">
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
