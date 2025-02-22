import MemeDatabase from '../components/MemeDatabase';

export default function TemplateLibrary() {
  return (
    <div className="py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Template Library</h1>
        <p className="text-gray-600 mb-8">
          Browse our collection of meme templates. Each template includes usage instructions and example captions.
        </p>
        <MemeDatabase />
      </div>
    </div>
  );
} 