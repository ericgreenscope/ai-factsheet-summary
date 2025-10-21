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

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ESG Factsheets</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage and review your uploaded factsheets
            </p>
          </div>
          <div className="flex space-x-4">
            <a
              href={getExportExcelUrl()}
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
              target="_blank"
              rel="noopener noreferrer"
            >
              Export to Excel
            </a>
            <Link
              to="/upload"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Upload New
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {files.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No files</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by uploading a factsheet.</p>
            <div className="mt-6">
              <Link
                to="/upload"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Upload Factsheet
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Filename
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {files.map((file) => (
                  <tr key={file.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {file.original_filename}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {file.company_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(file.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {file.storage_path_regenerated ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Completed
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleAnalyzeClick(file.id)}
                        disabled={analyzingIds.has(file.id)}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                      >
                        {analyzingIds.has(file.id) ? 'Analyzing...' : 'Analyze'}
                      </button>
                      <Link
                        to={`/file/${file.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

