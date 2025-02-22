/* eslint-disable react/no-unescaped-entities */
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
    <div className="py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Manage Template Embeddings</h1>
        <p className="text-gray-600 mb-8">
          Update and manage AI embeddings for template search and matching functionality.
        </p>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Backfill Embeddings</h2>
          <p className="text-gray-600 mb-6">
            Generate embeddings for all templates that don't have them yet.
          </p>
          
          <button
            onClick={handleBackfill}
            disabled={isProcessing}
            className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
          >
            {isProcessing ? 'Processing...' : 'Start Backfill'}
          </button>

          {results && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Results:</h3>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 