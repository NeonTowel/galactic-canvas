import { AzureOpenAI } from 'openai';

// Required Azure OpenAI deployment name and API version
const apiVersion = "2024-02-01";
const deployment = "dall-e-3";

// Define the expected response structure
interface AzureAIResponse {
  imageUrl?: string; // Make it optional if it might be missing
  // Add other properties if necessary
}

export async function generateImage(prompt: string, endpoint: string, apiKey: string): Promise<string> {
  const client = new AzureOpenAI({
    endpoint,
    apiKey,
    apiVersion,
    deployment
  });

  try {
    const response = await client.images.generate({
      prompt: prompt,
      size: "1792x1024",
      n: 1,
      quality: "hd",
      style: "vivid"
    });

    console.log(response); // Log the response to inspect its structure

    return response.data[0].url || ''; // Adjust based on the actual response structure
  } catch (error) {
    console.error('Failed to call Azure API', error);
    throw new Error('Failed to call Azure API');
  }
} 