import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/utils/embeddings';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { id, description } = await req.json();

    // Generate embedding for the description
    const embedding = await generateEmbedding(description);

    // Update the template with the new description and embedding
    const { data, error } = await supabase
      .from('meme_templates')
      .update({
        description,
        embedding
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating template embedding:', error);
    return NextResponse.json(
      { error: 'Failed to update template embedding', details: error.message },
      { status: 500 }
    );
  }
} 