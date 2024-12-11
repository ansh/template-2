
import { NextResponse } from "next/server";
import { YoutubeTranscript } from 'youtube-transcript';
import OpenAI from "openai";

const openai = new OpenAI();

export async function POST(req: Request) {
  try {
    const { videoUrl } = await req.json();
    const transcript = await YoutubeTranscript.fetchTranscript(videoUrl);
    const fullText = transcript.map(t => t.text).join(' ');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: "Extract 5 most meaningful and important quotes from the following transcript. Format each quote on a new line with quotation marks."
      }, {
        role: "user",
        content: fullText
      }]
    });

    const quotes = response.choices[0].message.content;
    
    return NextResponse.json({ quotes, fullText });
  } catch (error) {
    console.error("Error processing video:", error);
    return NextResponse.json({ error: "Failed to process video" }, { status: 500 });
  }
}
