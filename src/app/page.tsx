import { Suspense } from 'react';
import MemeGenerator from './components/MemeGenerator';

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">AI Meme Generator</h1>
      
      <Suspense fallback={<div className="animate-pulse h-96 bg-gray-200 rounded-lg">
        Loading generator...
      </div>}>
        <MemeGenerator />
      </Suspense>
    </main>
  );
}