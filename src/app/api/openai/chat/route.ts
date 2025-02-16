import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: messages.map((message: any) => ({
      role: message.role,
      content: message.content,
    })),
    stream: true,
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
} 