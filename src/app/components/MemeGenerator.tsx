'use client';

import { useState, useRef } from 'react';
import AIMemeSelector from './AIMemeSelector';
import { MemeTemplate } from '@/lib/supabase/types';
import { supabase } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';
import { createMemeVideo } from '@/lib/utils/videoProcessor';

export default function MemeGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState<MemeTemplate | null>(null);
  const [caption, setCaption] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [generatedOptions, setGeneratedOptions] = useState<SelectedMeme | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  const handleAISelection = (template: MemeTemplate, aiCaption: string, allOptions: SelectedMeme) => {
    setSelectedTemplate(template);
    setCaption(aiCaption);
    setGeneratedOptions(allOptions);
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

    // Pause the preview video before starting processing
    if (previewVideoRef.current) {
      previewVideoRef.current.pause();
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
      
      // Use a timeout to ensure download starts after processing is complete
      setTimeout(() => {
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Resume preview video if it exists
        if (previewVideoRef.current) {
          previewVideoRef.current.play();
        }
      }, 100);

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
      {selectedTemplate ? (
        // Phase 3: Selected template with editor and other options
        <>
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
              ref={previewVideoRef}
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

          {generatedOptions && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Other Options</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {generatedOptions.templates.map((templateData, templateIndex) => (
                  <div key={templateIndex} className="p-4 border rounded-lg bg-gray-50">
                    <h3 className="font-medium mb-4">{templateData.template.name}</h3>
                    
                    <div className="space-y-3 mb-6">
                      <h4 className="font-medium text-blue-600">Captions:</h4>
                      {templateData.captions.map((captionOption, captionIndex) => (
                        <button
                          key={captionIndex}
                          onClick={() => handleAISelection(templateData.template, captionOption, generatedOptions)}
                          className="w-full p-3 text-left border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center gap-2"
                        >
                          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm">
                            {captionIndex + 1}
                          </span>
                          <span>{captionOption}</span>
                        </button>
                      ))}
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <video 
                        src={templateData.template.video_url}
                        className="w-full aspect-video object-cover"
                        controls
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        // Phase 1 & 2: Initial form or generated options
        <AIMemeSelector onSelectTemplate={handleAISelection} />
      )}
    </div>
  );
} 