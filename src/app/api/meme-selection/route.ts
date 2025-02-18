import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { generateEmbedding } from '@/lib/utils/embeddings';

// Use environment variables with error checking
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    // Generate embedding for the user's prompt
    const promptEmbedding = await generateEmbedding(prompt);

    // Query templates using vector similarity
    const { data: templates, error } = await supabase
      .rpc('match_meme_templates', {
        query_embedding: promptEmbedding,
        match_threshold: 0.5, // Adjust this threshold as needed
        match_count: 5 // Get top 5 matches
      });

    if (error) throw error;

    if (!templates || templates.length === 0) {
      throw new Error('No matching meme templates found');
    }

    // Use GPT-4 to select the best template from matches and generate caption
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "user",
          content: `You are an expert meme creator with deep insider knowledge for whatever target audience the user requests. You understand the nuanced dynamics, inside jokes, and shared experiences that only someone embedded in this space would know. Your goal is to generate memes that will make insiders laugh through recognition of specific, relatable situations.

          Meme Generation Rules:
          - Keep text ultra-concise (1 short sentence max)
          - Use specific, insider terminology 
          - Focus on universal tensions/ironies within the space
          - Trust viewers to make connections
          - Avoid explaining the joke or using obvious adjectives
          - Capture moments of immediate recognition
          - Let structure carry the humor
          - Reference specific tools/situations/roles, not generic concepts
          - Be edgy and self-deprecating and not afraid to offend or be sarcastic
          - Don't be generic or predictable

          Available templates (ordered by relevance to prompt):
          ${JSON.stringify(templates)}

          User prompt: ${prompt}

          Respond with valid JSON in this exact format:
          {
            "templateId": "(id of the selected template)",
            "caption": "(your generated caption)"
          }`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    const result = JSON.parse(content);

    // Find the selected template from our database
    const selectedTemplate = templates.find(t => t.id === result.templateId);

    if (!selectedTemplate) {
      throw new Error('Selected template not found');
    }

    return NextResponse.json({
      template: selectedTemplate,
      caption: result.caption
    });

  } catch (error: any) {
    console.error('Error in meme selection:', error);
    
    return NextResponse.json(
      { error: 'Failed to process meme selection', details: error.message },
      { status: 500 }
    );
  }
} 