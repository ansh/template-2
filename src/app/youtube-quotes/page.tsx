
'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function YouTubeQuotes() {
  const [url, setUrl] = useState('');
  const [quotes, setQuotes] = useState<string[]>([]);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatingPodcast, setGeneratingPodcast] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setQuotes([]);

    try {
      const response = await fetch('/api/youtube/transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl: url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process video');
      }

      setQuotes(data.quotes || []);
      setMetadata(data.metadata);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    if (currentQuote < quotes.length - 1) {
      setCurrentQuote(currentQuote + 1);
    }
  };

  const handleKeep = () => {
    // Implement keep functionality here
    handleSkip();
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm mb-4">
            What's new
          </div>
          <h1 className="text-4xl font-bold mb-2">YapQuotes</h1>
          <p className="text-gray-600">In search of meaning in YouTube content</p>
        </div>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter YouTube URL"
              className="flex-1 p-2 border rounded-lg"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400"
            >
              {isLoading ? 'Processing...' : 'Extract'}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 mb-8 bg-red-100 text-red-800 rounded-lg">
            {error}
          </div>
        )}

        {quotes.length > 0 && currentQuote < quotes.length && (
          <div className="space-y-8">
            <p className="text-lg">{quotes[currentQuote]}</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleSkip}
                className="px-8 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleKeep}
                className="px-8 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
              >
                Keep
              </button>
            </div>
            <div className="text-center text-gray-500">
              {currentQuote + 1} of {quotes.length} quotes
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
