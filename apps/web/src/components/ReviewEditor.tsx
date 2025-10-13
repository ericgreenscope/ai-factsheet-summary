import React from 'react'

interface ReviewEditorProps {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

const ReviewEditor: React.FC<ReviewEditorProps> = ({ label, value, onChange, disabled = false }) => {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0
  const lineCount = value.split('\n').filter(line => line.trim()).length

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="text-xs text-gray-500">
          {lineCount} lines · {wordCount} words
        </div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={10}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 font-mono text-sm"
        placeholder="Enter bullets here, one per line..."
      />
      <p className="text-xs text-gray-500">
        Tip: Keep bullets concise (≤22 words). Use "- " prefix for bullets.
      </p>
    </div>
  )
}

export default ReviewEditor

