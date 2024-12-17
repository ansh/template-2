'use client';

import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { UserButton } from '@clerk/nextjs';
import { SignedIn } from '@clerk/nextjs';
import { SignInButton } from '@clerk/nextjs';
import { SignedOut } from '@clerk/nextjs';
import { db } from '@/lib/contexts/AuthContext';

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
  const { user } = db.useAuth()
  console.log("user", user);

  // ... keep all the existing handler functions unchanged ...
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
        allowTaint: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Update the thumbnail URL to use our proxy
          if (thumbnail) {
            const thumbImg = clonedDoc.querySelector('img[alt="' + (title || '') + '"]');
            if (thumbImg) {
              const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(thumbnail)}`;
              thumbImg.src = proxyUrl;
            }
          }
        }
      });

      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = 'youtube-quotes.png';
      link.click();
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export image. Please try again.');
    }
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

  const copyTranscript = () => {
    navigator.clipboard.writeText(fullTranscript);
  };

  const copyFormattedTranscript = () => {
    navigator.clipboard.writeText(formattedTranscript);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex justify-end p-4">
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </header>
      <div className="max-w-2xl mx-auto pt-20 px-4">
        <div className="text-center mb-12">
          <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full mb-4">Learn from YouTube</span>
          <h1 className="text-4xl font-serif mb-2">Podcast and Quotes Extractor</h1>
          <p className="text-gray-600">In search of meaning in YouTube content</p>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-100 mx-auto mb-4"></div>
            <p className="text-gray-600">Processing video...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative bg-white rounded-lg shadow-sm">
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Enter YouTube URL"
              className="w-full p-4 pr-12 bg-transparent focus:outline-none"
              required
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              →
            </button>
          </div>
        </form>

        {error && (
          <div className="text-center mt-8 text-red-500">
            {error}
          </div>
        )}

        {quotes.length > 0 && !loading && (
          <div className="flex flex-wrap gap-4 mb-8 justify-center items-center">
            <button
              onClick={generatePodcast}
              disabled={generatingPodcast}
              className="px-4 py-2 text-sm bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors disabled:opacity-50"
            >
              {generatingPodcast ? 'Generating...' : 'Generate Podcast'}
            </button>
            <div className="flex gap-4">
              <button
                onClick={copyTranscript}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Copy Transcript
              </button>
              <button
                onClick={copyFormattedTranscript}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Copy Speaker Format
              </button>
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                {showTranscript ? 'Hide Transcript' : 'View Transcript'}
              </button>
            </div>
          </div>
        )}

        {title && thumbnail && !loading && (
          <div className="mb-8 text-center">
            <Image
              src={thumbnail}
              alt={title}
              width={640}
              height={360}
              className="mx-auto rounded-lg shadow-sm"
              unoptimized
            />
            <h2 className="mt-4 text-xl font-serif text-gray-800">{title}</h2>
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
                className="bg-white rounded-lg shadow-sm p-6 relative"
              >
                <div className="text-lg font-serif">{quotes[currentIndex]}</div>
                <div className="flex justify-center gap-4 mt-6">
                  <button
                    onClick={handleSkip}
                    className="px-6 py-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleKeep}
                    className="px-6 py-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Keep
                  </button>
                </div>
                <div className="absolute bottom-2 right-4 text-gray-500 text-sm">
                  {currentIndex + 1} of {quotes.length}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {savedQuotes.length > 0 && (
          <div className="mt-12">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer list-none p-4 bg-white rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-serif">Saved Quotes</h2>
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                    {savedQuotes.length}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    exportAsPNG();
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Export
                </button>
              </summary>

              <div className="mt-4">
                <div ref={exportRef} className="bg-white p-8 rounded-lg shadow-sm space-y-4">
                  <div className="flex flex-col items-center mb-8">
                    <div className="mb-4" style={{ width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src="/yaplogonobg.png"
                        alt="YAP Logo"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          width: 'auto',
                          height: 'auto'
                        }}
                      />
                    </div>

                    {thumbnail && (
                      <div className="w-64 mx-auto mt-4">
                        <img
                          src={`/api/proxy-image?url=${encodeURIComponent(thumbnail)}`}
                          alt={title || ''}
                          style={{
                            width: '100%',
                            height: 'auto',
                            borderRadius: '0.5rem'
                          }}
                        />
                        {title && <h2 className="text-lg font-serif mt-4 text-center">{title}</h2>}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {savedQuotes.map((quote, index) => (
                      <div key={index} className="group relative text-gray-800 font-serif leading-relaxed">
                        {quote}
                        <button
                          onClick={() => removeQuote(index)}
                          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </details>
          </div>
        )}

        {showTranscript && (
          <div className="mt-8 space-y-8">
            {formattedTranscript && (
              <div className="p-6 bg-white rounded-lg shadow-sm">
                <h2 className="text-lg font-serif mb-4">Speaker Format Transcript</h2>
                <div className="whitespace-pre-wrap text-sm font-mono text-gray-700">{formattedTranscript}</div>
              </div>
            )}
            {fullTranscript && (
              <div className="p-6 bg-white rounded-lg shadow-sm">
                <h2 className="text-lg font-serif mb-4">Full Transcript</h2>
                <div className="whitespace-pre-wrap text-sm text-gray-700">{fullTranscript}</div>
              </div>
            )}
          </div>
        )}

        {podcastUrl && (
          <div className="mt-8 p-6 bg-white rounded-lg shadow-sm">
            <h2 className="text-lg font-serif mb-4">Generated Podcast</h2>
            <audio controls className="w-full">
              <source src={podcastUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </div>
    </div>
  );
}
