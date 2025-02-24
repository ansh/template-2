'use client';

import { useCallback, useEffect, useState } from 'react';
import debounce from 'lodash/debounce';
import { toast } from 'react-hot-toast';

interface UnsplashImage {
  id: string;
  urls: {
    regular: string;
    small: string;
  };
  user: {
    name: string;
    username: string;
    links: {
      html: string;
    };
  };
  links: {
    html: string;
  };
}

interface UnsplashPickerProps {
  onSelect: (image: { id: string; name: string; url: string; attribution: { photographerName: string; photographerUrl: string; photoUrl: string; username: string } }) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function UnsplashPicker({ onSelect, onClose, isOpen }: UnsplashPickerProps) {
  const [search, setSearch] = useState('');
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);

  const searchUnsplash = useCallback(
    debounce(async (query: string, pageNum: number) => {
      if (!query.trim()) {
        setImages([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/unsplash/search?query=${encodeURIComponent(query)}&page=${pageNum}`
        );
        const data = await response.json();
        
        if (pageNum === 1) {
          setImages(data.results);
        } else {
          setImages(prev => [...prev, ...data.results]);
        }
      } catch (error) {
        console.error('Error searching Unsplash:', error);
        toast.error('Failed to load images');
      } finally {
        setIsLoading(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    if (search.trim()) {
      searchUnsplash(search, page);
    }
  }, [search, page]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setImages([]);
      setPage(1);
    }
  }, [isOpen]);

  const handleImageSelect = async (image: UnsplashImage) => {
    // Track download when image is selected
    try {
      await fetch(`/api/unsplash/download?photoId=${image.id}`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to track download:', error);
      // Continue anyway as this shouldn't block the user
    }

    onSelect({
      id: image.id,
      name: image.user.name,
      url: image.urls.regular,
      attribution: {
        photographerName: image.user.name,
        photographerUrl: image.user.links.html,
        photoUrl: image.links.html,
        username: image.user.username
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-xl max-h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium">Choose a background image</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search for images..."
              className="w-full p-2 pl-9 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <svg 
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Image Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 gap-3">
            {images.map((image) => (
              <button
                key={image.id}
                onClick={() => handleImageSelect(image)}
                className="group relative aspect-[9/16] overflow-hidden rounded-lg border hover:border-blue-500 transition-colors"
              >
                <img 
                  src={image.urls.small} 
                  alt={`Photo by ${image.user.name} on Unsplash`} 
                  className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1.5">
                  <a 
                    href={`${image.links.html}?utm_source=meme_generator&utm_medium=referral`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Photo
                  </a>
                  {' '}by{' '}
                  <a 
                    href={`https://unsplash.com/@${image.user.username}?utm_source=meme_generator&utm_medium=referral`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {image.user.name}
                  </a>
                  {' '}on{' '}
                  <a
                    href="https://unsplash.com/?utm_source=meme_generator&utm_medium=referral"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Unsplash
                  </a>
                </div>
              </button>
            ))}
          </div>

          {images.length > 0 && (
            <div className="mt-3 text-center">
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={isLoading}
                className="px-4 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}

          {isLoading && images.length === 0 && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Searching images...</p>
            </div>
          )}

          {!isLoading && images.length === 0 && search && (
            <div className="text-center py-12 text-gray-500">
              No images found for "{search}"
            </div>
          )}

          {!isLoading && images.length === 0 && !search && (
            <div className="text-center py-12 text-gray-500">
              Start typing to search for images
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 