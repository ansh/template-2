"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MicIcon, StopCircleIcon, Loader2, ListIcon } from 'lucide-react';
import { useDeepgram } from '../contexts/DeepgramContext';
import { addDocument } from '../lib/firebaseUtils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const [showText, setShowText] = useState(false);
  const [lines, setLines] = useState<number[]>(Array(30).fill(0));
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { connectToDeepgram, disconnectFromDeepgram, connectionState, realtimeTranscript } = useDeepgram();
  const router = useRouter();

  const isRecording = connectionState === 1;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setLines(prev => prev.map(() => Math.random()));
      }, 500);
      return () => clearInterval(interval);
    } else {
      setLines(Array(30).fill(0));
    }
  }, [isRecording]);

  const handleRecordToggle = async () => {
    if (isRecording) {
      disconnectFromDeepgram();
      setShowText(true);
      setIsLoading(true);
      
      if (realtimeTranscript) {
        try {
          await addDocument('notes', {
            text: realtimeTranscript,
            timestamp: new Date().toISOString()
          });
          console.log('Note saved successfully');
          
          // Wait for a short delay to show the loading indicator
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Navigate to the All Notes page
          router.push('/all-notes');
        } catch (error) {
          console.error('Error saving note:', error);
          setIsLoading(false);
        }
      }
    } else {
      connectToDeepgram();
      setShowText(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#1c1c1e] text-white font-sans">
      {/* Status Bar */}
      <div className="flex justify-between items-center px-4 py-2 text-sm">
        <span>{currentTime}</span>
        <div className="flex space-x-1">
          <div className="w-4 h-4 rounded-full bg-white"></div>
          <div className="w-4 h-4 rounded-full bg-white"></div>
          <div className="w-4 h-4 rounded-full bg-white"></div>
        </div>
      </div>

      {/* All Notes Button */}
      {!isRecording && !isLoading && (
        <div className="absolute top-4 right-4">
          <Link href="/all-notes">
            <button className="px-3 py-2 rounded-md bg-gray-700 hover:bg-gray-600 focus:outline-none flex items-center justify-center text-sm">
              <ListIcon size={16} className="mr-2" />
              All Notes
            </button>
          </Link>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-between p-4">
        <AnimatePresence>
          {(showText || isRecording || isLoading) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center p-4"
            >
              {isLoading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-10 h-10 animate-spin mb-4" />
                  <p className="text-lg">Saving your note...</p>
                </div>
              ) : (
                <motion.p
                  className="text-4xl font-bold text-center"
                  style={{
                    background: "linear-gradient(45deg, #c0c0c0, #f0f0f0, #c0c0c0)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundSize: "200% 200%",
                  }}
                  animate={{
                    backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
                  }}
                  transition={{
                    duration: 5,
                    ease: "linear",
                    repeat: Infinity,
                  }}
                >
                  {realtimeTranscript || "Just Speak"}
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Animated Lines */}
        <div className="h-40 flex justify-center items-end space-x-0.5 mb-20">
          {lines.map((height, index) => (
            <motion.div
              key={index}
              className="w-1 bg-white rounded-full"
              initial={{ height: 0 }}
              animate={{ height: `${height * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          ))}
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={handleRecordToggle}
            className="w-20 h-20 rounded-2xl bg-orange-500 hover:bg-orange-600 focus:outline-none flex items-center justify-center"
            disabled={isLoading}
          >
            {isRecording ? (
              <StopCircleIcon size={32} />
            ) : (
              <MicIcon size={32} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
