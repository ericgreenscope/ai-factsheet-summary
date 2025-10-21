import React, { useState, useRef } from 'react'

interface FilePair {
  name: string
  pptxFile?: File
  pdfFile?: File
  isComplete: boolean
}

interface DualUploaderProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
}

const DualUploader: React.FC<DualUploaderProps> = ({ onFilesSelected, disabled = false }) => {
  const [filePairs, setFilePairs] = useState<FilePair[]>([])
  const [isDragging, setIsDragging] = useState<'pptx' | 'pdf' | null>(null)
  const pptxInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  const getBasename = (filename: string, extension: string): string => {
    return filename.slice(0, -extension.length)
  }

  const updateFilePairs = (newFiles: File[], type: 'pptx' | 'pdf') => {
    setFilePairs(prevPairs => {
      const updatedPairs = [...prevPairs]
      const extension = type === 'pptx' ? '.pptx' : '.pdf'

      newFiles.forEach(file => {
        const basename = getBasename(file.name, extension)
        const existingPairIndex = updatedPairs.findIndex(pair => pair.name === basename)

        if (existingPairIndex >= 0) {
          // Update existing pair
          updatedPairs[existingPairIndex] = {
            ...updatedPairs[existingPairIndex],
            [type === 'pptx' ? 'pptxFile' : 'pdfFile']: file,
            isComplete: !!(updatedPairs[existingPairIndex].pptxFile) && !!(type === 'pptx' ? updatedPairs[existingPairIndex].pdfFile : file)
          }
        } else {
          // Create new pair
          updatedPairs.push({
            name: basename,
            [type === 'pptx' ? 'pptxFile' : 'pdfFile']: file,
            isComplete: false
          })
        }
      })

      return updatedPairs.sort((a, b) => a.name.localeCompare(b.name))
    })
  }

  const handleDragEnter = (e: React.DragEvent, type: 'pptx' | 'pdf') => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(type)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent, type: 'pptx' | 'pdf') => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(null)

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.name.endsWith(type === 'pptx' ? '.pptx' : '.pdf')
    )

    if (files.length > 0) {
      updateFilePairs(files, type)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'pptx' | 'pdf') => {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (files.length > 0) {
      updateFilePairs(files, type)
    }
  }

  const handleClick = (type: 'pptx' | 'pdf') => {
    if (disabled) return
    if (type === 'pptx') {
      pptxInputRef.current?.click()
    } else {
      pdfInputRef.current?.click()
    }
  }

  const removeFile = (pairIndex: number, type: 'pptx' | 'pdf') => {
    setFilePairs(prevPairs => {
      const updatedPairs = [...prevPairs]
      updatedPairs[pairIndex] = {
        ...updatedPairs[pairIndex],
        [type === 'pptx' ? 'pptxFile' : 'pdfFile']: undefined,
        isComplete: false
      }
      return updatedPairs.filter(pair => pair.pptxFile || pair.pdfFile)
    })
  }

  const getAllFiles = (): File[] => {
    const files: File[] = []
    filePairs.forEach(pair => {
      if (pair.pptxFile) files.push(pair.pptxFile)
      if (pair.pdfFile) files.push(pair.pdfFile)
    })
    return files
  }

  // Notify parent component when files change
  React.useEffect(() => {
    const allFiles = getAllFiles()
    onFilesSelected(allFiles)
  }, [filePairs])

  const completePairs = filePairs.filter(pair => pair.isComplete)
  const incompletePairs = filePairs.filter(pair => !pair.isComplete)

  return (
    <div className={`space-y-6 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Upload Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PPTX Column */}
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-700 flex items-center">
              <div className="w-3 h-3 bg-greenscope-500 rounded mr-3"></div>
              PPTX Files
            </h3>
            <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded-full">
              For AI summaries
            </span>
          </div>
          <div
            className={`
              upload-zone transition-all duration-300 group
              ${isDragging === 'pptx' ? 'drag-active scale-105' : ''}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-102'}
            `}
            onDragEnter={(e) => handleDragEnter(e, 'pptx')}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'pptx')}
            onClick={() => handleClick('pptx')}
          >
            <input
              ref={pptxInputRef}
              type="file"
              multiple
              accept=".pptx"
              onChange={(e) => handleFileSelect(e, 'pptx')}
              className="hidden"
              disabled={disabled}
            />
            <div className="space-y-4">
              <div className="relative">
                <svg
                  className={`mx-auto h-12 w-12 transition-all duration-300 group-hover:scale-110 ${
                    isDragging === 'pptx' ? 'text-greenscope-500' : 'text-neutral-400'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" clipRule="evenodd" />
                </svg>
                {isDragging === 'pptx' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-greenscope-500 rounded-full flex items-center justify-center animate-bounce-soft">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="text-sm text-neutral-600">
                  <span className={`font-semibold transition-colors duration-200 ${
                    isDragging === 'pptx' ? 'text-greenscope-600' : 'text-greenscope-600 group-hover:text-greenscope-700'
                  }`}>
                    {isDragging === 'pptx' ? 'Drop PPTX files here' : 'Click to upload PPTX'}
                  </span>
                  <span className="text-neutral-400">
                    {isDragging === 'pptx' ? '' : ' or drag and drop'}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 bg-neutral-50 px-2 py-1 rounded inline-block">
                  PowerPoint files (.pptx)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PDF Column */}
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-700 flex items-center">
              <div className="w-3 h-3 bg-greenscope-600 rounded mr-3"></div>
              PDF Files
            </h3>
            <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded-full">
              For AI analysis
            </span>
          </div>
          <div
            className={`
              upload-zone transition-all duration-300 group
              ${isDragging === 'pdf' ? 'drag-active scale-105' : ''}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-102'}
            `}
            onDragEnter={(e) => handleDragEnter(e, 'pdf')}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'pdf')}
            onClick={() => handleClick('pdf')}
          >
            <input
              ref={pdfInputRef}
              type="file"
              multiple
              accept=".pdf"
              onChange={(e) => handleFileSelect(e, 'pdf')}
              className="hidden"
              disabled={disabled}
            />
            <div className="space-y-4">
              <div className="relative">
                <svg
                  className={`mx-auto h-12 w-12 transition-all duration-300 group-hover:scale-110 ${
                    isDragging === 'pdf' ? 'text-greenscope-600' : 'text-neutral-400'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" clipRule="evenodd" />
                </svg>
                {isDragging === 'pdf' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-greenscope-600 rounded-full flex items-center justify-center animate-bounce-soft">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="text-sm text-neutral-600">
                  <span className={`font-semibold transition-colors duration-200 ${
                    isDragging === 'pdf' ? 'text-greenscope-700' : 'text-greenscope-700 group-hover:text-greenscope-800'
                  }`}>
                    {isDragging === 'pdf' ? 'Drop PDF files here' : 'Click to upload PDF'}
                  </span>
                  <span className="text-neutral-400">
                    {isDragging === 'pdf' ? '' : ' or drag and drop'}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 bg-neutral-50 px-2 py-1 rounded inline-block">
                  PDF files (.pdf)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* File Pairs Display */}
      {filePairs.length > 0 && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-neutral-900">
                File Pairs
              </h3>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                  <span className="text-neutral-600">{completePairs.length} Complete</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-warning-500 rounded-full"></div>
                  <span className="text-neutral-600">{incompletePairs.length} Incomplete</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {filePairs.map((pair, index) => (
              <div
                key={pair.name}
                className={`
                  card p-6 transition-all duration-300 hover:shadow-large
                  ${pair.isComplete
                    ? 'ring-2 ring-success-200 bg-success-50/50'
                    : 'ring-2 ring-warning-200 bg-warning-50/50'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`w-3 h-3 rounded-full ${pair.isComplete ? 'bg-success-500' : 'bg-warning-500'}`}></div>
                      <h4 className="text-base font-semibold text-neutral-900 truncate">
                        {pair.name}
                      </h4>
                      {pair.isComplete && (
                        <div className="px-2 py-1 bg-success-100 text-success-800 text-xs font-medium rounded-full animate-fade-in">
                          Ready for Upload
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* PPTX File */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className={`p-2 rounded-lg ${pair.pptxFile ? 'bg-greenscope-100' : 'bg-neutral-100'}`}>
                              <svg className={`w-4 h-4 ${pair.pptxFile ? 'text-greenscope-600' : 'text-neutral-400'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              {pair.pptxFile ? (
                                <div>
                                  <p className="text-sm font-medium text-neutral-900 truncate">
                                    {pair.pptxFile.name}
                                  </p>
                                  <p className="text-xs text-neutral-500">
                                    {(pair.pptxFile.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              ) : (
                                <p className="text-sm text-neutral-400 italic">No PPTX file uploaded</p>
                              )}
                            </div>
                          </div>
                          {pair.pptxFile && (
                            <button
                              onClick={() => removeFile(index, 'pptx')}
                              className="btn-ghost text-error-600 hover:text-error-700 hover:bg-error-50 p-2"
                              title="Remove PPTX file"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* PDF File */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className={`p-2 rounded-lg ${pair.pdfFile ? 'bg-greenscope-100' : 'bg-neutral-100'}`}>
                              <svg className={`w-4 h-4 ${pair.pdfFile ? 'text-greenscope-600' : 'text-neutral-400'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              {pair.pdfFile ? (
                                <div>
                                  <p className="text-sm font-medium text-neutral-900 truncate">
                                    {pair.pdfFile.name}
                                  </p>
                                  <p className="text-xs text-neutral-500">
                                    {(pair.pdfFile.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              ) : (
                                <p className="text-sm text-neutral-400 italic">No PDF file uploaded</p>
                              )}
                            </div>
                          </div>
                          {pair.pdfFile && (
                            <button
                              onClick={() => removeFile(index, 'pdf')}
                              className="btn-ghost text-error-600 hover:text-error-700 hover:bg-error-50 p-2"
                              title="Remove PDF file"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Icon */}
                  <div className="ml-6 flex-shrink-0">
                    {pair.isComplete ? (
                      <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center animate-fade-in">
                        <svg className="w-5 h-5 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-warning-100 rounded-full flex items-center justify-center animate-fade-in">
                        <svg className="w-5 h-5 text-warning-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DualUploader