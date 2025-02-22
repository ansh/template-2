'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { MemeTemplate } from '@/lib/supabase/types';

export default function MemeDatabase() {
  const [templates, setTemplates] = useState<MemeTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTemplates() {
      try {
        const { data, error } = await supabase
          .from('meme_templates')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setTemplates(data);
      } catch (error) {
        console.error('Error loading templates:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTemplates();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Template Database</h2>
      {templates.length === 0 ? (
        <p className="text-gray-600">No templates in database yet</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="border rounded p-4">
              <h3 className="font-bold text-gray-900">{template.name}</h3>
              <video
                src={template.video_url}
                className="w-full mt-2 aspect-video object-cover"
                controls
              />
              <p className="text-gray-600 mt-2 line-clamp-2">{template.instructions}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 