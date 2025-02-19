'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { TemplateUploader } from '@/app/components/TemplateUploader'

export default function UploadPage() {
  return (
    <div className="container mx-auto px-8 md:px-12 lg:px-16 pt-8 max-w-6xl">
      <h1 className="text-2xl font-bold mb-8">Upload Meme Template</h1>
      <TemplateUploader />
    </div>
  )
} 