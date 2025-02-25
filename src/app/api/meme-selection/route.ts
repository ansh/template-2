import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { generateEmbedding, cosineSimilarity } from '@/lib/utils/embeddings';
import { MemeTemplate } from '@/lib/supabase/types';

// Use environment variables with error checking
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt, isGreenscreenMode } = await req.json();
    console.log('Processing prompt:', prompt, 'Greenscreen mode:', isGreenscreenMode);

    // First check if we have any templates at all
    const { data: allTemplates, error: checkError } = await supabase
      .from('meme_templates')
      .select('id, name, embedding')
      .eq('is_greenscreen', isGreenscreenMode);
    
    console.log('Total matching templates:', allTemplates?.length);

    // Generate embedding for the user's prompt
    const promptEmbedding = await generateEmbedding(prompt);
    console.log('Generated embedding successfully');

    // Add more detailed logging
    console.log('Calling match_meme_templates with params:', {
      embedding_length: promptEmbedding.length,
      match_threshold: 0.0,
      match_count: 5,
      is_greenscreen_filter: isGreenscreenMode
    });

    // Query templates using vector similarity, adding greenscreen filter
    const { data: templates, error } = await supabase
      .rpc('match_meme_templates', {
        query_embedding: promptEmbedding,
        match_threshold: 0.0,
        match_count: 5,
        is_greenscreen_filter: isGreenscreenMode
      });

    if (error) {
      console.error('RPC error:', error);
      throw error;
    }

    console.log('Templates returned from similarity search:', templates?.length || 0);
    
    // If no matches, use fallback with greenscreen filter
    if (!templates || templates.length === 0) {
      console.log('No templates found, using fallback');
      const { data: fallbackTemplates, error: fallbackError } = await supabase
        .from('meme_templates')
        .select('*')
        .eq('is_greenscreen', isGreenscreenMode)
        .limit(5);

      if (fallbackError) throw fallbackError;
      if (!fallbackTemplates || fallbackTemplates.length === 0) {
        throw new Error('No matching templates available');
      }

      return NextResponse.json({ templates: fallbackTemplates });
    }

    if (templates && templates.length > 0) {
      return NextResponse.json({ templates });
    }

  } catch (error: any) {
    console.error('Error in meme selection:', error);
    return NextResponse.json(
      { error: 'Failed to process meme selection', details: error.message },
      { status: 500 }
    );
  }
} 