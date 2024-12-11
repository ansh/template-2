import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import axios from 'axios';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function getVideoId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

async function extractMeaningfulQuotes(text: string, durationInSeconds: number): Promise<string[]> {
  try {
    // Calculate number of quotes based on video length (5 quotes per 10 minutes)
    const durationInMinutes = durationInSeconds / 60;
    const numberOfQuotes = Math.max(5, Math.min(20, Math.ceil(durationInMinutes / 2)));

    const prompt = `Extract ${numberOfQuotes} meaningful and impactful quotes from this transcript. Focus on longer, more substantive quotes that capture complete thoughts and key insights. Prioritize quotes that are 2-3 sentences long when possible. Format each quote on a new line, starting with a dash (-). Here's the transcript:\n\n${text}`;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert at identifying meaningful and impactful quotes from text. Extract longer quotes that capture complete thoughts and context. Prioritize quotes that are 2-3 sentences long when they convey connected ideas. Remove any timestamps or speaker labels."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-3.5-turbo",
    });

    // Extract quotes from the response
    const quotesText = completion.choices[0].message.content || '';
    const quotes = quotesText
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(quote => quote.length > 0);

    console.log('OpenAI extracted quotes:', quotes);
    return quotes;
  } catch (error) {
    console.error('OpenAI extraction error:', error);
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const { videoUrl } = await req.json();
    console.log('Processing video URL:', videoUrl);

    if (!videoUrl) {
      return NextResponse.json({ error: "Video URL is required" }, { status: 400 });
    }

    const videoId = getVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    console.log('Fetching transcript for video ID:', videoId);
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    if (!transcript || transcript.length === 0) {
      return NextResponse.json({ error: "No transcript available" }, { status: 404 });
    }

    // Calculate total duration from transcript
    const totalDuration = transcript.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    console.log('Video duration (seconds):', totalDuration);

    console.log('Transcript segments:', transcript.length);
    const fullText = transcript.map(t => t.text).join(' ');
    console.log('Full text length:', fullText.length);

    // Extract quotes using OpenAI, passing the duration
    const quotes = await extractMeaningfulQuotes(fullText, totalDuration);
    if (quotes.length === 0) {
      return NextResponse.json({ error: "Could not extract meaningful quotes" }, { status: 500 });
    }

    const apiKey = process.env.GOOGLE_CONSOLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        quotes,
        fullText,
        metadata: null,
        error: "YouTube API key not configured"
      });
    }

    try {
      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
      const response = await axios.get(apiUrl);
      const videoData = response.data.items[0].snippet;

      return NextResponse.json({
        quotes,
        fullText,
        metadata: {
          title: videoData.title,
          channelTitle: videoData.channelTitle,
          thumbnail: videoData.thumbnails.high.url
        }
      });
    } catch (e) {
      // Return quotes even if metadata fetch fails
      return NextResponse.json({
        quotes,
        fullText,
        metadata: null
      });
    }
  } catch (error: any) {
    console.error('Processing error:', error);
    return NextResponse.json({
      error: error.message || "Failed to process video"
    }, { status: 500 });
  }
}
