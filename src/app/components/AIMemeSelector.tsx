'use client';

import { useState } from 'react';
import { useChat, Message } from 'ai/react';
import { MemeTemplate } from '@/lib/supabase/types';
import { supabase } from '@/lib/supabase/client';  // Import the Supabase client
import { toast } from 'react-hot-toast';

interface Props {
  onSelectTemplate: (template: MemeTemplate, caption: string) => void;
}

interface AIResponse {
  template: number;
  captions: string[];
  source: 'A' | 'B';
  templateName?: string;
}

interface SelectedMeme {
  template: MemeTemplate;
  captions: string[];
}

export default function AIMemeSelector({ onSelectTemplate }: Props) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState<MemeTemplate[]>([]);
  const [selectedModel, setSelectedModel] = useState<'openai' | 'anthropic'>('anthropic');
  const [memeA, setMemeA] = useState<SelectedMeme | null>(null);
  const [memeB, setMemeB] = useState<SelectedMeme | null>(null);
  const [audience, setAudience] = useState('');

  const { messages, append, isLoading: isChatLoading } = useChat({
    api: selectedModel === 'openai' ? '/api/openai/chat' : '/api/anthropic/chat',
    onError: (error: Error) => {
      console.error('Chat error:', error);
      setIsLoading(false);
      alert('Error: ' + error.message);
    },
    onFinish: async (message: Message) => {
      console.log('Chat finished:', message);
      setIsLoading(false);
      
      // Get the templates again to ensure we have fresh data
      const { data: freshTemplates } = await supabase
        .from('meme_templates')
        .select('*')
        .limit(5);

      if (!freshTemplates) return;
      setTemplates(freshTemplates);

      // Parse the AI response
      const templateMatch = message.content.match(/TEMPLATE: (\d+)/);
      const captionMatch = message.content.match(/CAPTION: (.+)/);

      if (templateMatch && captionMatch) {
        const selectedTemplate = freshTemplates[parseInt(templateMatch[1]) - 1];
        const caption = captionMatch[1];
        
        if (selectedTemplate) {
          onSelectTemplate(selectedTemplate, caption);
        }
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      // Get relevant templates using vector similarity
      const response = await fetch('/api/meme-selection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, audience }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Failed to get templates');
      }

      const { templates: fetchedTemplates } = await response.json();
      
      // After getting templates from vector similarity
      console.log('=== DEBUG: Template Processing ===');
      console.log('Original templates order:', fetchedTemplates.map(t => t.name));
      
      const templatesWithIndices = fetchedTemplates.map((template: MemeTemplate, index: number) => ({
        ...template,
        originalIndex: index + 1
      }));
      
      console.log('Templates with indices:', templatesWithIndices.map(t => ({
        name: t.name,
        originalIndex: t.originalIndex
      })));

      // Format templates for AI with their original indices
      const templatesText = templatesWithIndices.map((template: MemeTemplate & { originalIndex: number }) => 
        `${template.originalIndex}. ${template.name}\nInstructions: ${template.instructions || 'No specific instructions'}`
      ).join('\n');

      // Make two separate API calls for each prompt
      const [responseA, responseB] = await Promise.all([
        fetch('/api/anthropic/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{
              role: 'user',
              content: `I want to create a meme with this idea: "${prompt}"\n\nAvailable templates:\n${templatesText}`,
              promptType: 'A',
              audience: audience || 'general audience'
            }]
          }),
        }),
        fetch('/api/anthropic/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{
              role: 'user',
              content: `I want to create a meme with this idea: "${prompt}"\n\nAvailable templates:\n${templatesText}`,
              promptType: 'B',
              audience: audience || 'general audience'
            }]
          }),
        })
      ]);

      if (!responseA.ok || !responseB.ok) {
        throw new Error('Failed to get AI responses');
      }

      const [dataA, dataB] = await Promise.all([
        responseA.json() as Promise<AIResponse>,
        responseB.json() as Promise<AIResponse>
      ]);

      // Find templates for both responses
      const templateA = templatesWithIndices.find(
        (t: MemeTemplate & { originalIndex: number }) => t.originalIndex === dataA.template
      );
      const templateB = templatesWithIndices.find(
        (t: MemeTemplate & { originalIndex: number }) => t.originalIndex === dataB.template
      );

      if (!templateA || !templateB) {
        console.error('Template selection mismatch:', {
          availableTemplates: templatesWithIndices.map(t => ({ 
            name: t.name, 
            index: t.originalIndex 
          })),
          requestedTemplateA: dataA.template,
          requestedTemplateB: dataB.template,
        });
        throw new Error('Failed to find one or both templates');
      }

      setMemeA({
        template: templateA,
        captions: dataA.captions
      });
      setMemeB({
        template: templateB,
        captions: dataB.captions
      });

    } catch (error) {
      console.error('Chat error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate meme suggestion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCaptionSelect = (template: MemeTemplate, caption: string) => {
    onSelectTemplate(template, caption);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">AI Meme Generator</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Audience
          </label>
          <input
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Software developers, gamers, crypto traders..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Describe your meme idea
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Describe what kind of meme you want to create... (Press Enter to submit, Shift+Enter for new line)"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select AI Model
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as 'openai' | 'anthropic')}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="anthropic">Claude</option>
            <option value="openai">GPT-4</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Generating...' : 'Generate with AI'}
        </button>
      </form>

      {(memeA || memeB) && !isLoading && (
        <div className="mt-4 space-y-8">
          {/* Style A Result */}
          {memeA && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-4">Style A: {memeA.template.name}</h3>
              
              {/* Caption options */}
              <div className="space-y-3 mb-6">
                <h4 className="font-medium text-blue-600">Captions:</h4>
                {memeA.captions.map((caption, index) => (
                  <button
                    key={`A-${index}`}
                    onClick={() => handleCaptionSelect(memeA.template, caption)}
                    className="w-full p-3 text-left border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center gap-2"
                  >
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm">
                      {index + 1}
                    </span>
                    <span>{caption}</span>
                  </button>
                ))}
              </div>

              {/* Video preview */}
              <div className="border rounded-lg overflow-hidden">
                <video 
                  src={memeA.template.video_url}
                  className="w-full aspect-video object-cover"
                  controls
                />
              </div>
            </div>
          )}

          {/* Style B Result */}
          {memeB && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-4">Style B: {memeB.template.name}</h3>
              
              {/* Caption options */}
              <div className="space-y-3 mb-6">
                <h4 className="font-medium text-green-600">Captions:</h4>
                {memeB.captions.map((caption, index) => (
                  <button
                    key={`B-${index}`}
                    onClick={() => handleCaptionSelect(memeB.template, caption)}
                    className="w-full p-3 text-left border rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors flex items-center gap-2"
                  >
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-green-100 text-green-600 text-sm">
                      {index + 1}
                    </span>
                    <span>{caption}</span>
                  </button>
                ))}
              </div>

              {/* Video preview */}
              <div className="border rounded-lg overflow-hidden">
                <video 
                  src={memeB.template.video_url}
                  className="w-full aspect-video object-cover"
                  controls
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 