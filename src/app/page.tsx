import MemeGenerator from './components/MemeGenerator';
import MemeDatabase from './components/MemeDatabase';

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <MemeGenerator />
        <MemeDatabase />
      </div>
    </div>
  );
}