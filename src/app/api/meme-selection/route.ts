import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { generateEmbedding } from '@/lib/utils/embeddings';
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
    const { prompt } = await req.json();
    console.log('Processing prompt:', prompt);

    // First check if we have any templates at all
    const { data: allTemplates, error: checkError } = await supabase
      .from('meme_templates')
      .select('id, name, embedding');
    
    console.log('Total templates:', allTemplates?.length);
    console.log('Templates with embeddings:', allTemplates?.filter(t => t.embedding).length);

    // Generate embedding for the user's prompt
    const promptEmbedding = await generateEmbedding(prompt);
    console.log('Generated embedding successfully');

    // Query templates using vector similarity
    const { data: templates, error } = await supabase
      .rpc('match_meme_templates', {
        query_embedding: promptEmbedding,
        match_threshold: 0.8, // Increased from 0.0 to 0.8 for high relevance
        match_count: 5
      });

    if (error) {
      console.error('RPC error:', error);
      throw error;
    }

    console.log('Templates returned:', templates?.length);
    console.log('Similarity scores:', templates?.map(t => ({
      name: t.name,
      similarity: t.similarity
    })));
    
    if (!templates || templates.length === 0) {
      console.log('No templates found, using fallback');
      // If no matches, just return some random templates as fallback
      const { data: fallbackTemplates, error: fallbackError } = await supabase
        .from('meme_templates')
        .select('*')
        .limit(5);

      if (fallbackError) throw fallbackError;
      if (!fallbackTemplates || fallbackTemplates.length === 0) {
        throw new Error('No templates available in database');
      }

      return NextResponse.json({ templates: fallbackTemplates });
    }

    return NextResponse.json({ templates });

  } catch (error: any) {
    console.error('Error in meme selection:', error);
    return NextResponse.json(
      { error: 'Failed to process meme selection', details: error.message },
      { status: 500 }
    );
  }
} 