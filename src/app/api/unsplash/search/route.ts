import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const page = searchParams.get('page') || '1';

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=20&orientation=portrait`,
      {
        headers: {
          'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Unsplash');
    }

    const data = await response.json();
    
    // Log the first result to see its structure
    console.log('First photo from Unsplash:', JSON.stringify(data.results[0], null, 2));
    
    const results = data.results.map((photo: any) => ({
      id: photo.id,
      urls: {
        regular: photo.urls.regular,
        small: photo.urls.small,
      },
      user: {
        name: photo.user.name,
        username: photo.user.username,
        links: {
          html: photo.user.links.html, // Photographer profile URL
        },
      },
      links: {
        html: photo.links.html, // Photo page URL
        download_location: photo.links.download_location,
      },
    }));

    // Log the transformed result
    console.log('First transformed photo:', JSON.stringify(results[0], null, 2));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error fetching from Unsplash:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
} 