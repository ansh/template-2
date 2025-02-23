'use client';

import MemeGenerator from './components/MemeGenerator';
import { useState } from 'react';

export default function Home() {
  const [isGreenscreenMode, setIsGreenscreenMode] = useState(false);
  
  return (
    <div className="py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">AI Meme Generator</h1>
        <p className="text-gray-600 mb-8">
          Create custom memes using AI. Enter your target audience and meme idea, and we'll help you generate the perfect meme.
        </p>
        <MemeGenerator 
          isGreenscreenMode={isGreenscreenMode} 
          onToggleMode={() => setIsGreenscreenMode(!isGreenscreenMode)} 
        />
      </div>
    </div>
  );
}