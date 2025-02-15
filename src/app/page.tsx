import MemeGenerator from './components/MemeGenerator';
import MemeDatabase from './components/MemeDatabase';

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Meme Generator</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <MemeGenerator />
        <MemeDatabase />
      </div>
    </div>
  );
}