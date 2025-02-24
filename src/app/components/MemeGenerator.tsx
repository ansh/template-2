'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';
import { debounce } from '@/lib/utils/debounce';

// Local imports
import { MemeTemplate } from '@/lib/supabase/types';
import { BackgroundImage, TextSettings } from '@/lib/types/meme';
import { supabase } from '@/lib/supabase/client';
import { createMemeVideo } from '@/lib/utils/videoProcessor';
import { createMemePreview } from '@/lib/utils/previewGenerator';

// Components
import AIMemeSelector from './AIMemeSelector';
import ImagePicker from '@/app/components/ImagePicker';

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

// Add this interface near the top with other interfaces
interface Label {
  id: string;
  text: string;
  horizontalPosition: number;
  verticalPosition: number;
  size: number;
  font: string;
}

// Add this interface near your other interfaces
interface UnsplashImage {
  id: string;
  urls: {
    regular: string;
    small: string;
  };
  user: {
    name: string;
    username: string;
  };
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
  const [previewCanvas, setPreviewCanvas] = useState<HTMLCanvasElement | null>(null);
  const [textSettings, setTextSettings] = useState<TextSettings>({
    size: 78, // Default size (matches current fontSize calculation of canvas.width * 0.078)
    font: 'Impact',
    verticalPosition: 25, // Default 25% from top
    alignment: 'center', // Add default alignment
  });
  const [labels, setLabels] = useState<Label[]>([]);
  const [backgroundSearch, setBackgroundSearch] = useState('');
  const [unsplashImages, setUnsplashImages] = useState<UnsplashImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [page, setPage] = useState(1);
  const [isUnsplashPickerOpen, setIsUnsplashPickerOpen] = useState(false);

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

  useEffect(() => {
    if (selectedTemplate && caption) {
      updatePreview();
    }
  }, [selectedTemplate, caption, selectedBackground, isGreenscreenMode, textSettings, labels]);

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
        isGreenscreenMode,
        textSettings,
        labels
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

  const updateTextSetting = (key: keyof TextSettings, value: number | string) => {
    setTextSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updatePreview = async () => {
    if (!selectedTemplate) return;
    
    try {
      const canvas = await createMemePreview(
        selectedTemplate.video_url,
        caption,
        selectedBackground?.url,
        isGreenscreenMode,
        textSettings,
        labels
      );
      setPreviewCanvas(canvas);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
    }
  };

  const addLabel = () => {
    const newLabel: Label = {
      id: uuidv4(),
      text: '',
      horizontalPosition: 50,
      verticalPosition: 50,
      size: 78,
      font: 'Impact'
    };
    setLabels([...labels, newLabel]);
  };

  const updateLabel = (id: string, updates: Partial<Label>) => {
    setLabels(labels.map(label => 
      label.id === id ? { ...label, ...updates } : label
    ));
  };

  const deleteLabel = (id: string) => {
    setLabels(labels.filter(label => label.id !== id));
  };

  const searchUnsplash = useCallback(
    debounce(async (query: string, pageNum: number) => {
      if (!query.trim()) {
        setUnsplashImages([]);
        return;
      }

      setIsLoadingImages(true);
      try {
        const response = await fetch(
          `/api/unsplash/search?query=${encodeURIComponent(query)}&page=${pageNum}`
        );
        const data = await response.json();
        
        if (pageNum === 1) {
          setUnsplashImages(data.results);
        } else {
          setUnsplashImages(prev => [...prev, ...data.results]);
        }
      } catch (error) {
        console.error('Error searching Unsplash:', error);
        toast.error('Failed to load images');
      } finally {
        setIsLoadingImages(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    if (backgroundSearch.trim()) {
      searchUnsplash(backgroundSearch, page);
    }
  }, [backgroundSearch, page]);

  return (
    <div className="space-y-8">
      {selectedTemplate ? (
        // Phase 3: Selected template with editor and other options
        <>
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="w-full lg:w-1/2 space-y-4">
                <h2 className="text-lg font-medium mb-2">Editor</h2>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Caption
                  </h3>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter your caption..."
                  />
                </div>

                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                    Caption Settings
                  </summary>
                  <div className="mt-3 space-y-4 pl-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Font</label>
                      <select
                        value={textSettings.font}
                        onChange={(e) => updateTextSetting('font', e.target.value)}
                        className="w-full p-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Impact">Impact (Classic Meme)</option>
                        <option value="Arial Black">Arial Black</option>
                        <option value="Comic Sans MS">Comic Sans MS</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Futura">Futura</option>
                        <option value="Oswald">Oswald</option>
                        <option value="Anton">Anton</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Bebas Neue">Bebas Neue</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Size</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="40"
                          max="120"
                          value={textSettings.size}
                          onChange={(e) => updateTextSetting('size', parseInt(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-600 w-12">{textSettings.size}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Vertical Position (%)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="5"
                          max="95"
                          value={textSettings.verticalPosition}
                          onChange={(e) => updateTextSetting('verticalPosition', parseInt(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-600 w-12">{textSettings.verticalPosition}%</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Text Alignment</label>
                      <div className="flex gap-0 border rounded-md overflow-hidden">
                        <button
                          onClick={() => updateTextSetting('alignment', 'left')}
                          className={`flex-1 p-2 text-sm ${
                            textSettings.alignment === 'left' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          Left
                        </button>
                        <div className="w-px bg-gray-200" />
                        <button
                          onClick={() => updateTextSetting('alignment', 'center')}
                          className={`flex-1 p-2 text-sm ${
                            textSettings.alignment === 'center' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          Center
                        </button>
                        <div className="w-px bg-gray-200" />
                        <button
                          onClick={() => updateTextSetting('alignment', 'right')}
                          className={`flex-1 p-2 text-sm ${
                            textSettings.alignment === 'right' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          Right
                        </button>
                      </div>
                    </div>
                  </div>
                </details>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-gray-700">Labels</h3>
                    <button
                      onClick={addLabel}
                      className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                    >
                      Add Label
                    </button>
                  </div>

                  {labels.map(label => (
                    <div key={label.id} className="space-y-3 mb-4 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="text"
                        value={label.text}
                        onChange={(e) => updateLabel(label.id, { text: e.target.value })}
                        placeholder="Enter label text..."
                        className="w-full p-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500"
                      />

                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-600 mb-1">Horizontal</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={label.horizontalPosition}
                              onChange={(e) => updateLabel(label.id, { horizontalPosition: parseInt(e.target.value) })}
                              className="flex-1"
                            />
                            <span className="text-sm text-gray-600 w-12">{label.horizontalPosition}%</span>
                          </div>
                        </div>

                        <div className="flex-1">
                          <label className="block text-xs text-gray-600 mb-1">Vertical</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={label.verticalPosition}
                              onChange={(e) => updateLabel(label.id, { verticalPosition: parseInt(e.target.value) })}
                              className="flex-1"
                            />
                            <span className="text-sm text-gray-600 w-12">{label.verticalPosition}%</span>
                          </div>
                        </div>
                      </div>

                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                          Label Style
                        </summary>
                        <div className="mt-3 space-y-4 pl-2">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Font</label>
                            <select
                              value={label.font}
                              onChange={(e) => updateLabel(label.id, { font: e.target.value })}
                              className="w-full p-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="Impact">Impact (Classic Meme)</option>
                              <option value="Arial Black">Arial Black</option>
                              <option value="Comic Sans MS">Comic Sans MS</option>
                              <option value="Helvetica">Helvetica</option>
                              <option value="Futura">Futura</option>
                              <option value="Oswald">Oswald</option>
                              <option value="Anton">Anton</option>
                              <option value="Roboto">Roboto</option>
                              <option value="Times New Roman">Times New Roman</option>
                              <option value="Verdana">Verdana</option>
                              <option value="Courier New">Courier New</option>
                              <option value="Bebas Neue">Bebas Neue</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Size</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min="40"
                                max="120"
                                value={label.size}
                                onChange={(e) => updateLabel(label.id, { size: parseInt(e.target.value) })}
                                className="flex-1"
                              />
                              <span className="text-sm text-gray-600 w-12">{label.size}</span>
                            </div>
                          </div>
                        </div>
                      </details>

                      <div className="flex justify-end mt-3">
                        <button
                          onClick={() => deleteLabel(label.id)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  {isGreenscreenMode ? (
                    // Greenscreen layout - two tall columns
                    <>
                      <div className="w-[200px] flex-shrink-0">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Video</h3>
                        <video
                          ref={previewVideoRef}
                          src={selectedTemplate.video_url}
                          className="w-full aspect-[9/16] object-cover rounded"
                          controls
                        />
                      </div>

                      <div className="w-[200px] flex-shrink-0">
                        <h3 className="text-sm font-medium mb-2">Background</h3>
                        {selectedBackground ? (
                          <div className="relative aspect-[9/16] rounded-lg overflow-hidden border">
                            <img 
                              src={selectedBackground.url} 
                              alt={selectedBackground.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1.5">
                              Photo by{' '}
                              <a 
                                href={`https://unsplash.com/photos/${selectedBackground.id}?utm_source=meme_generator&utm_medium=referral`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white underline"
                              >
                                {selectedBackground.name.replace('Unsplash photo by ', '')}
                              </a>
                              {' '}on{' '}
                              <a
                                href="https://unsplash.com/?utm_source=meme_generator&utm_medium=referral"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white underline"
                              >
                                Unsplash
                              </a>
                            </div>
                            <button
                              onClick={() => setSelectedBackground(null)}
                              className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setIsUnsplashPickerOpen(true)}
                            className="w-full aspect-[9/16] flex flex-col items-center justify-center border-2 border-dashed rounded-lg hover:bg-gray-50 transition-all group relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white opacity-50" />
                            <div className="relative flex flex-col items-center">
                              <div className="p-2 rounded-full bg-blue-50 mb-3 group-hover:bg-blue-100 transition-colors">
                                <svg 
                                  className="w-5 h-5 text-blue-600" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </div>
                              <p className="text-sm font-medium text-gray-900">Choose background</p>
                              <p className="text-xs text-gray-500 mt-1">Add an image for your greenscreen</p>
                            </div>
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    // Non-greenscreen layout - single wide video
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Video</h3>
                      <video
                        ref={previewVideoRef}
                        src={selectedTemplate.video_url}
                        className="w-full aspect-video object-cover rounded"
                        controls
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full lg:w-1/2">
                <h2 className="text-lg font-medium mb-2">Preview</h2>
                <div className="lg:sticky lg:top-4">
                  <div className="relative aspect-[9/16] w-full bg-black rounded-lg">
                    {previewCanvas ? (
                      <div className="absolute inset-0">
                        <img 
                          src={previewCanvas.toDataURL()} 
                          alt="Meme preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <p className="text-sm">Preview will appear here</p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedBackground && (
                  <div className="text-xs text-gray-500 mt-1.5">
                    Background by{' '}
                    <a 
                      href={`https://unsplash.com/photos/${selectedBackground.id}?utm_source=meme_generator&utm_medium=referral`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 underline"
                    >
                      {selectedBackground.name.replace('Unsplash photo by ', '')}
                    </a>
                    {' '}on{' '}
                    <a
                      href="https://unsplash.com/?utm_source=meme_generator&utm_medium=referral"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 underline"
                    >
                      Unsplash
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 lg:mt-4 flex justify-center">
              <button
                onClick={handleDownloadMeme}
                disabled={isDownloading}
                className="w-full lg:w-64 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {isDownloading ? 'Processing...' : 'Download Meme'}
              </button>
            </div>
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
          onToggleMode={onToggleMode}
        />
      )}

      <ImagePicker
        isOpen={isUnsplashPickerOpen}
        onClose={() => setIsUnsplashPickerOpen(false)}
        onSelect={(image) => {
          setSelectedBackground(image);
          setIsUnsplashPickerOpen(false);
        }}
      />
    </div>
  );
} 