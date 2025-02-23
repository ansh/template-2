import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Add error checking for API key
if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    'OPENAI_API_KEY is not set. Please add it to your environment variables.'
  );
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });

    return NextResponse.json({ embedding: response.data[0].embedding });
  } catch (error) {
    console.error('Error generating embedding:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate embedding',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 