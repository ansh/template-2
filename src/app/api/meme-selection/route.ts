import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Debug log to check if env var is loaded
console.log('ANTHROPIC_API_KEY length:', process.env.ANTHROPIC_API_KEY?.length);
console.log('ANTHROPIC_API_KEY first 10 chars:', process.env.ANTHROPIC_API_KEY?.substring(0, 10));

// Check if API key exists
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    // 2. Use Claude to select the best template and generate a caption
    const completion = await anthropic.messages.create({
      model: "claude-3-opus-20240229",  // Using the latest model
      max_tokens: 1000,
      messages: [
        {
          role: "system",
          content: `You are a meme expert. Given a list of meme templates and a user's prompt, 
          select the most appropriate template and generate a fitting caption. 
          Respond with valid JSON in this exact format:
          {
            "template": {
              "id": "(id of the selected template)",
              "name": "(name of the template)",
              "video_url": "(url of the template video)"
            },
            "caption": "(your generated caption)"
          }
          Available templates: ${JSON.stringify(templates)}`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.content[0].text);

    // Find the selected template from our database
    const selectedTemplate = templates.find(t => t.id === result.template.id);

    if (!selectedTemplate) {
      throw new Error('Selected template not found');
    }

    return NextResponse.json({
      template: selectedTemplate,
      caption: result.caption
    });

  } catch (error: any) {
    console.error('Error in meme selection:', error);
    
    // More specific error messages
    if (error.error?.type === 'authentication_error') {
      return NextResponse.json(
        { error: 'API configuration error. Please check your environment variables.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process meme selection', details: error.message },
      { status: 500 }
    );
  }
} 