import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not found in environment' }, { status: 500 });
  }

  try {
    const requestBody = {
      model: "claude-3-opus-20240229",
      max_tokens: 1024,
      messages: [{ role: "user", content: "Hello" }]
    };

    console.log('Making request...');

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
    console.log('Response status:', response.status);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${JSON.stringify(data)}`);
    }

    return NextResponse.json({
      success: true,
      response: data.content[0].text,
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