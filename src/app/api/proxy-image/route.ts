import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
        return new NextResponse('Missing image URL', { status: 400 });
    }

    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();

        return new NextResponse(blob, {
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
                'Cache-Control': 'public, max-age=31536000',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        console.error('Error proxying image:', error);
        return new NextResponse('Failed to proxy image', { status: 500 });
    }
} 