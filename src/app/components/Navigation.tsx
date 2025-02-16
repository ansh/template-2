'use client';

export default function Navigation() {
  return (
    <nav className="bg-white shadow mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-xl font-bold">Meme Generator</h1>
          <div className="flex space-x-8">
            <a href="/" className="px-3 py-2 text-gray-700 hover:text-gray-900">
              Home
            </a>
            <a href="/upload" className="px-3 py-2 text-gray-700 hover:text-gray-900">
              Upload Template
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
} 