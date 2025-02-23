import React, { useState, useEffect } from 'react';
import { BackgroundImage } from '../lib/types/meme';
import { supabase } from '../lib/supabase';

interface BackgroundSelectorProps {
  onSelect: (background: BackgroundImage) => void;
  selected: BackgroundImage | null;
}

export default function BackgroundSelector({ onSelect, selected }: BackgroundSelectorProps) {
  const [backgrounds, setBackgrounds] = useState<BackgroundImage[]>([]);

  useEffect(() => {
    // Fetch backgrounds from your API/storage
    async function loadBackgrounds() {
      const { data } = await supabase
        .from('backgrounds')
        .select('*')
        .eq('aspect_ratio', '9:16');
      if (data) setBackgrounds(data);
    }
    loadBackgrounds();
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4">
      {backgrounds.map(background => (
        <button
          key={background.id}
          onClick={() => onSelect(background)}
          className={`relative aspect-[9/16] overflow-hidden rounded-lg border-2 
            ${selected?.id === background.id ? 'border-blue-500' : 'border-transparent'}`}
        >
          <img 
            src={background.url} 
            alt={background.name} 
            className="w-full h-full object-cover" 
          />
        </button>
      ))}
    </div>
  );
} 