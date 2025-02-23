import { useState, useRef, useEffect } from 'react';

interface VideoTrimmerProps {
  videoUrl: string;
  onTrimComplete: (start: number, end: number) => void;
}

export default function VideoTrimmer({ videoUrl, onTrimComplete }: VideoTrimmerProps) {
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.onloadedmetadata = () => {
        const videoDuration = videoRef.current?.duration || 0;
        setDuration(videoDuration);
        setEndTime(videoDuration);
      };
    }

    // Cleanup function
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, [videoUrl]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = Number(e.target.value);
    setStartTime(Math.min(newStart, endTime - 0.1));
    if (videoRef.current) {
      videoRef.current.currentTime = newStart;
    }
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = Number(e.target.value);
    setEndTime(Math.max(newEnd, startTime + 0.1));
    if (videoRef.current) {
      videoRef.current.currentTime = newEnd;
    }
  };

  const handleTrimConfirm = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    onTrimComplete(startTime, endTime);
  };

  return (
    <div className="space-y-4">
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        className="w-full rounded-lg"
      />
      
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <label className="w-24">Start Time:</label>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={startTime}
            onChange={handleStartTimeChange}
            className="flex-1"
          />
          <span className="w-16 text-right">{formatTime(startTime)}</span>
        </div>

        <div className="flex items-center gap-4">
          <label className="w-24">End Time:</label>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={endTime}
            onChange={handleEndTimeChange}
            className="flex-1"
          />
          <span className="w-16 text-right">{formatTime(endTime)}</span>
        </div>
      </div>

      <button
        onClick={handleTrimConfirm}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Confirm Trim
      </button>
    </div>
  );
} 