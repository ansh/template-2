import { NextResponse } from 'next/server';
import ytdl from 'ytdl-core';
import { createClient } from '@supabase/supabase-js';

// Create server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!ytdl.validateURL(url)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    console.log('Fetching video info...');
    const info = await ytdl.getInfo(url);
    
    console.log('Choosing format...');
    // Get the best format that includes both video and audio
    const format = ytdl.chooseFormat(info.formats, { 
      quality: 'highest',
      filter: 'videoandaudio'
    });

    console.log('Downloading video...');
    // Download the video as a buffer
    const videoBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = ytdl(url, { format });

      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', (err) => reject(err));
    });

    console.log('Uploading to Supabase...');
    // Upload to Supabase Storage
    const filename = `youtube-${Date.now()}.mp4`;
    const { data, error } = await supabase.storage
      .from('meme-templates')
      .upload(filename, videoBuffer, {
        contentType: 'video/mp4',
        cacheControl: '3600'
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('meme-templates')
      .getPublicUrl(data.path);

    console.log('Success! Public URL:', publicUrl);
    return NextResponse.json({ videoUrl: publicUrl });

  } catch (error) {
    console.error('YouTube download error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process YouTube video' },
      { status: 500 }
    );
  }
} 