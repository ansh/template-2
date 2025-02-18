'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function EmbeddingsPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleBackfill = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/templates/backfill-embeddings', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to process');
      
      setResults(data);
      toast.success(`Processed ${data.processed} templates`);
    } catch (error) {
      console.error('Backfill error:', error);
      toast.error('Failed to process embeddings');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Template Embeddings</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Backfill Embeddings</h2>
        <p className="text-gray-600 mb-4">
          Generate embeddings for all templates that don't have them yet.
        </p>
        
        <button
          onClick={handleBackfill}
          disabled={isProcessing}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {isProcessing ? 'Processing...' : 'Start Backfill'}
        </button>

        {results && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Results:</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 