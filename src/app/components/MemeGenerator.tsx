'use client';

import { useState } from 'react';
import AIMemeSelector from './AIMemeSelector';
import { MemeTemplate } from '@/lib/supabase/types';
import { supabase } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';

export default function MemeGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState<MemeTemplate | null>(null);
  const [caption, setCaption] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleAISelection = (template: MemeTemplate, aiCaption: string) => {
    setSelectedTemplate(template);
    setCaption(aiCaption);
  };

  const handleBack = () => {
    setSelectedTemplate(null);
    setCaption('');
  };

  const handleGenerateMeme = async () => {
    if (!selectedTemplate || !caption.trim()) {
      toast.error('Please provide a caption for your meme');
      return;
    }

    setIsGenerating(true);
    try {
      const memeId = uuidv4();
      
      const { error } = await supabase
        .from('memes')
        .insert({
          id: memeId,
          template_id: selectedTemplate.id,
          caption,
          video_url: selectedTemplate.video_url,
          status: 'pending'
        });

      if (error) throw error;
      toast.success('Meme generation started!');
      
    } catch (error) {
      console.error('Error generating meme:', error);
      toast.error('Failed to generate meme. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {!selectedTemplate ? (
        <AIMemeSelector onSelectTemplate={handleAISelection} />
      ) : (
        <div className="space-y-4">
          <button
            onClick={handleBack}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← Back to templates
          </button>
          
          <div className="border rounded-lg p-4 bg-white">
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caption
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter your caption..."
                />
              </div>
            </div>

            <video
              src={selectedTemplate.video_url}
              className="w-full aspect-video object-cover rounded mb-4"
              controls
            />
            
            <button
              onClick={handleGenerateMeme}
              disabled={isGenerating}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : 'Generate Meme'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 