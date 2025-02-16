'use client';

import { useState } from 'react';
import AIMemeSelector from './AIMemeSelector';
import { MemeTemplate } from '@/lib/supabase/types';
import { supabase } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';
import { createMemeVideo } from '@/lib/utils/videoProcessor';

export default function MemeGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState<MemeTemplate | null>(null);
  const [caption, setCaption] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const handleAISelection = (template: MemeTemplate, aiCaption: string) => {
    setSelectedTemplate(template);
    setCaption(aiCaption);
  };

  const handleBack = () => {
    setSelectedTemplate(null);
    setCaption('');
  };

  const handleDownloadMeme = async () => {
    if (!selectedTemplate || !caption.trim()) {
      toast.error('Please provide a caption for your meme');
      return;
    }

    setIsDownloading(true);
    try {
      // Create the meme video
      const videoBlob = await createMemeVideo(
        selectedTemplate.video_url,
        caption
      );

      // Create download link
      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meme-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Meme downloaded successfully!');
    } catch (error) {
      console.error('Error downloading meme:', error);
      toast.error('Failed to download meme. Please try again.');
    } finally {
      setIsDownloading(false);
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
              onClick={handleDownloadMeme}
              disabled={isDownloading}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isDownloading ? 'Processing...' : 'Download Meme'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 