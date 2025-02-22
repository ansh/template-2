import MemeGenerator from './components/MemeGenerator';

export default function Home() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <MemeGenerator />
      </div>
    </div>
  );
}