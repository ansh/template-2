
import { NextResponse } from "next/server";
import { YoutubeTranscript } from 'youtube-transcript';
import OpenAI from "openai";
import axios from 'axios';

const openai = new OpenAI();

export async function POST(req: Request) {
  try {
    const { videoUrl } = await req.json();
    if (!videoUrl) {
      return NextResponse.json({ error: "Video URL is required" }, { status: 400 });
    }

    const videoId = videoUrl.split('v=')[1];
    if (!videoId) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }
    
    // Get transcript
    const transcript = await YoutubeTranscript.fetchTranscript(videoUrl).catch(err => {
      console.error("Transcript error:", err);
      throw new Error("Failed to fetch video transcript");
    });
    const fullText = transcript.map(t => t.text).join(' ');
    
    // Get video metadata
    const apiKey = process.env.GOOGLE_CONSOLE_API_KEY;
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
    const response = await axios.get(apiUrl);
    
    const videoData = response.data.items[0].snippet;
    const metadata = {
      title: videoData.title,
      thumbnail: videoData.thumbnails.high.url,
      description: videoData.description,
      publishedAt: videoData.publishedAt,
      channelTitle: videoData.channelTitle
    };

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: "Extract 5 most meaningful and important quotes from the following transcript. Format each quote on a new line with quotation marks."
      }, {
        role: "user",
        content: fullText
      }]
    });

    const quotes = aiResponse.choices[0].message.content;
    
    return NextResponse.json({ quotes, fullText, metadata });
  } catch (error) {
    console.error("Error processing video:", error);
    return NextResponse.json({ error: "Failed to process video" }, { status: 500 });
  }
}
