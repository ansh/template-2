import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { concept, templateName, instructions } = await request.json();
    
    // TODO: Implement actual caption generation with AI
    // For now, return a mock caption
    const caption = `When ${concept} 😂`;
    
    return NextResponse.json({ caption });
  } catch (error) {
    console.error('Error generating caption:', error);
    return NextResponse.json(
      { error: 'Failed to generate caption' },
      { status: 500 }
    );
  }
} 