'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

export function TemplateUploader() {
  const [templateName, setTemplateName] = useState('')
  const [templateExplanation, setTemplateExplanation] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!file) {
        throw new Error('Please select a video file')
      }

      // Handle file upload
      const filename = `${Date.now()}-${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('meme-templates')
        .upload(filename, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('meme-templates')
        .getPublicUrl(uploadData.path)

      // Generate embedding from name and instructions
      const textForEmbedding = `${templateName}. ${templateExplanation}`.trim()
      const embeddingResponse = await fetch('/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textForEmbedding })
      });

      if (!embeddingResponse.ok) {
        throw new Error('Failed to generate embedding');
      }

      const { embedding } = await embeddingResponse.json();

      // Create database entry
      const { error: dbError } = await supabase
        .from('meme_templates')
        .insert({
          name: templateName,
          instructions: templateExplanation,
          video_url: publicUrl,
          embedding
        })

      if (dbError) throw dbError

      // Reset form
      setFile(null)
      setPreview('')
      setTemplateName('')
      setTemplateExplanation('')
      toast.success('Template uploaded successfully!')

    } catch (err) {
      console.error('Error details:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while uploading')
      toast.error('Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Video File</label>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              setFile(file)
              setPreview(URL.createObjectURL(file))
            }
          }}
          className="mt-1 block w-full"
        />
      </div>

      <div>
        <label htmlFor="templateName" className="block text-sm font-medium mb-2">
          Template Name
        </label>
        <input
          id="templateName"
          type="text"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          className="w-full px-4 py-2 border rounded-md"
          placeholder="Enter template name"
          required
        />
      </div>

      <div>
        <label htmlFor="templateExplanation" className="block text-sm font-medium mb-2">
          How to Use This Template
        </label>
        <textarea
          id="templateExplanation"
          value={templateExplanation}
          onChange={(e) => setTemplateExplanation(e.target.value)}
          className="w-full px-4 py-2 border rounded-md h-32"
          placeholder="Explain how this meme template works and how to use it effectively..."
          required
        />
      </div>

      {preview && (
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Preview:</p>
          <video 
            src={preview} 
            controls 
            className="w-full"
            style={{ maxHeight: '400px' }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !file || !templateName}
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
      >
        {loading ? 'Uploading...' : 'Upload Template'}
      </button>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}
    </form>
  )
} 