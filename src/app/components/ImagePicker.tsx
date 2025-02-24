'use client';

import { useCallback, useEffect, useState, DragEvent, useRef } from 'react';
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
  };
}

interface ImagePickerProps {
  onSelect: (image: { id: string; name: string; url: string }) => void;
  onClose: () => void;
  isOpen: boolean;
}

type Tab = 'unsplash' | 'upload' | 'link';

export default function ImagePicker({ onSelect, onClose, isOpen }: ImagePickerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('unsplash');
  const [search, setSearch] = useState('');
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [imageUrl, setImageUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);

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

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setImages([]);
      setPage(1);
      setImageUrl('');
      setActiveTab('unsplash');
    }
  }, [isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      onSelect({
        id: 'uploaded-' + Date.now(),
        name: file.name,
        url
      });
      onClose();
    };
    reader.readAsDataURL(file);
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;

    try {
      new URL(imageUrl);
      onSelect({
        id: 'link-' + Date.now(),
        name: 'Linked Image',
        url: imageUrl
      });
      onClose();
    } catch {
      toast.error('Please enter a valid URL');
    }
  };

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items[0].kind === 'file') {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDragging(false);
  }, []);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      onSelect({
        id: 'uploaded-' + Date.now(),
        name: file.name,
        url
      });
      onClose();
    };
    reader.readAsDataURL(file);
  };

  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div 
        className="absolute inset-0 bg-black/50" 
        style={{ position: 'fixed' }}
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div 
          ref={modalRef}
          className="bg-white rounded-lg w-full max-w-xl flex flex-col relative z-10"
          style={{ height: '600px' }}
        >
          <div className="border-b">
            <div className="flex">
              {[
                { id: 'unsplash', label: 'Unsplash' },
                { id: 'upload', label: 'Upload' },
                { id: 'link', label: 'Link' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 focus:outline-none ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === 'unsplash' && (
              <div className="h-full flex flex-col">
                <div className="p-3 border-b">
                  <div className="relative">
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Search Unsplash..."
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

                <div className="flex-1 overflow-y-auto p-3">
                  <div className="grid grid-cols-2 gap-3">
                    {images.map((image) => (
                      <button
                        key={image.id}
                        onClick={() => onSelect({
                          id: image.id,
                          name: `Unsplash photo by ${image.user.name}`,
                          url: image.urls.regular
                        })}
                        className="group relative aspect-[9/16] overflow-hidden rounded-lg border hover:border-blue-500 transition-colors"
                      >
                        <img 
                          src={image.urls.small} 
                          alt={`Photo by ${image.user.name}`} 
                          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1.5 transform translate-y-full group-hover:translate-y-0 transition-transform">
                          Photo by {image.user.name}
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
                </div>
              </div>
            )}

            {activeTab === 'upload' && (
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className="h-full p-8"
              >
                <div 
                  className={`w-full h-full flex items-center justify-center border-2 border-dashed rounded-lg transition-colors ${
                    isDragging 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center cursor-pointer p-8 text-center"
                  >
                    <svg
                      className={`w-16 h-16 mb-4 transition-colors ${
                        isDragging ? 'text-blue-500' : 'text-gray-400'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className={`text-base mb-2 font-medium transition-colors ${
                      isDragging ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {isDragging ? 'Drop image here' : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-sm text-gray-500">Maximum file size: 5MB</p>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'link' && (
              <div className="p-6">
                <form onSubmit={handleLinkSubmit} className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm mb-4"
                  />
                  <button
                    type="submit"
                    disabled={!imageUrl.trim()}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-sm"
                  >
                    Add Image
                  </button>
                </form>
              </div>
            )}
          </div>

          <button 
            onClick={onClose}
            className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 