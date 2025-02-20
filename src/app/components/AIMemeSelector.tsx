'use client';

import { useState } from 'react';
import { useChat } from 'ai/react';
import { MemeTemplate } from '@/lib/supabase/types';
import { supabase } from '@/lib/supabase/client';  // Import the Supabase client
import { toast } from 'react-hot-toast';

interface Props {
  onSelectTemplate: (template: MemeTemplate, caption: string) => void;
}

export default function AIMemeSelector({ onSelectTemplate }: Props) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState<MemeTemplate[]>([]);
  const [selectedModel, setSelectedModel] = useState<'openai' | 'anthropic'>('anthropic');

  const { messages, append, isLoading: isChatLoading } = useChat({
    api: selectedModel === 'openai' ? '/api/openai/chat' : '/api/anthropic/chat',
    onError: (error) => {
      console.error('Chat error:', error);
      setIsLoading(false);
      alert('Error: ' + error.message);
    },
    onFinish: async (message) => {
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
      // First, get the templates
      const { data: freshTemplates } = await supabase
        .from('meme_templates')
        .select('*')
        .limit(5);

      if (!freshTemplates || freshTemplates.length === 0) {
        throw new Error('No templates available');
      }

      setTemplates(freshTemplates);

      // Format the templates for the AI
      const templatesText = freshTemplates.map((template, i) => 
        `${i + 1}. ${template.name}\nInstructions: ${template.instructions || 'No specific instructions'}`
      ).join('\n');

      // Make the API call
      const response = await fetch('/api/anthropic/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `I want to create a meme with this idea: "${prompt}"\n\nAvailable templates:\n${templatesText}`
          }]
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      console.log('AI response:', data);

      // Use the formatted response
      const selectedTemplate = freshTemplates[data.template - 1];
      if (selectedTemplate) {
        onSelectTemplate(selectedTemplate, data.caption);
      }

    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to generate meme suggestion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default to avoid newline
      handleSubmit(e as any);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">AI Meme Generator</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
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

      {messages.length > 0 && (
        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-medium mb-2">AI Suggestions:</h3>
          {messages.map((message, index) => {
            if (message.role === 'assistant') {
              const templateMatch = message.content.match(/TEMPLATE: (\d+)/);
              const captionMatch = message.content.match(/CAPTION: (.+)/);
              
              if (templateMatch && captionMatch && templates) {
                const template = templates[parseInt(templateMatch[1]) - 1];
                const caption = captionMatch[1];

                return (
                  <div key={index} className="space-y-3">
                    <div className="font-medium text-gray-700">
                      Template: {template.name}
                    </div>
                    <div className="text-gray-700 text-lg font-medium">
                      Caption: {caption}
                    </div>
                    <video 
                      src={template.video_url}
                      className="w-full aspect-video object-cover rounded"
                      controls
                    />
                  </div>
                );
              }
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
} 