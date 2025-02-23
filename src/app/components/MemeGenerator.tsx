'use client';

import { useState, useRef, useEffect } from 'react';
import AIMemeSelector from './AIMemeSelector';
import { MemeTemplate } from '@/lib/supabase/types';
import { supabase } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';
import { createMemeVideo } from '@/lib/utils/videoProcessor';
import { BackgroundImage } from '@/lib/types/meme';

// Import or define the SelectedMeme interface
interface SelectedMeme {
  templates: {
    template: MemeTemplate;
    captions: string[];
  }[];
}

interface TemplateData {
  template: MemeTemplate;
  captions: string[];
}

interface MemeGeneratorProps {
  isGreenscreenMode: boolean;
  onToggleMode: () => void;
}

export default function MemeGenerator({ isGreenscreenMode, onToggleMode }: MemeGeneratorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<MemeTemplate | null>(null);
  const [caption, setCaption] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [generatedOptions, setGeneratedOptions] = useState<SelectedMeme | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const [selectedBackground, setSelectedBackground] = useState<BackgroundImage | null>(null);
  const [backgrounds, setBackgrounds] = useState<BackgroundImage[]>([]);
  const [isLoadingBackgrounds, setIsLoadingBackgrounds] = useState(false);

  useEffect(() => {
    async function loadBackgrounds() {
      setIsLoadingBackgrounds(true);
      try {
        const { data, error } = await supabase
          .from('backgrounds')
          .select('*')
          .eq('aspect_ratio', '9:16');
        
        if (error) throw error;
        if (data) setBackgrounds(data);
      } catch (error) {
        console.error('Error loading backgrounds:', error);
        toast.error('Failed to load backgrounds');
      } finally {
        setIsLoadingBackgrounds(false);
      }
    }

    if (isGreenscreenMode) {
      loadBackgrounds();
    }
  }, [isGreenscreenMode]);

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

    if (isGreenscreenMode && !selectedBackground) {
      toast.error('Please select a background image');
      return;
    }

    setIsDownloading(true);
    try {
      const videoBlob = await createMemeVideo(
        selectedTemplate.video_url,
        caption,
        selectedBackground?.url,
        isGreenscreenMode
      );

      // Create download link and trigger download immediately
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
      <div className="flex items-center gap-4 mb-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isGreenscreenMode}
            onChange={onToggleMode}
            className="w-4 h-4"
          />
          <span>Greenscreen Mode</span>
        </label>
      </div>

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

            {isGreenscreenMode && (
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Choose Background</h3>
                {isLoadingBackgrounds ? (
                  <div className="text-center py-4">Loading backgrounds...</div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {backgrounds.map(bg => (
                      <button
                        key={bg.id}
                        onClick={() => setSelectedBackground(bg)}
                        className={`relative aspect-[9/16] overflow-hidden rounded-lg border-2 
                          ${selectedBackground?.id === bg.id ? 'border-blue-500' : 'border-transparent'}`}
                      >
                        <img src={bg.url} alt={bg.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

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
                {generatedOptions.templates.map((templateData: TemplateData, templateIndex: number) => (
                  <div key={templateIndex} className="p-4 border rounded-lg bg-gray-50">
                    <h3 className="font-medium mb-4">{templateData.template.name}</h3>
                    
                    <div className="space-y-3 mb-6">
                      <h4 className="font-medium text-blue-600">Captions:</h4>
                      {templateData.captions.map((captionOption: string, captionIndex: number) => (
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
        <AIMemeSelector 
          onSelectTemplate={handleAISelection} 
          isGreenscreenMode={isGreenscreenMode}
        />
      )}
    </div>
  );
} 