'use client';

import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="border-b">
      <div className="container mx-auto px-8 md:px-12 lg:px-16 h-16 flex items-center justify-between max-w-6xl">
        <Link href="/" className="text-2xl font-bold">
          Meme Generator
        </Link>
        <div className="space-x-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            Home
          </Link>
          <Link href="/template-library" className="text-gray-600 hover:text-gray-900">
            Template Library
          </Link>
          <Link href="/upload" className="text-gray-600 hover:text-gray-900">
            Upload Template
          </Link>
        </div>
      </div>
    </nav>
  );
} 