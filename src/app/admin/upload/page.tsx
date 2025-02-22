import { TemplateUploader } from '@/app/components/TemplateUploader'

export default function UploadPage() {
  return (
    <div className="py-8 md:py-12">
      <h1 className="text-3xl font-bold mb-4">Upload New Template</h1>
      <p className="text-gray-600 mb-8">
        Add a new meme template to the database. Please include a clear explanation of how the template should be used.
      </p>
      <div className="max-w-4xl mx-auto">
        <TemplateUploader />
      </div>
    </div>
  )
} 