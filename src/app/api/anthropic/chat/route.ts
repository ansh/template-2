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

Select the best template number (1-${templateMatches?.length || 5}) and write THREE different captions for it.`
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
    
    // Try multiple regex patterns
    const templatePatterns = [
      /TEMPLATE:\s*(\d+)/i,
      /Template\s+(\d+)/i,
      /Template\s+#(\d+)/i,
      /using\s+Template\s+(\d+)/i,
      /selected\s+Template\s+(\d+)/i,
      /choose\s+Template\s+(\d+)/i
    ];

    let selectedTemplateNumber = 1;
    let matchedPattern = null;

    for (const pattern of templatePatterns) {
      const match = content.match(pattern);
      if (match) {
        selectedTemplateNumber = parseInt(match[1]);
        matchedPattern = pattern.toString();
        break;
      }
    }

    console.log('Template Selection Debug:', {
      matchedPattern,
      selectedTemplateNumber,
      availableTemplates: templateDetails,
    });

    // Find the template name for debugging
    const selectedTemplateName = templateDetails?.find((t: TemplateDetail) => 
      t.number === selectedTemplateNumber
    )?.name;

    // Updated caption parsing to handle numbered list format
    const captions = content
      .split('\n')
      .map(line => line.trim())
      // Match lines that start with a number followed by a dot and possibly quotes
      .filter(line => /^\d+\.\s*"?.+?"?$/.test(line))
      .map(line => {
        // Remove number prefix, dots, and quotes
        return line.replace(/^\d+\.\s*|"|^\s*|\s*$/g, '').trim();
      });

    console.log('Parsed captions:', captions);

    // Create a properly formatted response
    const formattedResponse = {
      template: selectedTemplateNumber,
      templateName: selectedTemplateName,
      captions: captions.length > 0 ? captions : ['No captions found'], // Fallback
    };

    console.log('Formatted response:', formattedResponse);

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