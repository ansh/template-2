import { StreamingTextResponse } from 'ai';
import Anthropic from '@anthropic-ai/sdk';
import { MEME_SYSTEM_PROMPT } from '@/lib/utils/prompts';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }

    const { messages } = await req.json();
    console.log('Received messages:', messages);

    const anthropicMessages = messages.map((message: any) => ({
      role: message.role === 'user' ? 'user' : 'assistant',
      content: message.content,
    }));

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      messages: anthropicMessages,
      stream: true,
      max_tokens: 1024,
      temperature: 0.7,
      system: MEME_SYSTEM_PROMPT
    });

    console.log('Anthropic response received');
    
    // Convert the Anthropic stream to a Web standard ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            // Check for text content in the delta
            if (chunk.type === 'content_block_delta' && 'text' in chunk.delta) {
              controller.enqueue(chunk.delta.text);
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });
    
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('Anthropic API error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }),
      { status: 500 }
    );
  }
} 