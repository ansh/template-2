
'use client';

import { useState } from 'react';

export default function YouTubeQuotes() {
  const [generatingPodcast, setGeneratingPodcast] = useState(false);

  const generatePodcast = async () => {
    try {
      setGeneratingPodcast(true);
      // Add podcast generation logic here
      // For now just toggling the state
    } catch (error) {
      console.error('Error generating podcast:', error);
    } finally {
      setGeneratingPodcast(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">YapQuotes</h1>
        <p className="text-center text-gray-600 mb-8">In search of meaning in YouTube content</p>
        
        <div className="flex justify-center mb-8">
          <button
            onClick={generatePodcast}
            disabled={generatingPodcast}
            className="px-4 py-2 text-sm bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors disabled:opacity-50"
          >
            {generatingPodcast ? 'Generating...' : 'Generate Podcast'}
          </button>
        </div>
      </div>
    </div>
  );
}
