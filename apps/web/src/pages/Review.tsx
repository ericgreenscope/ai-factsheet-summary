import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PromptModal from '../components/PromptModal'
import MDEditor from '@uiw/react-md-editor'
import { getFile, saveReview, approveAndRegenerate, analyzeFile, FileDetail } from '../api'

const Review: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [fileDetail, setFileDetail] = useState<FileDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [analysisFinal, setAnalysisFinal] = useState('')
  const [editorNotes, setEditorNotes] = useState('')
  
  const [saving, setSaving] = useState(false)
  const [approving, setApproving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [showPromptModal, setShowPromptModal] = useState(false)

  const fetchFileDetail = async () => {
    if (!id) return

    try {
      const data = await getFile(id)
      setFileDetail(data)
      
      // Pre-fill from review if exists, otherwise from suggestion
      if (data.review) {
        setAnalysisFinal(data.review.analysis_text_final)
        setEditorNotes(data.review.editor_notes || '')
      } else if (data.suggestion) {
        setAnalysisFinal(data.suggestion.analysis_text)
      }
      
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch file details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFileDetail()

    // Poll every 3 seconds
    const interval = setInterval(fetchFileDetail, 3000)
    return () => clearInterval(interval)
  }, [id])

  const handleSaveDraft = async () => {
    if (!id || !fileDetail?.suggestion) {
      setError('No suggestion available to save')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await saveReview(id, {
        suggestion_id: fileDetail.suggestion.id,
        analysis_text_final: analysisFinal,
        editor_notes: editorNotes || undefined
      })
      await fetchFileDetail()
      alert('Draft saved successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async () => {
    if (!id || !fileDetail?.suggestion) {
      setError('No suggestion available to approve')
      return
    }

    // Save draft first
    try {
      await saveReview(id, {
        suggestion_id: fileDetail.suggestion.id,
        analysis_text_final: analysisFinal,
        editor_notes: editorNotes || undefined
      })
    } catch (err) {
      setError('Failed to save draft before approval')
      return
    }

    setApproving(true)
    setError(null)

    try {
      await approveAndRegenerate(id)
      await fetchFileDetail()
      alert('PPTX regenerated successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve and regenerate')
    } finally {
      setApproving(false)
    }
  }

  const handleRegenerateClick = () => {
    setShowPromptModal(true)
  }

  const handlePromptConfirm = async (prompt: string) => {
    if (!id) return

    setShowPromptModal(false)
    setRegenerating(true)
    setError(null)

    try {
      await analyzeFile(id, prompt)
      await fetchFileDetail()
      alert('New suggestion generated!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate suggestion')
    } finally {
      setRegenerating(false)
    }
  }

  const handlePromptCancel = () => {
    setShowPromptModal(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-greenscope rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-soft">
            <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-neutral-600 font-medium">Loading your factsheet details...</p>
        </div>
      </div>
    )
  }

  if (!fileDetail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-error-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">File not found</h3>
          <p className="text-neutral-600 mb-8">The requested factsheet could not be found or has been removed.</p>
          <button
            onClick={() => navigate('/files')}
            className="btn-primary"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back to Files
          </button>
        </div>
      </div>
    )
  }

  const isAnalyzing = fileDetail.jobs.some(j => j.type === 'ANALYZE' && j.status === 'RUNNING')
  const isRegeneratingPPT = fileDetail.jobs.some(j => j.type === 'REGENERATE' && j.status === 'RUNNING')
  const hasFailedJobs = fileDetail.jobs.some(j => j.status === 'FAILED')

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-greenscope-50 via-white to-greenscope-100/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center animate-fade-in">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-3 h-3 bg-greenscope-500 rounded-full"></div>
                <span className="text-sm font-medium text-greenscope-700 bg-greenscope-100 px-3 py-1 rounded-full">
                  Review & Edit
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-2">
                {fileDetail.original_filename}
              </h1>
              {fileDetail.company_name && (
                <p className="text-lg text-neutral-600">
                  {fileDetail.company_name}
                </p>
              )}
            </div>
            <button
              onClick={() => navigate('/files')}
              className="btn-secondary hidden sm:flex"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Back to Files
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Status Messages */}
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

          {isAnalyzing && (
            <div className="animate-slide-up bg-info-50 border border-info-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="animate-spin w-5 h-5 text-info-600 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-sm text-info-800 font-medium">Analyzing file... This may take a few minutes.</p>
              </div>
            </div>
          )}

          {isRegeneratingPPT && (
            <div className="animate-slide-up bg-info-50 border border-info-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="animate-spin w-5 h-5 text-info-600 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-sm text-info-800 font-medium">Regenerating PPTX... Please wait.</p>
              </div>
            </div>
          )}

          {hasFailedJobs && (
            <div className="animate-slide-up bg-warning-50 border border-warning-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-warning-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-warning-800 font-medium">
                  Some operations failed. Check the error details in the jobs section below.
                </p>
              </div>
            </div>
          )}

          {fileDetail.review?.status === 'APPROVED' && (
            <div className="animate-slide-up bg-success-50 border border-success-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-success-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-success-800 font-medium">This review has been approved.</p>
              </div>
            </div>
          )}

          {!fileDetail.suggestion && !isAnalyzing && (
            <div className="animate-slide-up card p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-warning-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-1">No AI suggestion available</h3>
                    <p className="text-neutral-600">Please analyze the file first to generate AI-powered insights.</p>
                  </div>
                </div>
                <button
                  onClick={handleRegenerateClick}
                  disabled={regenerating}
                  className="btn-primary whitespace-nowrap"
                >
                  {regenerating && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {regenerating ? 'Analyzing...' : 'Analyze Now'}
                </button>
              </div>
            </div>
          )}

          {/* Analysis Editor */}
          {fileDetail.suggestion && (
            <div className="card p-8 animate-fade-in">
              <div className="space-y-8">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-greenscope-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-greenscope-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900">Edit Analysis</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="analysis" className="block text-sm font-semibold text-neutral-700 mb-3">
                      Analysis Content
                    </label>
                    <div className={`transition-all duration-200 ${saving || approving ? 'opacity-60 pointer-events-none' : ''}`}>
                      <MDEditor
                        value={analysisFinal}
                        onChange={(val) => setAnalysisFinal(val || '')}
                        preview="edit"
                        height={500}
                        className="rounded-lg overflow-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-3">
                      Editor Notes <span className="text-neutral-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      value={editorNotes}
                      onChange={(e) => setEditorNotes(e.target.value)}
                      disabled={saving || approving}
                      rows={4}
                      className={`input-modern resize-none ${saving || approving ? 'bg-neutral-50' : ''}`}
                      placeholder="Add any notes, comments, or additional context..."
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-neutral-200">
                  <button
                    onClick={handleRegenerateClick}
                    disabled={regenerating || isAnalyzing}
                    className={`btn-secondary ${regenerating || isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {regenerating && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    {regenerating ? 'Generating...' : 'Request New Suggestion'}
                  </button>

                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                      onClick={handleSaveDraft}
                      disabled={saving || approving}
                      className={`btn-secondary ${saving || approving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {saving && (
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      )}
                      {saving ? 'Saving...' : 'Save Draft'}
                    </button>

                    <button
                      onClick={handleApprove}
                      disabled={approving || saving || isRegeneratingPPT}
                      className={`btn-primary disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {approving && (
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      )}
                      {approving ? 'Approving...' : 'Approve & Regenerate PPT'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Download Links */}
          {(fileDetail.download_url_original || fileDetail.download_url_regenerated || fileDetail.download_url_pdf) && (
            <div className="card p-6 animate-fade-in">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-greenscope-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-greenscope-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-neutral-900">Downloads</h2>
              </div>
              <div className="grid gap-3">
                {fileDetail.download_url_original && (
                  <a
                    href={fileDetail.download_url_original}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-greenscope-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-greenscope-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 group-hover:text-greenscope-600 transition-colors">
                          Original PPTX
                        </p>
                        <p className="text-sm text-neutral-500">Your original uploaded file</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-neutral-400 group-hover:text-greenscope-500 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </a>
                )}
                {fileDetail.download_url_regenerated && (
                  <a
                    href={fileDetail.download_url_regenerated}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-greenscope-50 hover:bg-greenscope-100 rounded-lg transition-all duration-200 group border border-greenscope-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-greenscope-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-greenscope-900 group-hover:text-greenscope-700 transition-colors">
                          AI-Enhanced PPTX
                        </p>
                        <p className="text-sm text-greenscope-600">Updated with AI analysis</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-greenscope-400 group-hover:text-greenscope-500 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </a>
                )}
                {fileDetail.download_url_pdf && (
                  <a
                    href={fileDetail.download_url_pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-all duration-200 group opacity-75"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-neutral-600 group-hover:text-neutral-700 transition-colors">
                          Analysis PDF
                        </p>
                        <p className="text-sm text-neutral-500">Used for AI processing</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-neutral-400 group-hover:text-neutral-500 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Jobs Status */}
          {fileDetail.jobs.length > 0 && (
            <div className="card p-6 animate-fade-in">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-neutral-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-neutral-900">Processing History</h2>
              </div>
              <div className="space-y-3">
                {fileDetail.jobs.map((job) => (
                  <div key={job.id} className="flex items-start justify-between p-4 bg-neutral-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">
                          {job.type}
                        </span>
                        <div className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          job.status === 'SUCCEEDED' ? 'bg-success-100 text-success-800' :
                          job.status === 'FAILED' ? 'bg-error-100 text-error-800' :
                          job.status === 'RUNNING' ? 'bg-info-100 text-info-800 animate-pulse' :
                          'bg-neutral-100 text-neutral-800'
                        }`}>
                          {job.status}
                        </div>
                      </div>
                      {job.error && (
                        <p className="text-xs text-error-600 bg-error-50 p-2 rounded border border-error-200">
                          {job.error}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-neutral-500 ml-4">
                      {new Date(job.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>

      <PromptModal
        isOpen={showPromptModal}
        onConfirm={handlePromptConfirm}
        onCancel={handlePromptCancel}
        isLoading={regenerating}
      />
    </div>
  )
}

export default Review

