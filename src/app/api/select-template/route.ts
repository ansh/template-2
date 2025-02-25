import { NextResponse } from 'next/server';
import { MemeTemplate } from '@/lib/supabase/types';

// Mock data - replace with actual database query
const mockTemplates: MemeTemplate[] = [
  {
    id: '1',
    name: 'Confused Math Lady',
    video_url: '/templates/confused-math-lady.mp4',
    instructions: 'Use for situations involving confusion or complex calculations',
    examples: ['When trying to understand crypto', 'Calculating the tip at restaurants'],
    tags: ['confusion', 'math', 'thinking']
  }
];

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    
    // TODO: Implement actual template selection logic
    // For now, return the first template
    const template = mockTemplates[0];
    
    return NextResponse.json({
      template,
      explanation: `Selected "${template.name}" because it matches your concept of ${prompt}`
    });
  } catch (error) {
    console.error('Error selecting template:', error);
    return NextResponse.json(
      { error: 'Failed to select template' },
      { status: 500 }
    );
  }
} 