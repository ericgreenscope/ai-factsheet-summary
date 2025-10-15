import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DualUploader from '../components/DualUploader'
import { uploadFiles } from '../api'

const Upload: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [companyName, setCompanyName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files)
    setError(null)
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file')
      return
    }

    // Validate that files come in PPTX+PDF pairs
    const pptxFiles = selectedFiles.filter(f => f.name.endsWith('.pptx'))
    const pdfFiles = selectedFiles.filter(f => f.name.endsWith('.pdf'))

    if (pptxFiles.length === 0 || pdfFiles.length === 0) {
      setError('Please upload both PPTX and PDF files for each factsheet')
      return
    }

    // Check for matching pairs
    const pptxBasenames = new Set(pptxFiles.map(f => f.name.slice(0, -5))) // Remove .pptx
    const pdfBasenames = new Set(pdfFiles.map(f => f.name.slice(0, -4)))   // Remove .pdf

    const missingPdf = [...pptxBasenames].filter(base => !pdfBasenames.has(base))
    const missingPptx = [...pdfBasenames].filter(base => !pptxBasenames.has(base))

    if (missingPdf.length > 0) {
      setError(`Missing PDF files for: ${missingPdf.join(', ')}`)
      return
    }

    if (missingPptx.length > 0) {
      setError(`Missing PPTX files for: ${missingPptx.join(', ')}`)
      return
    }

    // Check that we have complete pairs
    if (pptxFiles.length !== pdfFiles.length) {
      setError('All files must have matching pairs. Please ensure each PPTX file has a corresponding PDF file with the same name.')
      return
    }

    setUploading(true)
    setError(null)

    try {
      await uploadFiles(selectedFiles, companyName || undefined)
      // Navigate to files list
      navigate('/files')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index))
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upload ESG Factsheets</h1>
          <p className="mt-2 text-sm text-gray-600">
            Upload PPTX and PDF files in separate columns. Files will be automatically matched by name (excluding extension).
          </p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-medium text-blue-900 mb-2">How it works:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Upload PPTX files in the left column - these are used for <strong>generating output</strong> with AI summaries</li>
              <li>• Upload PDF files in the right column - these are used for <strong>AI analysis</strong> (preserves charts and visual elements)</li>
              <li>• Files are automatically matched by name (e.g., "company-report.pptx" matches with "company-report.pdf")</li>
              <li>• Both files must be present to complete a pair and enable upload</li>
            </ul>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <label htmlFor="company-name" className="block text-sm font-medium text-gray-700 mb-2">
              Company Name (Optional)
            </label>
            <input
              id="company-name"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter company name..."
              disabled={uploading}
            />
          </div>

          <DualUploader onFilesSelected={handleFilesSelected} disabled={uploading} />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => navigate('/files')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {uploading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {uploading ? 'Uploading...' : 'Upload Complete Pairs'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Upload

