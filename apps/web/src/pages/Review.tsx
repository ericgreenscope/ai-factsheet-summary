import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReviewEditor from '../components/ReviewEditor'
import PromptModal from '../components/PromptModal'
import { getFile, saveReview, approveAndRegenerate, analyzeFile, FileDetail } from '../api'

const Review: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [fileDetail, setFileDetail] = useState<FileDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [strengthsFinal, setStrengthsFinal] = useState('')
  const [weaknessesFinal, setWeaknessesFinal] = useState('')
  const [actionPlanFinal, setActionPlanFinal] = useState('')
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
        setStrengthsFinal(data.review.strengths_final)
        setWeaknessesFinal(data.review.weaknesses_final)
        setActionPlanFinal(data.review.action_plan_final)
        setEditorNotes(data.review.editor_notes || '')
      } else if (data.suggestion) {
        setStrengthsFinal(data.suggestion.strengths)
        setWeaknessesFinal(data.suggestion.weaknesses)
        setActionPlanFinal(data.suggestion.action_plan)
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
        strengths_final: strengthsFinal,
        weaknesses_final: weaknessesFinal,
        action_plan_final: actionPlanFinal,
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
        strengths_final: strengthsFinal,
        weaknesses_final: weaknessesFinal,
        action_plan_final: actionPlanFinal,
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
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
          <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    )
  }

  if (!fileDetail) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">File not found</p>
        </div>
      </div>
    )
  }

  const isAnalyzing = fileDetail.jobs.some(j => j.type === 'ANALYZE' && j.status === 'RUNNING')
  const isRegeneratingPPT = fileDetail.jobs.some(j => j.type === 'REGENERATE' && j.status === 'RUNNING')
  const hasFailedJobs = fileDetail.jobs.some(j => j.status === 'FAILED')

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Review & Edit</h1>
            <p className="mt-2 text-sm text-gray-600">
              {fileDetail.original_filename}
              {fileDetail.company_name && ` · ${fileDetail.company_name}`}
            </p>
          </div>
          <button
            onClick={() => navigate('/files')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Files
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {isAnalyzing && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">Analyzing file... This may take a few minutes.</p>
          </div>
        )}

        {isRegeneratingPPT && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">Regenerating PPTX... Please wait.</p>
          </div>
        )}

        {hasFailedJobs && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-800">
              Some operations failed. Check the error details in the jobs section below.
            </p>
          </div>
        )}

        {fileDetail.review?.status === 'APPROVED' && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm text-green-800">This review has been approved.</p>
          </div>
        )}

        {!fileDetail.suggestion && !isAnalyzing && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 flex justify-between items-center">
            <p className="text-sm text-yellow-800">No AI suggestion available. Please analyze the file first.</p>
            <button
              onClick={handleRegenerateClick}
              disabled={regenerating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {regenerating ? 'Analyzing...' : 'Analyze Now'}
            </button>
          </div>
        )}

        {/* Review Editors */}
        {fileDetail.suggestion && (
          <div className="bg-white shadow rounded-lg p-6 space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Edit AI Summary</h2>
              <div className="space-y-6">
                <ReviewEditor
                  label="Strengths"
                  value={strengthsFinal}
                  onChange={setStrengthsFinal}
                  disabled={saving || approving}
                />
                
                <ReviewEditor
                  label="Weaknesses"
                  value={weaknessesFinal}
                  onChange={setWeaknessesFinal}
                  disabled={saving || approving}
                />
                
                <ReviewEditor
                  label="Action Plan (12 months)"
                  value={actionPlanFinal}
                  onChange={setActionPlanFinal}
                  disabled={saving || approving}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Editor Notes (Optional)
                  </label>
                  <textarea
                    value={editorNotes}
                    onChange={(e) => setEditorNotes(e.target.value)}
                    disabled={saving || approving}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                    placeholder="Add any notes or comments..."
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <button
                onClick={handleRegenerateClick}
                disabled={regenerating || isAnalyzing}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {regenerating ? 'Regenerating...' : 'Request New Suggestion'}
              </button>
              
              <div className="flex space-x-4">
                <button
                  onClick={handleSaveDraft}
                  disabled={saving || approving}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Draft'}
                </button>
                
                <button
                  onClick={handleApprove}
                  disabled={approving || saving || isRegeneratingPPT}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center"
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
        )}

        {/* Download Links */}
        {(fileDetail.download_url_original || fileDetail.download_url_regenerated || fileDetail.download_url_pdf) && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Downloads</h2>
            <div className="space-y-2">
              {fileDetail.download_url_original && (
                <a
                  href={fileDetail.download_url_original}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download Original PPTX
                </a>
              )}
              {fileDetail.download_url_regenerated && (
                <a
                  href={fileDetail.download_url_regenerated}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-green-600 hover:text-green-800 font-medium"
                >
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download Regenerated PPTX
                </a>
              )}
              {fileDetail.download_url_pdf && (
                <a
                  href={fileDetail.download_url_pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-600 hover:text-gray-800 text-sm"
                >
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download PDF (Debug - used for AI analysis)
                </a>
              )}
            </div>
          </div>
        )}

        {/* Jobs Status */}
        {fileDetail.jobs.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Job History</h2>
            <div className="space-y-2">
              {fileDetail.jobs.map((job) => (
                <div key={job.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{job.type}</span>
                    {job.error && (
                      <p className="text-xs text-red-600 mt-1">{job.error}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    job.status === 'SUCCEEDED' ? 'bg-green-100 text-green-800' :
                    job.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                    job.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {job.status}
                  </span>
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

