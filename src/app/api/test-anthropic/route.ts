import { NextResponse } from 'next/server';

// Add interface for Anthropic API response
interface AnthropicMessage {
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
}

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export const dynamic = 'force-dynamic';

export async function GET() {
  // Only make the API call when actually called, not during build
  if (process.env.NODE_ENV === 'development') {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found in environment' }, { status: 500 });
    }

    try {
      const requestBody = {
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [{ role: "user", content: "Hello" }]
      };

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'anthropic-version': '2024-01-01',
          'content-type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${JSON.stringify(data)}`);
      }

      return NextResponse.json({
        success: true,
        response: data.content[0]?.text ?? '',
        fullResponse: data
      });

    } catch (error: any) {
      console.error('Request failed:', {
        message: error.message,
        status: error.status
      });
      
      return NextResponse.json({
        error: error.message,
        type: 'request_failed'
      }, { 
        status: 500 
      });
    }
  }

  // During build time, return a mock response
  return NextResponse.json({
    success: true,
    response: 'Test route - build time response'
  });
} 