'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { MemeTemplate } from '@/lib/supabase/types';
import TemplateBrowser from './TemplateBrowser';

export default function MemeGenerator() {
  const { user } = useAuth();
  const [concept, setConcept] = useState('');
  const [audience, setAudience] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MemeTemplate | null>(null);
  const [caption, setCaption] = useState('');
  const [explanation, setExplanation] = useState('');

  const handleGenerate = async () => {
    // We'll implement this later
    console.log('Generating with:', { concept, audience });
  };

  const handleGenerateMeme = async () => {
    try {
      setLoading(true);

      // 1. Get template suggestion
      const templateRes = await fetch('/api/select-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: concept }),
      });

      const { template, explanation } = await templateRes.json();
      setSelectedTemplate(template);
      setExplanation(explanation);

      // 2. Generate caption
      const captionRes = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          concept,
          templateName: template.name,
          instructions: template.instructions
        }),
      });

      const { caption } = await captionRes.json();
      setCaption(caption);

    } catch (error) {
      console.error('Error generating meme:', error);
      alert('Error generating meme. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Meme Concept
          </label>
          <textarea
            className="w-full p-2 border rounded text-gray-900"
            rows={3}
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="Describe your meme idea..."
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Target Audience
          </label>
          <input
            type="text"
            className="w-full p-2 border rounded text-gray-900"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="e.g., Developers, Cat lovers, etc."
          />
        </div>

        <button
          onClick={handleGenerate}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Generate Suggestions
        </button>
      </div>

      <div className="space-y-6 mt-8">
        <div className="space-y-4">
          <button
            onClick={handleGenerateMeme}
            disabled={loading || !concept}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate Meme'}
          </button>
        </div>

        {selectedTemplate && (
          <div className="border rounded p-4 bg-white">
            <h3 className="font-bold mb-2 text-gray-900">{selectedTemplate.name}</h3>
            <p className="text-sm text-gray-600 mb-4">{explanation}</p>
            <video
              src={selectedTemplate.video_url}
              className="w-full max-h-[400px] object-contain mb-4"
              controls
            />
            <div className="bg-gray-50 p-3 rounded">
              <p className="font-bold text-gray-900">Generated Caption:</p>
              <p className="text-gray-700">{caption}</p>
            </div>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Or Browse Templates Manually</h2>
          <TemplateBrowser onSelectTemplate={setSelectedTemplate} />
        </div>
      </div>
    </div>
  );
} 