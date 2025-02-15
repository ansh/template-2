'use client';

import { useState, useEffect } from 'react';
import { MemeTemplate } from '@/lib/supabase/types';

interface TemplateBrowserProps {
  onSelectTemplate: (template: MemeTemplate) => void;
}

export default function TemplateBrowser({ onSelectTemplate }: TemplateBrowserProps) {
  const [templates, setTemplates] = useState<MemeTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/templates');
        const data = await response.json();
        setTemplates(data.templates);
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  if (loading) {
    return <div className="animate-pulse h-48 bg-gray-200 rounded"></div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <div 
          key={template.id} 
          className="border rounded p-4 cursor-pointer hover:border-blue-500 bg-white"
          onClick={() => onSelectTemplate(template)}
        >
          <video
            src={template.video_url}
            className="w-full aspect-video object-cover rounded mb-2"
            controls
          />
          <h3 className="font-medium text-gray-900">{template.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{template.instructions}</p>
        </div>
      ))}
    </div>
  );
} 