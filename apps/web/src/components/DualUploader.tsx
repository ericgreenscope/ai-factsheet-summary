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
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" clipRule="evenodd" />
            </svg>
            PPTX Files (for output generation)
          </h3>
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${isDragging === 'pptx' ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-gray-400'}
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
            <div className="space-y-2">
              <svg
                className="mx-auto h-10 w-10 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-gray-600">
                <span className="font-medium text-orange-600 hover:text-orange-500">
                  Click to upload PPTX
                </span>
                {' or drag and drop'}
              </div>
              <p className="text-xs text-gray-500">PowerPoint files (.pptx)</p>
            </div>
          </div>
        </div>

        {/* PDF Column */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" clipRule="evenodd" />
            </svg>
            PDF Files (for AI analysis)
          </h3>
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${isDragging === 'pdf' ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'}
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
            <div className="space-y-2">
              <svg
                className="mx-auto h-10 w-10 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-gray-600">
                <span className="font-medium text-red-600 hover:text-red-500">
                  Click to upload PDF
                </span>
                {' or drag and drop'}
              </div>
              <p className="text-xs text-gray-500">PDF files (.pdf)</p>
            </div>
          </div>
        </div>
      </div>

      {/* File Pairs Display */}
      {filePairs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              File Pairs ({completePairs.length} complete, {incompletePairs.length} incomplete)
            </h3>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded mr-1"></div>
                <span className="text-gray-600">Complete Pair</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded mr-1"></div>
                <span className="text-gray-600">Incomplete Pair</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {filePairs.map((pair, index) => (
              <div
                key={pair.name}
                className={`
                  border rounded-lg p-4 transition-colors
                  ${pair.isComplete
                    ? 'border-green-200 bg-green-50'
                    : 'border-yellow-200 bg-yellow-50'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">{pair.name}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* PPTX File */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {pair.pptxFile ? (
                            <>
                              <svg className="w-4 h-4 text-orange-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm text-gray-700">{pair.pptxFile.name}</span>
                              <span className="ml-2 text-xs text-gray-500">
                                ({(pair.pptxFile.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="w-4 h-4 border-2 border-dashed border-gray-300 rounded mr-2"></div>
                              <span className="text-sm text-gray-400 italic">No PPTX file</span>
                            </>
                          )}
                        </div>
                        {pair.pptxFile && (
                          <button
                            onClick={() => removeFile(index, 'pptx')}
                            className="text-red-600 hover:text-red-800 text-xs font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      {/* PDF File */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {pair.pdfFile ? (
                            <>
                              <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-5L9 2H4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm text-gray-700">{pair.pdfFile.name}</span>
                              <span className="ml-2 text-xs text-gray-500">
                                ({(pair.pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="w-4 h-4 border-2 border-dashed border-gray-300 rounded mr-2"></div>
                              <span className="text-sm text-gray-400 italic">No PDF file</span>
                            </>
                          )}
                        </div>
                        {pair.pdfFile && (
                          <button
                            onClick={() => removeFile(index, 'pdf')}
                            className="text-red-600 hover:text-red-800 text-xs font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    {pair.isComplete ? (
                      <div className="flex items-center text-green-600">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="flex items-center text-yellow-600">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
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