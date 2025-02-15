'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function UploadPage() {
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    instructions: '',
    videoFile: null as File | null,
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.videoFile) return;

    try {
      setUploading(true);

      // 1. Upload video to storage
      const fileName = `${Date.now()}-${formData.videoFile.name}`;
      const filePath = `templates/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('meme-videos')
        .upload(filePath, formData.videoFile);

      if (uploadError) throw uploadError;

      // 2. Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('meme-videos')
        .getPublicUrl(filePath);

      // 3. Create template record
      const { error: dbError } = await supabase
        .from('meme_templates')
        .insert({
          name: formData.name,
          video_url: publicUrl,
          instructions: formData.instructions,
        });

      if (dbError) throw dbError;

      // Reset form
      setFormData({
        name: '',
        instructions: '',
        videoFile: null,
      });

      alert('Template uploaded successfully!');

    } catch (error) {
      console.error('Error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Upload Meme Template</h1>

      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Template Name</label>
          <input
            type="text"
            required
            className="w-full p-2 border rounded"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Instructions</label>
          <textarea
            required
            className="w-full p-2 border rounded"
            value={formData.instructions}
            onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
            rows={4}
            placeholder="Describe how this template should be used..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Video File</label>
          <input
            type="file"
            accept="video/*"
            required
            className="w-full p-2 border rounded"
            onChange={(e) => setFormData(prev => ({ ...prev, videoFile: e.target.files?.[0] || null }))}
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {uploading ? 'Uploading...' : 'Upload Template'}
        </button>
      </form>

      {uploading && (
        <div className="mt-4 text-center text-gray-600">
          Uploading... Please wait...
        </div>
      )}
    </div>
  );
} 