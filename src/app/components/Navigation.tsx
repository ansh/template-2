'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const routes = [
    { path: '/', label: 'Home' },
    { path: '/template-library', label: 'Template Library' },
    { path: '/upload', label: 'Upload Template' },
  ];

  const currentPage = routes.find(route => route.path === pathname)?.label || 'Home';

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
        <Link href="/" className="text-2xl font-bold">
          Meme Generator
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-6">
          {routes.map(route => (
            <Link
              key={route.path}
              href={route.path}
              className={`relative py-2 text-sm font-medium transition-colors
                ${pathname === route.path 
                  ? 'text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
                }
                ${pathname === route.path 
                  ? 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600' 
                  : ''
                }
              `}
            >
              {route.label}
            </Link>
          ))}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-1 text-gray-600"
          >
            <span>{currentPage}</span>
            <svg
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-lg shadow-lg border">
              {routes.map(route => (
                <Link
                  key={route.path}
                  href={route.path}
                  className={`block px-4 py-2 text-sm ${
                    pathname === route.path
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {route.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
} 