
import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import axios from 'axios';

function getVideoId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function chunkText(text: string, maxLength: number = 2000): string[] {
  const sentences = text.split(/[.!?]+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence + '. ';
    }
  }
  
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}

function extractQuotes(text: string, minLength: number = 50): string[] {
  const sentences = text.split(/[.!?]+/).map(s => s.trim());
  return sentences
    .filter(s => s.length >= minLength && s.length <= 200)
    .slice(0, 20); // Get top 20 quotes
}

export async function POST(req: Request) {
  try {
    const { videoUrl } = await req.json();
    if (!videoUrl) {
      return NextResponse.json({ error: "Video URL is required" }, { status: 400 });
    }

    const videoId = getVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json({ error: "Invalid YouTube URL - Could not extract video ID" }, { status: 400 });
    }
    
    const transcript = await YoutubeTranscript.fetchTranscript(videoUrl);
    if (!transcript || transcript.length === 0) {
      return NextResponse.json({ error: "No transcript available for this video" }, { status: 404 });
    }
    
    const fullText = transcript.map(t => t.text).join(' ');
    
    // Get video metadata
    const apiKey = process.env.GOOGLE_CONSOLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "YouTube API key is not configured" }, { status: 500 });
    }

    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
    const response = await axios.get(apiUrl).catch(err => {
      if (err.response?.status === 403) {
        throw new Error("Invalid or unauthorized YouTube API key");
      }
      throw err;
    });
    
    const videoData = response.data.items[0].snippet;
    const metadata = {
      title: videoData.title,
      channelTitle: videoData.channelTitle,
      thumbnail: videoData.thumbnails.high.url
    };

    // Chunk the text and extract quotes from each chunk
    const chunks = chunkText(fullText);
    const allQuotes = chunks.flatMap(chunk => extractQuotes(chunk));
    const uniqueQuotes = [...new Set(allQuotes)];
    
    return NextResponse.json({
      quotes: uniqueQuotes.join('\n'),
      fullText,
      metadata
    });

  } catch (error: any) {
    const errorMessage = error.message || "Failed to process video";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
