import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/utils/embeddings';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // Get all templates without embeddings
    const { data: templates, error: fetchError } = await supabase
      .from('meme_templates')
      .select('id, name, instructions')
      .is('embedding', null);

    if (fetchError) throw fetchError;

    if (!templates || templates.length === 0) {
      return NextResponse.json({ message: 'No templates need embedding updates' });
    }

    const updates = await Promise.all(
      templates.map(async (template) => {
        // Combine name and instructions for a rich description
        const description = `${template.name}. ${template.instructions || ''}`.trim();
        
        try {
          const embedding = await generateEmbedding(description);
          
          const { data, error } = await supabase
            .from('meme_templates')
            .update({
              description,
              embedding
            })
            .eq('id', template.id)
            .select()
            .single();

          if (error) throw error;
          
          return {
            id: template.id,
            status: 'success'
          };
        } catch (error) {
          console.error(`Error updating template ${template.id}:`, error);
          return {
            id: template.id,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    return NextResponse.json({
      processed: updates.length,
      results: updates
    });

  } catch (error: any) {
    console.error('Error in backfill operation:', error);
    return NextResponse.json(
      { error: 'Failed to backfill embeddings', details: error.message },
      { status: 500 }
    );
  }
} 