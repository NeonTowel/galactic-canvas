<script>
  import { onMount } from 'svelte';
  let prompt = '';
  let imageUrl = '';
  let loading = false;
  let error = '';

  async function generateImage() {
    if (!prompt) {
      error = 'Prompt is required';
      return;
    }

    loading = true;
    error = '';
    imageUrl = '';

    try {
      const response = await fetch('/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
  .error {
    color: red;
    margin-top: 10px;
  }
  .loading {
    margin-top: 10px;
  }
</style>

<h1>AI Image Generator</h1>
<input type="text" bind:value={prompt} placeholder="Enter a prompt" />
<button on:click={generateImage} disabled={loading}>Generate Image</button>

{#if loading}
  <div class="loading">Loading...</div>
{/if}

{#if error}
  <div class="error">{error}</div>
{/if}

{#if imageUrl}
  <img src={imageUrl} alt="Generated Image" />
{/if} 