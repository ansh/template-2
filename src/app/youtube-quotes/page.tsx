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
    setShowSelection(false);

    try {
      const response = await fetch('/api/youtube/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl })
      });

      const data = await response.json();
      console.log('API Response:', data);

      if (data.error) {
        console.error('Error:', data.error);
        alert(data.error);
        return;
      }

      console.log('Full Transcript:', data.fullText);
      console.log('Extracted Quotes:', data.quotes);

      if (data.quotes && data.quotes.length > 0) {
        setQuotes(data.quotes);
        setFullTranscript(data.fullText || '');
        if (data.metadata) {
          setMetadata(data.metadata);
        }
        setShowSelection(true);
      } else {
        alert('No quotes were extracted. This could be because:\n1. The transcript format is unusual\n2. The sentences are too short\n3. There might be an issue with the transcript\n\nPlease try another video or contact support if this persists.');
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      alert('Failed to process video. Please make sure the URL is correct and the video has subtitles enabled.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteSelection = (accepted: boolean) => {
    if (accepted && quotes[currentQuoteIndex]) {
      setSelectedQuotes(prev => [...prev, quotes[currentQuoteIndex]]);
    }

    const nextIndex = currentQuoteIndex + 1;
    if (nextIndex < quotes.length) {
      setCurrentQuoteIndex(nextIndex);
    } else {
      setShowSelection(false);
      if (selectedQuotes.length === 0) {
        alert('No quotes were selected. You can try processing the video again to see different quotes.');
      }
    }
  };

  const exportAsPNG = async () => {
    if (!exportRef.current) return;

    const canvas = await html2canvas(exportRef.current, {
      scale: 3, // Increase quality
      logging: false,
      useCORS: true,
      allowTaint: true
    });
    const image = canvas.toDataURL('image/png', 1.0);
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
        <div className="text-center mt-4 space-y-2">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <div className="text-lg">Extracting quotes from video...</div>
          <div className="text-sm text-gray-600">This may take a few moments</div>
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

      {quotes.length > 0 && showSelection && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4">Select Quotes ({currentQuoteIndex + 1}/{quotes.length})</h2>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="text-xl mb-6 text-gray-800">{formatText(quotes[currentQuoteIndex])}</p>
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
            <p className="mt-4 text-sm text-gray-600 text-center">Showing meaningful quotes extracted from the video</p>
          </div>
        </div>
      )}

      {selectedQuotes.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Selected Quotes</h2>
          <div ref={exportRef} className="bg-white p-6 rounded-lg shadow-lg max-w-2xl flex flex-col">
            {metadata && (
              <div className="w-full mb-6 flex-shrink-0">
                <img
                  src={metadata.thumbnail}
                  alt={metadata.title}
                  className="w-full h-auto object-cover rounded-lg shadow-sm mb-3"
                  crossOrigin="anonymous"
                />
                <h2 className="text-lg font-bold text-gray-800">{metadata.title}</h2>
                <p className="text-sm text-gray-600">{metadata.channelTitle}</p>
              </div>
            )}
            <div className="space-y-2">
              {selectedQuotes.map((quote, index) => (
                <div key={index} className="text-gray-800 text-sm">
                  {formatText(quote)}
                </div>
              ))}
            </div>
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
          <details className="w-full">
            <summary className="text-xl font-bold mb-4 cursor-pointer hover:text-gray-600">
              Full Transcript
            </summary>
            <div className="bg-gray-100 p-4 rounded whitespace-pre-line mb-2">
              {formatText(fullTranscript)}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(formatText(fullTranscript));
                alert('Transcript copied to clipboard!');
              }}
              className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy to Clipboard
            </button>
          </details>
        </div>
      )}
    </div>
  );
}
