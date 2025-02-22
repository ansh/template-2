import { StreamingTextResponse } from 'ai';
import Anthropic from '@anthropic-ai/sdk';
import { getMemeSystemPrompt } from '@/lib/utils/prompts';

// Add interface at the top of the file
interface TemplateDetail {
  number: number;
  name: string;
}

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
    const lastMessage = messages[messages.length - 1];
    const audience = lastMessage.audience || 'general audience';

    const systemPrompt = getMemeSystemPrompt(audience);

    // Extract template numbers and names for debugging
    const templateMatches = lastMessage.content.match(/(\d+)\.\s+([^\n]+)/g);
    const templateDetails = templateMatches?.map((match: string) => {
      const matchResult = match.match(/(\d+)\.\s+(.+)/);
      const [_, number, name] = matchResult || ['', '', ''];
      return { number: parseInt(number || '0'), name: name || '' };
    });

    // Get a non-streaming response with multiple captions
    const nonStreamingResponse = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      messages: [{
        role: 'user',
        content: `Given these templates:
${lastMessage.content}

Select TWO best templates and write THREE different captions for each.`
      }],
      stream: false,
      max_tokens: 1024,
      temperature: 0.7,
      system: systemPrompt
    });

    const content = nonStreamingResponse.content[0].type === 'text' 
      ? nonStreamingResponse.content[0].text
      : '';

    console.log('=== DEBUG: Template Selection ===');
    console.log('Raw AI Response:', content);
    
    // Updated parsing logic to handle two templates
    const templates = content.split(/TEMPLATE [12]:/g).filter(Boolean);
    
    console.log('Split templates:', templates);

    const results = templates.map((template, index) => {
      // First try to find the template name in the first line
      const firstLine = template.trim().split('\n')[0];
      console.log('First line:', firstLine);

      // Find the matching template from our template details
      const matchingTemplate = templateDetails?.find((t: TemplateDetail) => 
        firstLine.toLowerCase().includes(t.name.toLowerCase())
      );

      const templateNumber = matchingTemplate?.number || index + 1;
      
      console.log('Template matching:', {
        firstLine,
        matchingTemplate,
        templateNumber
      });

      const captions = template
        .split('\n')
        .map(line => line.trim())
        .filter(line => /^\d+\.\s*"?.+?"?$/.test(line))
        .map(line => line.replace(/^\d+\.\s*|"|^\s*|\s*$/g, '').trim());

      return {
        template: templateNumber,
        captions: captions.length > 0 ? captions : ['No captions found']
      };
    });

    console.log('Final results:', results);

    return new Response(JSON.stringify({
      templates: results
    }), {
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