'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { TemplateUploader } from '@/app/components/TemplateUploader'

export default function UploadPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Upload Meme Template</h1>
      <TemplateUploader />
    </div>
  )
} 