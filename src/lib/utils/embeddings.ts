import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmbedding(text: string) {
  // Call OpenAI directly from server-side code instead of making a fetch request
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  });

  console.log('Generated embedding length:', response.data[0].embedding.length); // Should be 1536
  return response.data[0].embedding;
}

export function cosineSimilarity(a: number[], b: any) {
  // Check if b is an array, if not, try to parse it
  let bArray: number[];
  
  if (!Array.isArray(b)) {
    try {
      // If b is a string representation of an array, parse it
      if (typeof b === 'string' && (b.startsWith('[') || b.includes(','))) {
        bArray = JSON.parse(b);
      } else {
        console.error('Invalid embedding format:', typeof b, b?.slice?.(0, 20));
        return 0; // Return 0 similarity for invalid format
      }
    } catch (error) {
      console.error('Error parsing embedding:', error);
      return 0; // Return 0 similarity for parsing error
    }
  } else {
    bArray = b;
  }
  
  // Now perform the calculation with the array
  const dotProduct = a.reduce((sum, val, i) => sum + val * bArray[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(bArray.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
} 