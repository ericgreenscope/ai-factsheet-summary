import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { listFiles, analyzeFile, getExportExcelUrl, FileRecord } from '../api'
import PromptModal from '../components/PromptModal'

const FileList: React.FC = () => {
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set())
  const [showPromptModal, setShowPromptModal] = useState(false)
  const [pendingFileId, setPendingFileId] = useState<string | null>(null)

  const fetchFiles = async () => {
    try {
      const data = await listFiles()
      setFiles(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch files')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()

    // Poll every 3 seconds
    const interval = setInterval(fetchFiles, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleAnalyzeClick = (fileId: string) => {
    setPendingFileId(fileId)
    setShowPromptModal(true)
  }

  const handlePromptConfirm = async (prompt: string) => {
    if (!pendingFileId) return

    setShowPromptModal(false)
    setAnalyzingIds(prev => new Set(prev).add(pendingFileId))
    try {
      await analyzeFile(pendingFileId, prompt)
      await fetchFiles()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setAnalyzingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(pendingFileId)
        return newSet
      })
      setPendingFileId(null)
    }
  }

  const handlePromptCancel = () => {
    setShowPromptModal(false)
    setPendingFileId(null)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
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
          <p className="text-neutral-600 font-medium">Loading your factsheets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-greenscope-50 via-white to-greenscope-100/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-gradient-greenscope rounded-full shadow-greenscope">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
              ESG Factsheets
            </h1>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Manage and review your uploaded factsheets with AI-powered insights
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={getExportExcelUrl()}
                className="btn-secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Export to Excel
              </a>
              <Link to="/upload" className="btn-primary">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                Upload New
              </Link>
            </div>
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

          {/* Empty State */}
          {files.length === 0 ? (
            <div className="card p-16 text-center animate-fade-in">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">No factsheets yet</h3>
              <p className="text-neutral-600 mb-8 max-w-md mx-auto">
                Start building your ESG insights library by uploading your first factsheet pair.
              </p>
              <Link to="/upload" className="btn-primary">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                Upload Your First Factsheet
              </Link>
            </div>
          ) : (
            /* Files Table */
            <div className="card overflow-hidden animate-fade-in">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                        Filename
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {files.map((file) => (
                      <tr key={file.id} className="hover:bg-neutral-50/50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-greenscope-100 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-greenscope-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="text-sm font-medium text-neutral-900 truncate max-w-xs">
                              {file.original_filename}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                          {file.company_name || <span className="text-neutral-400 italic">Not specified</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                          {formatDate(file.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {file.storage_path_regenerated ? (
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-success-500 rounded-full mr-2"></div>
                              <span className="px-2 py-1 bg-success-50 text-success-700 text-xs font-medium rounded-full">
                                Completed
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-warning-500 rounded-full mr-2 animate-pulse"></div>
                              <span className="px-2 py-1 bg-warning-50 text-warning-700 text-xs font-medium rounded-full">
                                Processing
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={() => handleAnalyzeClick(file.id)}
                              disabled={analyzingIds.has(file.id)}
                              className={`btn-ghost text-greenscope-600 hover:text-greenscope-700 hover:bg-greenscope-50 disabled:opacity-50 ${
                                analyzingIds.has(file.id) ? 'animate-pulse' : ''
                              }`}
                            >
                              {analyzingIds.has(file.id) ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                  Analyzing...
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Analyze
                                </>
                              )}
                            </button>
                            <Link
                              to={`/file/${file.id}`}
                              className="btn-ghost text-neutral-600 hover:text-neutral-700 hover:bg-neutral-50"
                            >
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                              Review
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <PromptModal
        isOpen={showPromptModal}
        onConfirm={handlePromptConfirm}
        onCancel={handlePromptCancel}
        isLoading={pendingFileId !== null && analyzingIds.has(pendingFileId)}
      />
    </div>
  )
}

export default FileList

