
'use client';

import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';

export default function YouTubeQuotes() {
  const [videoUrl, setVideoUrl] = useState('');
  const [metadata, setMetadata] = useState(null);
  const [quotes, setQuotes] = useState<string[]>([]);
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [fullTranscript, setFullTranscript] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showSelection, setShowSelection] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const formatText = (text: string) => {
    return text
      .replace(/&amp;#39;/g, "'")
      .replace(/&amp;quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSelectedQuotes([]);
    setCurrentQuoteIndex(0);
    
    try {
      const response = await fetch('/api/youtube/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl })
      });
      
      const data = await response.json();
      if (data.error) {
        console.error('Error:', data.error);
        return;
      }
      const quotesArray = data.quotes?.split('\n').filter((q: string) => q.trim()) || [];
      setQuotes(quotesArray);
      setFullTranscript(data.fullText || '');
      if (data.metadata) {
        setMetadata(data.metadata);
      }
      setShowSelection(true);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteSelection = (accepted: boolean) => {
    if (accepted) {
      setSelectedQuotes([...selectedQuotes, quotes[currentQuoteIndex]]);
    }
    if (currentQuoteIndex < quotes.length - 1) {
      setCurrentQuoteIndex(currentQuoteIndex + 1);
    } else {
      setShowSelection(false);
    }
  };

  const exportAsPNG = async () => {
    if (!exportRef.current) return;
    
    const canvas = await html2canvas(exportRef.current);
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = 'youtube-quotes.png';
    link.click();
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">YouTube Quote Extractor</h1>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <input
          type="text"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="Enter YouTube URL"
          className="w-full p-2 border rounded mb-4"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? 'Processing...' : 'Extract Quotes'}
        </button>
      </form>

      {loading && (
        <div className="text-center mt-4">
          <div className="animate-pulse">Loading...</div>
        </div>
      )}

      {metadata && (
        <div className="mt-6 mb-6 text-center">
          <h2 className="text-xl font-bold mb-4">{metadata.title}</h2>
          <img 
            src={metadata.thumbnail} 
            alt={metadata.title}
            className="mx-auto rounded-lg shadow-lg max-w-full h-auto"
          />
          <p className="mt-2 text-gray-600">{metadata.channelTitle}</p>
        </div>
      )}

      {showSelection && quotes[currentQuoteIndex] && (
        <div className="mt-6 text-center">
          <div className="text-2xl font-bold mb-8 p-6 bg-gray-100 rounded">
            {formatText(quotes[currentQuoteIndex])}
          </div>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => handleQuoteSelection(false)}
              className="bg-red-500 text-white px-6 py-3 rounded hover:bg-red-600"
            >
              Skip
            </button>
            <button
              onClick={() => handleQuoteSelection(true)}
              className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600"
            >
              Keep
            </button>
          </div>
        </div>
      )}

      {selectedQuotes.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Selected Quotes</h2>
          <div ref={exportRef} className="bg-white p-6 rounded-lg shadow-lg">
            {selectedQuotes.map((quote, index) => (
              <div key={index} className="mb-4 p-4 bg-gray-100 rounded">
                {formatText(quote)}
              </div>
            ))}
          </div>
          <button
            onClick={exportAsPNG}
            className="mt-4 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            Export as PNG
          </button>
        </div>
      )}

      {fullTranscript && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Full Transcript</h2>
          <div className="bg-gray-100 p-4 rounded whitespace-pre-line">
            {formatText(fullTranscript)}
          </div>
        </div>
      )}
    </div>
  );
}
