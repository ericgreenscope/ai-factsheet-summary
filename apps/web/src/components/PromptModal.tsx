import React, { useState } from 'react'
import { PROMPT_TEMPLATES, getDefaultPrompt } from '../prompts'

interface PromptModalProps {
  isOpen: boolean
  onConfirm: (prompt: string) => void
  onCancel: () => void
  isLoading?: boolean
}

const PromptModal: React.FC<PromptModalProps> = ({ isOpen, onConfirm, onCancel, isLoading = false }) => {
  const defaultTemplate = getDefaultPrompt()
  const [selectedId, setSelectedId] = useState(defaultTemplate.id)
  const [editedText, setEditedText] = useState(defaultTemplate.text)

  const handleTemplateChange = (templateId: string) => {
    const template = PROMPT_TEMPLATES.find(p => p.id === templateId)
    if (template) {
      setSelectedId(templateId)
      setEditedText(template.text)
    }
  }

  const handleConfirm = () => {
    onConfirm(editedText)
    setSelectedId(defaultTemplate.id)
    setEditedText(defaultTemplate.text)
  }

  const handleCancel = () => {
    onCancel()
    setSelectedId(defaultTemplate.id)
    setEditedText(defaultTemplate.text)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between border-b">
          <h2 className="text-xl font-bold text-white">Select Analysis Prompt</h2>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="text-white hover:text-gray-200 disabled:opacity-50 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Choose a Prompt Template
            </label>
            <div className="grid grid-cols-1 gap-2">
              {PROMPT_TEMPLATES.map(template => (
                <label
                  key={template.id}
                  className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition ${
                    selectedId === template.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="template"
                    value={template.id}
                    checked={selectedId === template.id}
                    onChange={() => handleTemplateChange(template.id)}
                    disabled={isLoading}
                    className="mr-3"
                  />
                  <span className="font-medium text-gray-900">{template.title}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Prompt Editor */}
          <div>
            <label htmlFor="prompt-text" className="block text-sm font-semibold text-gray-700 mb-2">
              Edit Prompt (Optional)
            </label>
            <textarea
              id="prompt-text"
              value={editedText}
              onChange={e => setEditedText(e.target.value)}
              disabled={isLoading}
              rows={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="Prompt text will appear here..."
            />
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <p>
              <strong>Tip:</strong> You can edit the prompt text before analysis. The edited text will be sent to the AI model.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !editedText.trim()}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PromptModal
