'use client';

import { useState } from 'react';
import { MemeVideo } from '@/lib/types/meme';

export default function MemeDatabase() {
  const [memes, setMemes] = useState<MemeVideo[]>([]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Meme Database</h2>
      
      {memes.length === 0 ? (
        <p className="text-gray-500">No memes in database yet</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {memes.map((meme) => (
            <div key={meme.id} className="border rounded-md p-4">
              <h3 className="font-medium">{meme.name}</h3>
              <video
                src={meme.videoUrl}
                className="w-full aspect-[9/16] object-cover rounded-md mt-2"
                controls
              />
              <div className="mt-2 space-y-1">
                <p className="text-sm"><strong>Instructions:</strong> {meme.instructions}</p>
                <p className="text-sm"><strong>Typical Usage:</strong> {meme.typicalUsage}</p>
                <div className="flex flex-wrap gap-1">
                  {meme.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 