import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import FormData from 'form-data';

// Initialize Gemini
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set in environment variables');
}

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genai.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
  generationConfig: {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
  }
});

function getVideoId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function cleanTranscript(text: string): string {
  return text
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function extractQuotes(text: string): Promise<string[]> {
  try {
    const prompt = `Extract the most meaningful and impactful quotes from this transcript. Focus on complete thoughts, key insights, and memorable statements. Each quote should be self-contained and valuable on its own.

Rules:
- Extract up to 30 quotes maximum
- Each quote should be on a new line starting with a dash (-)
- Focus on complete thoughts and insights
- Include both short impactful statements and longer detailed insights
- Remove any timestamps or speaker labels
- Keep quotes that provide value and context

Here's the transcript:

${text}

Format your response as a list of quotes, each starting with a dash (-).`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const quotes = response.text()
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(quote => quote.length > 0)
      .slice(0, 30); // Ensure maximum of 30 quotes

    return quotes;
  } catch (error) {
    console.error('Quote extraction error:', error);
    throw new Error('Failed to extract quotes from transcript');
  }
}

async function getVideoMetadata(videoId: string) {
  try {
    const apiKey = process.env.GOOGLE_CONSOLE_API_KEY;
    if (!apiKey) return null;

    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
    );

    const videoData = response.data.items[0]?.snippet;
    if (!videoData) return null;

    return {
      title: videoData.title,
      channelTitle: videoData.channelTitle,
      thumbnail: videoData.thumbnails.maxres?.url || videoData.thumbnails.high?.url || videoData.thumbnails.default?.url
    };
  } catch (error) {
    console.error('Failed to fetch video metadata:', error);
    return null;
  }
}

function formatTranscriptWithSpeakers(transcript: any[]): string {
  let currentSpeaker = 1;
  let lastTimestamp = 0;
  let formattedText = '';

  transcript.forEach((segment, index) => {
    // Change speaker if there's a significant time gap (e.g., 2 seconds)
    if (segment.offset - lastTimestamp > 2000) {
      currentSpeaker = currentSpeaker === 1 ? 2 : 1;
    }

    formattedText += `Speaker ${currentSpeaker}: ${segment.text.trim()}\n`;
    lastTimestamp = segment.offset;
  });

  return formattedText;
}

async function createPodcastSummary(transcript: string): Promise<string> {
  try {
    const prompt = `Create a concise 5-minute podcast script summary of this transcript. Focus on the key points and insights. Format it as a natural conversation between two speakers.
    
The summary should:
- Speaker 1 should ask questions about the content and events, while Speaker 2 provides detailed answers and commentary
- Format as a discussion/commentary about the content, not a recreation. START WITH AN OVERALL SUMMARY IN THE FORM OF A QUESTION FROM SPEAKER 1 TO SPEAKER 2 AND OUTLINE WHAT THEY WILL DISCUSS IN THAT RESPONSE
- Be around 750-1000 words (about 5 minutes when spoken)
- Start with "Speaker 1:" and alternate between speakers
- Use conversational language
- Maintain the core message and key takeaways
- Include brief transitions between topics
- Keep the tone analytical and reflective, like commentators discussing the material

Here's the transcript:
    ${transcript}`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();
    return summary;
  } catch (error) {
    console.error('Summary generation error:', error);
    throw new Error('Failed to generate podcast summary');
  }
}

async function generatePodcast(transcriptText: string) {
  try {
    if (!process.env.PLAY_AUTH || !process.env.X_USER_ID) {
      throw new Error('Missing required Play.ai credentials');
    }

    // First generate a 5-minute summary
    console.log('Status: Generating podcast summary...');
    const podcastScript = await createPodcastSummary(transcriptText);
    console.log('Status: Summary generated successfully');

    // Configure the request payload
    console.log('Status: Preparing TTS request...');
    const reqBody = {
      outputFormat: 'mp3',
      language: 'english',
      speed: 1,
      model: 'PlayDialog',
      text: podcastScript,
      voice: 's3://voice-cloning-zero-shot/ZaAWraQ7C3urra8hfWRa9/riley-brown/manifest.json',
      voice2: 's3://voice-cloning-zero-shot/j1uPNqNacVEtHOKMjQ1hC/ansh/manifest.json',
      turnPrefix: 'Speaker 1:',
      turnPrefix2: 'Speaker 2:'
    };

    console.log('Status: Sending request to Play.ai...');
    const response = await axios.post('https://api.play.ai/api/v1/tts/stream', reqBody, {
      headers: {
        'Authorization': `Bearer ${process.env.PLAY_AUTH}`,
        'Content-Type': 'application/json',
        'X-USER-ID': process.env.X_USER_ID
      },
      responseType: 'arraybuffer'
    });

    console.log('Status: Audio generated successfully');
    const audioBase64 = Buffer.from(response.data).toString('base64');

    return {
      status: 'complete',
      audioUrl: `data:audio/mp3;base64,${audioBase64}`,
      summary: podcastScript // Return the summary text as well
    };
  } catch (error) {
    console.error('Podcast generation error:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data
        ? Buffer.from(error.response.data).toString()
        : error.message;
      throw new Error(`Play.ai API error: ${errorMessage}`);
    }
    throw new Error(error instanceof Error ? error.message : 'Failed to generate podcast');
  }
}

export async function POST(req: Request) {
  try {
    const { videoUrl, generatePodcastAudio } = await req.json();

    if (!videoUrl) {
      return NextResponse.json({ error: "Video URL is required" }, { status: 400 });
    }

    const videoId = getVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    const [transcript, metadata] = await Promise.all([
      YoutubeTranscript.fetchTranscript(videoId),
      getVideoMetadata(videoId)
    ]);

    if (!transcript || transcript.length === 0) {
      return NextResponse.json({ error: "No transcript available for this video" }, { status: 404 });
    }

    const fullText = transcript.map(t => t.text).join(' ');
    const cleanedText = cleanTranscript(fullText);
    const formattedTranscript = formatTranscriptWithSpeakers(transcript);

    if (cleanedText.length < 100) {
      return NextResponse.json({ error: "Transcript is too short" }, { status: 400 });
    }

    const quotes = await extractQuotes(cleanedText);

    if (!quotes || quotes.length === 0) {
      return NextResponse.json({ error: "Could not extract meaningful quotes" }, { status: 500 });
    }

    let podcastData = null;
    if (generatePodcastAudio) {
      podcastData = await generatePodcast(formattedTranscript);
    }

    return NextResponse.json({
      quotes,
      metadata,
      transcript: cleanedText,
      formattedTranscript,
      podcastData
    });

  } catch (error: any) {
    console.error('Processing error:', error);
    return NextResponse.json({
      error: error.message || "Failed to process video"
    }, { status: 500 });
  }
}
