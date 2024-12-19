import React, { useState, useRef } from 'react';

interface PodcastPlayerProps {
    audioUrl: string | null;
    summary: string | null;
    isLoading: boolean;
    status: string;
}

export default function PodcastPlayer({ audioUrl, summary, isLoading, status }: PodcastPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    if (isLoading) {
        return (
            <div className="w-full max-w-2xl mx-auto p-4 bg-white rounded-lg shadow-md">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="text-blue-500 font-medium mt-4">
                        {status || 'Generating podcast...'}
                    </div>
                </div>
            </div>
        );
    }

    if (!audioUrl) {
        return null;
    }

    return (
        <div className="w-full max-w-2xl mx-auto p-4 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Generated Podcast</h3>

            {/* Audio Player */}
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <audio
                    ref={audioRef}
                    src={audioUrl}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    controls
                    className="w-full"
                />

                <button
                    onClick={togglePlay}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                    {isPlaying ? 'Pause' : 'Play'}
                </button>
            </div>

            {/* Summary Display */}
            {summary && (
                <div className="mt-4">
                    <h4 className="font-medium mb-2">Podcast Summary</h4>
                    <div className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap">
                        {summary}
                    </div>
                </div>
            )}
        </div>
    );
} 