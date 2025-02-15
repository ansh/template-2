'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Image from 'next/image'

export function TemplateUploader() {
  const [templateName, setTemplateName] = useState('')
  const [templateExplanation, setTemplateExplanation] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !templateName) {
      setError('Please provide both a template name and video')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('Starting upload...')
      
      // Upload video to Supabase Storage
      const filename = `${Date.now()}-${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('meme-templates')
        .upload(filename, file, {
          cacheControl: '3600',
          contentType: file.type
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      console.log('File uploaded successfully:', uploadData)

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('meme-templates')
        .getPublicUrl(uploadData.path)

      console.log('Public URL:', publicUrl)

      // Create database entry - with more detailed error logging
      try {
        const { data: dbData, error: dbError } = await supabase
          .from('meme_templates')  // Make sure this matches your table name exactly
          .insert({
            name: templateName,
            instructions: templateExplanation,
            video_url: publicUrl
          })
          .select()
          .single()

        if (dbError) {
          console.error('Database insertion error:', dbError)
          throw dbError
        }

        console.log('Database entry created successfully:', dbData)

        // Reset form
        setFile(null)
        setPreview('')
        setTemplateName('')
        setTemplateExplanation('')
        alert('Template uploaded successfully!')
      } catch (dbErr) {
        console.error('Detailed database error:', dbErr)
        // Don't throw here - we want to keep the uploaded file
        setError('File uploaded but failed to create database entry')
      }
    } catch (err) {
      console.error('Error details:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while uploading')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
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

      <div>
        <label htmlFor="templateVideo" className="block text-sm font-medium mb-2">
          Template Video
        </label>
        <input
          id="templateVideo"
          type="file"
          onChange={handleFileChange}
          className="w-full"
          accept="video/*"
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

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
      >
        {loading ? 'Uploading...' : 'Upload Template'}
      </button>
    </form>
  )
} 