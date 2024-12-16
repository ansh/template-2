'use client';

import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export default function YouTubeQuotes() {
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [quotes, setQuotes] = useState<string[]>([]);
  const [savedQuotes, setSavedQuotes] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<'left' | 'right'>('left');
  const [error, setError] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [title, setTitle] = useState('');
  const [fullTranscript, setFullTranscript] = useState('');
  const [formattedTranscript, setFormattedTranscript] = useState('');
  const [podcastUrl, setPodcastUrl] = useState('');
  const [generatingPodcast, setGeneratingPodcast] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setQuotes([]);
    setSavedQuotes([]);
    setCurrentIndex(0);
    setThumbnail('');
    setTitle('');
    setFullTranscript('');
    setFormattedTranscript('');
    setPodcastUrl('');
    setShowTranscript(false);

    try {
      const response = await fetch('/api/youtube/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl })
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.quotes && data.quotes.length > 0) {
        setQuotes(data.quotes);
        if (data.metadata) {
          setThumbnail(data.metadata.thumbnail);
          setTitle(data.metadata.title);
        }
        if (data.transcript) {
          setFullTranscript(data.transcript);
        }
        if (data.formattedTranscript) {
          setFormattedTranscript(data.formattedTranscript);
        }
      } else {
        setError('No quotes could be extracted from this video');
      }

    } catch (error) {
      console.error('Error:', error);
      setError('Failed to process video. Please make sure the URL is correct and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeep = () => {
    if (currentIndex >= quotes.length - 1) return;
    setExitDirection('right');
    setSavedQuotes([...savedQuotes, quotes[currentIndex]]);
    setTimeout(() => {
      setCurrentIndex(currentIndex + 1);
    }, 50);
  };

  const handleSkip = () => {
    if (currentIndex >= quotes.length - 1) return;
    setExitDirection('left');
    setTimeout(() => {
      setCurrentIndex(currentIndex + 1);
    }, 50);
  };

  const removeQuote = (index: number) => {
    setSavedQuotes(savedQuotes.filter((_, i) => i !== index));
  };

  const exportAsPNG = async () => {
    if (!exportRef.current || savedQuotes.length === 0) return;

    try {
      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = 'youtube-quotes.png';
      link.click();
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export image. Please try again.');
    }
  };

  const copyTranscript = () => {
    navigator.clipboard.writeText(fullTranscript);
  };

  const generatePodcast = async () => {
    try {
      setGeneratingPodcast(true);
      setError('');
      setPodcastUrl('');

      const response = await fetch('/api/youtube/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl,
          generatePodcastAudio: true
        })
      });

      const data = await response.json();

      if (data.error) {
        setError(`Podcast generation failed: ${data.error}`);
        return;
      }

      if (data.podcastData?.audioUrl) {
        setPodcastUrl(data.podcastData.audioUrl);
      } else if (data.podcastData?.id) {
        // If we only get an ID, we need to poll for the audio URL
        setError('Podcast is being generated. Please wait...');
        // You might want to implement polling here
      } else {
        setError('Failed to get podcast URL. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate podcast. Please try again.');
    } finally {
      setGeneratingPodcast(false);
    }
  };

  const copyFormattedTranscript = () => {
    navigator.clipboard.writeText(formattedTranscript);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-xl mx-auto pt-20 px-4">
        <h1 className="text-2xl font-bold text-center mb-8">YouTube Quote Extractor</h1>

        <div className="relative">
          <form onSubmit={handleSubmit} className="mb-4">
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Enter YouTube URL"
              className="w-full p-3 bg-gray-50 mb-2 focus:outline-none"
              required
              disabled={loading}
            />
            <div className="flex gap-2 flex-wrap">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#4285f4] text-white px-4 py-2 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Extract Quotes'}
              </button>
              {quotes.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={copyTranscript}
                    className="bg-gray-500 text-white px-4 py-2 hover:bg-gray-600 transition-colors"
                  >
                    Copy Transcript
                  </button>
                  <button
                    type="button"
                    onClick={copyFormattedTranscript}
                    className="bg-gray-500 text-white px-4 py-2 hover:bg-gray-600 transition-colors"
                  >
                    Copy Speaker Format
                  </button>
                  <button
                    type="button"
                    onClick={generatePodcast}
                    disabled={generatingPodcast}
                    className="bg-purple-500 text-white px-4 py-2 hover:bg-purple-600 transition-colors disabled:opacity-50"
                  >
                    {generatingPodcast ? 'Generating...' : 'Generate Podcast'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="bg-gray-500 text-white px-4 py-2 hover:bg-gray-600 transition-colors"
                  >
                    {showTranscript ? 'Hide Transcript' : 'View Transcript'}
                  </button>
                </>
              )}
            </div>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-1 bg-gray-100 overflow-hidden">
                  <div className="w-1/3 h-full bg-[#4285f4] animate-[loading_1s_ease-in-out_infinite]"></div>
                </div>
              </div>
            )}
          </form>
        </div>

        {loading && (
          <div className="text-center mt-8">
            <div className="text-gray-600">Extracting quotes from video...</div>
            <div className="text-sm text-gray-500">This may take a few moments</div>
          </div>
        )}

        {error && (
          <div className="text-center mt-8 text-red-500">
            {error}
          </div>
        )}

        {showTranscript && (
          <div className="mt-8 space-y-8">
            {formattedTranscript && (
              <div className="p-4 bg-gray-50">
                <h2 className="text-xl font-bold mb-4">Speaker Format Transcript</h2>
                <div className="whitespace-pre-wrap text-sm font-mono">{formattedTranscript}</div>
              </div>
            )}
            {fullTranscript && (
              <div className="p-4 bg-gray-50">
                <h2 className="text-xl font-bold mb-4">Full Transcript</h2>
                <div className="whitespace-pre-wrap text-sm">{fullTranscript}</div>
              </div>
            )}
          </div>
        )}

        {podcastUrl && (
          <div className="mt-8 p-4 bg-gray-50">
            <h2 className="text-xl font-bold mb-4">Generated Podcast</h2>
            <audio controls className="w-full">
              <source src={podcastUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {quotes.length > 0 && currentIndex < quotes.length && (
          <div className="mt-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: exitDirection === 'left' ? -300 : 300, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-white shadow-lg rounded-lg p-6"
              >
                <div className="text-lg">{quotes[currentIndex]}</div>
                <div className="flex justify-center gap-4 mt-6">
                  <button
                    onClick={handleSkip}
                    className="bg-red-500 text-white px-8 py-3 rounded-full hover:bg-red-600 transition-colors"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleKeep}
                    className="bg-green-500 text-white px-8 py-3 rounded-full hover:bg-green-600 transition-colors"
                  >
                    Keep
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="text-center mt-4 text-gray-500">
              {currentIndex + 1} of {quotes.length} quotes
            </div>
          </div>
        )}

        {savedQuotes.length > 0 && (
          <div className="mt-12">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">Saved Quotes</h2>
                  <span className="bg-gray-100 px-2 py-1 rounded-full text-sm">
                    {savedQuotes.length}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      exportAsPNG();
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors text-sm"
                  >
                    Quick Export
                  </button>
                  <svg
                    className="w-5 h-5 transform transition-transform group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </summary>

              <div className="mt-4">
                <div ref={exportRef} className="bg-white p-8 relative">
                  {/* Logo and Title */}
                  <div className="flex justify-between items-start mb-8">
                    <h2 className="text-xl font-bold text-gray-800">YapThread Summary</h2>
                    <Image
                      src="/yaplogonobg.png"
                      alt="YapThread Logo"
                      width={100}
                      height={100}
                      className="object-contain"
                    />
                  </div>

                  {/* Video Thumbnail and Title */}
                  {thumbnail && (
                    <div className="mb-8">
                      <img
                        src={thumbnail}
                        alt={title}
                        className="w-full h-auto object-cover"
                        crossOrigin="anonymous"
                      />
                      {title && <h2 className="text-lg font-semibold mt-4">{title}</h2>}
                    </div>
                  )}

                  {/* Quotes */}
                  <div className="space-y-3">
                    {savedQuotes.map((quote, index) => (
                      <div key={index} className="group relative text-sm leading-relaxed">
                        {quote}
                        <button
                          onClick={() => removeQuote(index)}
                          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-500"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={exportAsPNG}
                  className="mt-4 w-full bg-black text-white p-3 hover:bg-gray-800 transition-colors"
                >
                  Export as PNG
                </button>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

// Add this to your global CSS or use a style tag
const styles = `
@keyframes loading {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}
`;
