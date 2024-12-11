
'use client';

import { useState } from 'react';

export default function YouTubeQuotes() {
  const [videoUrl, setVideoUrl] = useState('');
  const [quotes, setQuotes] = useState<string>('');
  const [fullTranscript, setFullTranscript] = useState<string>('');
  const [loading, setLoading] = useState(false);

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
    
    try {
      const response = await fetch('/api/youtube/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl })
      });
      
      const data = await response.json();
      setQuotes(data.quotes);
      setFullTranscript(data.fullText);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([quotes], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'youtube-quotes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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

      {quotes && (
        <div className="mt-6">
          <div className="bg-gray-100 p-4 rounded whitespace-pre-line mb-4">
            {quotes}
          </div>
          <button
            onClick={handleDownload}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Download Quotes
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
