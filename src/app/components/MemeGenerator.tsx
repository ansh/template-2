'use client';

import { useState } from 'react';

export default function MemeGenerator() {
  const [concept, setConcept] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!concept) return;
    
    try {
      setLoading(true);
      // We'll implement AI generation later
      console.log('Generating meme for:', concept);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Describe Your Meme
          </label>
          <textarea
            className="w-full p-2 border rounded text-gray-900"
            rows={3}
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="What's your meme idea?"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !concept}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Generating...' : 'Generate Meme'}
        </button>
      </div>
    </div>
  );
} 