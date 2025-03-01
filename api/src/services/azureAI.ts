import { AzureOpenAI } from 'openai';

// Required Azure OpenAI deployment name and API version
const apiVersion = "2024-02-01";
const deployment = "dall-e-3";

// Define the expected response structure
interface AzureAIResponse {
  imageUrl?: string; // Make it optional if it might be missing
  // Add other properties if necessary
}

// Define types for size, style, and quality
const validSizes = ["256x256", "512x512", "1024x1024", "1792x1024", "1024x1792"] as const;
const validQualities = ["standard", "hd"] as const;
const validStyles = ["vivid", "natural"] as const;

type Size = typeof validSizes[number];
type Quality = typeof validQualities[number];
type Style = typeof validStyles[number];

export async function generateImage(prompt: string, endpoint: string, apiKey: string, size: Size, style: Style, quality: Quality): Promise<string> {
  const client = new AzureOpenAI({
    endpoint,
    apiKey,
    apiVersion,
    deployment
  });

  try {
    const response = await client.images.generate({
      prompt: prompt,
      size: size,
      n: 1,
      quality: quality,
      style: style
    });

    return response.data[0].url || ''; // Adjust based on the actual response structure
  } catch (error) {
    console.error('Failed to call Azure API', error);
    throw new Error('Failed to call Azure API');
  }
} 