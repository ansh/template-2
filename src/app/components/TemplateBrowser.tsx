'use client';

import { useState, useEffect } from 'react';
import { MemeTemplate } from '@/lib/supabase/types';

interface Props {
  onSelectTemplate: (template: MemeTemplate) => void;
}

export default function TemplateBrowser({ onSelectTemplate }: Props) {
  const [templates, setTemplates] = useState<MemeTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/templates');
        if (!response.ok) {
          throw new Error('Failed to fetch templates');
        }
        const data = await response.json();
        setTemplates(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load templates');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  if (isLoading) return <div>Loading templates...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {templates.map((template) => (
        <div
          key={template.id}
          className="border rounded-lg p-4 cursor-pointer hover:border-blue-500"
          onClick={() => onSelectTemplate(template)}
        >
          <video
            src={template.video_url}
            className="w-full aspect-video object-cover rounded mb-2"
            controls
          />
          <h3 className="font-medium">{template.name}</h3>
        </div>
      ))}
    </div>
  );
} 