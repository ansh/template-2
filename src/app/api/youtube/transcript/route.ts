
import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import axios from 'axios';

function getVideoId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function extractMeaningfulQuotes(text: string): string[] {
  const sentences = text.split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  const meaningfulQuotes = sentences.filter(sentence => {
    const hasMinWords = sentence.split(' ').length >= 5;
    const hasGoodLength = sentence.length >= 50 && sentence.length <= 200;
    const isNotTimestamp = !/^\d+:\d+/.test(sentence);
    const isNotBracket = !/^\[.*\]/.test(sentence);
    const hasLetters = /[a-zA-Z]/.test(sentence);
    
    return hasMinWords && hasGoodLength && isNotTimestamp && isNotBracket && hasLetters;
  });

  return meaningfulQuotes.slice(0, 10);
}

export async function POST(req: Request) {
  try {
    const { videoUrl } = await req.json();
    if (!videoUrl) {
      return NextResponse.json({ error: "Video URL is required" }, { status: 400 });
    }

    const videoId = getVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }
    
    const transcript = await YoutubeTranscript.fetchTranscript(videoUrl);
    if (!transcript || transcript.length === 0) {
      return NextResponse.json({ error: "No transcript available" }, { status: 404 });
    }
    
    const fullText = transcript.map(t => t.text).join(' ');
    const quotes = extractMeaningfulQuotes(fullText);
    
    // Get video metadata
    const apiKey = process.env.GOOGLE_CONSOLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "YouTube API key not configured" }, { status: 500 });
    }

    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
    const response = await axios.get(apiUrl);
    
    const videoData = response.data.items[0].snippet;
    const metadata = {
      title: videoData.title,
      channelTitle: videoData.channelTitle,
      thumbnail: videoData.thumbnails.high.url
    };

    return NextResponse.json({
      quotes,
      fullText,
      metadata
    });

  } catch (error: any) {
    const errorMessage = error.message || "Failed to process video";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
