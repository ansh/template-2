import { StreamingTextResponse } from 'ai';
import Anthropic from '@anthropic-ai/sdk';
import { MEME_SYSTEM_PROMPT } from '@/lib/utils/prompts';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    // Add more detailed API key checking
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is missing in environment');
      return new Response(
        JSON.stringify({ 
          error: 'ANTHROPIC_API_KEY is not configured',
          details: 'Please check environment variables configuration'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Test API key format
    if (!process.env.ANTHROPIC_API_KEY.startsWith('sk-')) {
      console.error('ANTHROPIC_API_KEY appears to be invalid');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid API key format',
          details: 'The API key does not match the expected format'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { messages } = await req.json();

    // First get the available templates from the last user message
    const lastMessage = messages[messages.length - 1];
    const templateMatches = lastMessage.content.match(/\d+\.\s+([^\n]+)/g);
    
    // Get a non-streaming response first
    const nonStreamingResponse = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      messages: [{
        role: 'user',
        content: `Given these templates:
${lastMessage.content}

Select the best template number (1-${templateMatches?.length || 5}) and write a caption for it.
Format your response EXACTLY like this:
TEMPLATE: [number]
CAPTION: [caption]`
      }],
      stream: false,
      max_tokens: 1024,
      temperature: 0.7,
      system: MEME_SYSTEM_PROMPT
    });

    // Get the text content from the response
    const content = nonStreamingResponse.content[0].type === 'text' 
      ? nonStreamingResponse.content[0].text
      : '';

    console.log('Full response:', content);

    // Extract template and caption
    const templateMatch = content.match(/TEMPLATE:\s*(\d+)/i);
    const captionMatch = content.match(/CAPTION:\s*(.+?)(?=\n|$)/i);

    if (!templateMatch || !captionMatch) {
      // If we can't parse the format, try to extract what we can
      const numberMatch = content.match(/(\d+)/);
      const number = numberMatch ? numberMatch[1] : '1';
      const text = content.replace(/(\d+)/, '').trim();

      // Create a response with what we could extract
      const formattedResponse = {
        template: parseInt(number),
        caption: text
      };

      return new Response(JSON.stringify(formattedResponse), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create a properly formatted response
    const formattedResponse = {
      template: parseInt(templateMatch[1]),
      caption: captionMatch[1].trim()
    };

    return new Response(JSON.stringify(formattedResponse), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // Enhanced error logging
    console.error('Anthropic API error details:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      apiKeyExists: !!process.env.ANTHROPIC_API_KEY,
      apiKeyLength: process.env.ANTHROPIC_API_KEY?.length || 0
    });

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An error occurred',
        details: 'Check server logs for more information'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 