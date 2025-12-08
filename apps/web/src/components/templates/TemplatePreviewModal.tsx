'use client'

/**
 * Template Preview Modal Component
 * 模板预览模态框 - 显示完整的模板预览
 */

import { useState, useEffect } from 'react'
import { X, Download, ExternalLink, Loader2 } from 'lucide-react'
import type { ResumeTemplate } from '@careermatch/shared'

interface TemplatePreviewModalProps {
  template: ResumeTemplate | null
  isOpen: boolean
  onClose: () => void
  onSelect: (templateId: string) => void
  resumeId?: string // 如果提供，可以预览实际简历
}

export function TemplatePreviewModal({
  template,
  isOpen,
  onClose,
  onSelect,
  resumeId,
}: TemplatePreviewModalProps) {
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取HTML预览
  useEffect(() => {
    if (!isOpen || !template) {
      setPreviewHtml(null)
      return
    }

    async function fetchPreview() {
      if (!template) return

      try {
        setLoading(true)
        setError(null)

        const url = resumeId
          ? `/api/resumes/${resumeId}/export?format=html&template=${template.id}`
          : `/api/templates/${template.id}/preview`

        const res = await fetch(url)
        if (!res.ok) {
          throw new Error('Failed to load preview')
        }

        const html = await res.text()
        setPreviewHtml(html)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load preview')
      } finally {
        setLoading(false)
      }
    }

    fetchPreview()
  }, [isOpen, template, resumeId])

  if (!isOpen || !template) return null

  const config = template.config

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-4">
            {/* Color Preview */}
            <div className="flex h-8 w-16 rounded overflow-hidden shadow-sm">
              <div
                className="flex-1"
                style={{ backgroundColor: config.colors.primary }}
              />
              {config.colors.secondary && (
                <div
                  className="flex-1"
                  style={{ backgroundColor: config.colors.secondary }}
                />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {template.name}
              </h2>
              <p className="text-sm text-gray-500">{template.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Preview Content */}
        <div className="flex flex-col lg:flex-row">
          {/* Preview Iframe */}
          <div className="flex-1 bg-gray-100 p-4 min-h-[500px] max-h-[60vh] overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p>{error}</p>
                <p className="text-sm mt-2">
                  Preview will show when you have a resume to display.
                </p>
              </div>
            ) : previewHtml ? (
              <iframe
                srcDoc={previewHtml}
                className="w-full h-full min-h-[500px] bg-white rounded shadow"
                title="Resume Preview"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p>No preview available</p>
              </div>
            )}
          </div>

          {/* Template Info Sidebar */}
          <div className="lg:w-80 border-l bg-gray-50 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Template Details</h3>

            {/* Layout */}
            <div className="mb-4">
              <span className="text-sm font-medium text-gray-700">Layout</span>
              <p className="text-sm text-gray-500 capitalize">{config.layout}</p>
            </div>

            {/* Colors */}
            <div className="mb-4">
              <span className="text-sm font-medium text-gray-700 block mb-2">
                Colors
              </span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(config.colors).map(([name, color]) => (
                  <div key={name} className="flex items-center gap-1">
                    <div
                      className="h-4 w-4 rounded border border-gray-200"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs text-gray-500 capitalize">
                      {name.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fonts */}
            <div className="mb-4">
              <span className="text-sm font-medium text-gray-700 block mb-2">
                Fonts
              </span>
              <div className="text-sm text-gray-500 space-y-1">
                <p>Heading: {config.fonts.heading}</p>
                <p>Body: {config.fonts.body}</p>
                <p>Sizes: {config.fonts.headingSize}pt / {config.fonts.bodySize}pt</p>
              </div>
            </div>

            {/* Section Order */}
            <div className="mb-6">
              <span className="text-sm font-medium text-gray-700 block mb-2">
                Section Order
              </span>
              <ol className="text-sm text-gray-500 list-decimal list-inside space-y-1">
                {config.sections_order.map((section) => (
                  <li key={section} className="capitalize">
                    {section.replace(/_/g, ' ')}
                  </li>
                ))}
              </ol>
            </div>

            {/* Supported Formats */}
            <div className="mb-6">
              <span className="text-sm font-medium text-gray-700 block mb-2">
                Export Formats
              </span>
              <div className="flex gap-2">
                {template.supportsPdf && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                    PDF
                  </span>
                )}
                {template.supportsHtml && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    HTML
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  onSelect(template.id)
                  onClose()
                }}
                className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Use This Template
              </button>

              {resumeId && previewHtml && (
                <>
                  <a
                    href={`/api/resumes/${resumeId}/export?format=pdf&template=${template.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </a>
                  <a
                    href={`/api/resumes/${resumeId}/export?format=html&template=${template.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open HTML
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TemplatePreviewModal
