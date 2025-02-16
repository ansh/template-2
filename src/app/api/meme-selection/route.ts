import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

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

    // 1. Get all templates from Supabase
    const { data: templates, error } = await supabase
      .from('meme_templates')
      .select('*');

    if (error) throw error;

    if (!templates || templates.length === 0) {
      throw new Error('No meme templates available');
    }

    // 2. Use GPT-4 to select the best template and generate a caption
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "user",
          content: `You are a meme expert. Given a list of meme templates and a user's prompt, 
          select the most appropriate template and generate a fitting caption.

          Available templates:
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