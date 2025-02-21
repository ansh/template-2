import { StreamingTextResponse } from 'ai';
import Anthropic from '@anthropic-ai/sdk';
import { getMemeSystemPromptA, getMemeSystemPromptB } from '@/lib/utils/prompts';

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
    const promptType = lastMessage.promptType || 'A';
    const audience = lastMessage.audience || 'general audience'; // Default fallback

    // Get the appropriate system prompt based on type
    const systemPrompt = promptType === 'A' 
      ? getMemeSystemPromptA(audience) 
      : getMemeSystemPromptB(audience);

    // Extract template numbers and names for debugging
    const templateMatches = lastMessage.content.match(/(\d+)\.\s+([^\n]+)/g);
    const templateDetails = templateMatches?.map(match => {
      const [_, number, name] = match.match(/(\d+)\.\s+(.+)/) || [];
      return { number: parseInt(number), name };
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
      promptType: promptType
    });

    // Find the template name for debugging
    const selectedTemplateName = templateDetails?.find(t => t.number === selectedTemplateNumber)?.name;

    const caption1Match = content.match(/CAPTION1:\s*(.+?)(?=\n|$)/i);
    const caption2Match = content.match(/CAPTION2:\s*(.+?)(?=\n|$)/i);
    const caption3Match = content.match(/CAPTION3:\s*(.+?)(?=\n|$)/i);

    // Create a properly formatted response
    const formattedResponse = {
      template: selectedTemplateNumber,
      templateName: selectedTemplateName, // Add this for debugging
      captions: [
        caption1Match?.[1].trim() || '',
        caption2Match?.[1].trim() || '',
        caption3Match?.[1].trim() || ''
      ],
      source: promptType
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