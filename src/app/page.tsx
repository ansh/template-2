'use client';

import Link from "next/link";
import Image from "next/image";
import PodcastPlayer from './components/PodcastPlayer';
import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [quotes, setQuotes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState<any>(null);
  const [podcastData, setPodcastData] = useState<{
    audioUrl: string;
    summary: string;
    status: string;
  } | null>(null);
  const [processingStatus, setProcessingStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setQuotes([]);
    setPodcastData(null);
    setProcessingStatus('Processing video URL...');

    try {
      const response = await fetch('/api/youtube/transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl: url,
          generatePodcastAudio: true
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process video');
      }

      setQuotes(data.quotes || []);
      setMetadata(data.metadata);
      setPodcastData(data.podcastData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setProcessingStatus('');
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="absolute top-4 right-4">
        <Image
          src="/yaplogonobg.png"
          alt="YapThread Logo"
          width={150}
          height={150}
          priority
        />
      </div>

      <h1 className="text-6xl font-bold text-center mt-20 mb-12">
        YapThread Playground
      </h1>

      <Link
        href="/youtube-quotes"
        className="text-xl bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
      >
        YouTube Yap Extractor
      </Link>

      <div className="mt-8">
        <PodcastPlayer
          audioUrl={podcastData?.audioUrl || null}
          summary={podcastData?.summary || null}
          isLoading={isLoading}
          status={processingStatus}
        />
      </div>
    </main>
  );
}
