import { TemplateUploader } from '@/app/components/TemplateUploader'

export default function UploadPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Upload New Template</h1>
      <p className="text-gray-600 mb-8">
        Add a new meme template to the database. Please include a clear explanation of how the template should be used.
      </p>
      <TemplateUploader />
    </div>
  )
} 