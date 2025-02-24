import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const downloadLocation = searchParams.get('downloadLocation');

  if (!downloadLocation) {
    return NextResponse.json({ error: 'Download location is required' }, { status: 400 });
  }

  try {
    const response = await fetch(downloadLocation, {
      headers: {
        'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to track download');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking download:', error);
    return NextResponse.json(
      { error: 'Failed to track download' },
      { status: 500 }
    );
  }
} 