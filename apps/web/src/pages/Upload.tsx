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


  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-greenscope-50 via-white to-greenscope-100/50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center animate-fade-in">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-gradient-greenscope rounded-full shadow-greenscope">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
              Upload ESG Factsheets
            </h1>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto mb-8">
              Transform your ESG reporting with AI-powered insights. Upload PPTX and PDF files to get intelligent summaries and analysis.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="space-y-8">
          {/* How it works info card */}
          <div className="card p-6 animate-slide-up">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-greenscope-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-greenscope-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-neutral-900 mb-3">How it works</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-600">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-greenscope-500 rounded-full"></div>
                      <span><strong>PPTX files</strong> - Used for generating AI-powered summaries and insights</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-greenscope-500 rounded-full"></div>
                      <span><strong>PDF files</strong> - Used for comprehensive AI analysis with visual elements</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-greenscope-500 rounded-full"></div>
                      <span><strong>Auto-matching</strong> - Files are matched by name (e.g., "company-report.pptx" → "company-report.pdf")</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-greenscope-500 rounded-full"></div>
                      <span><strong>Complete pairs required</strong> - Both files must be present to enable upload</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Interface */}
          <div className="card p-8 animate-slide-up">
            <div className="space-y-8">
              {/* Company Name Input */}
              <div className="animate-fade-in">
                <label htmlFor="company-name" className="block text-sm font-semibold text-neutral-700 mb-3">
                  Company Name <span className="text-neutral-400 font-normal">(Optional)</span>
                </label>
                <input
                  id="company-name"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="input-modern"
                  placeholder="Enter company name for better organization..."
                  disabled={uploading}
                />
              </div>

              {/* File Uploader */}
              <div className="animate-fade-in">
                <DualUploader onFilesSelected={handleFilesSelected} disabled={uploading} />
              </div>

              {/* Error Display */}
              {error && (
                <div className="animate-slide-up bg-error-50 border border-error-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-error-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-error-800 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-neutral-200">
                <button
                  onClick={() => navigate('/files')}
                  className="btn-secondary"
                  disabled={uploading}
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || selectedFiles.length === 0}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading && (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {uploading ? 'Processing Files...' : 'Upload Complete Pairs'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Upload

