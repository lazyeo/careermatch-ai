'use client'

/**
 * Template Customizer Component
 * 模板样式定制器 - 允许用户自定义模板样式
 */

import { useState, useEffect } from 'react'
import {
  Palette,
  Type,
  LayoutGrid,
  GripVertical,
  Save,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import type { ResumeTemplate, TemplateConfig, ResumeSectionType } from '@careermatch/shared'

interface TemplateCustomizerProps {
  baseTemplate: ResumeTemplate
  onSave: (name: string, config: TemplateConfig) => Promise<void>
  previewResumeId?: string
  className?: string
}

// 可用的章节列表
const AVAILABLE_SECTIONS: { key: ResumeSectionType; label: string }[] = [
  { key: 'header', label: 'Header' },
  { key: 'summary', label: 'Summary' },
  { key: 'skills', label: 'Skills' },
  { key: 'experience', label: 'Experience' },
  { key: 'projects', label: 'Projects' },
  { key: 'education', label: 'Education' },
  { key: 'certifications', label: 'Certifications' },
]

// 颜色选择器组件
function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (color: string) => void
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <label className="text-sm text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-14 cursor-pointer rounded border border-gray-300"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 px-2 py-1 text-xs border border-gray-300 rounded font-mono"
        />
      </div>
    </div>
  )
}

// 字体选择器组件
function FontSelector({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (font: string) => void
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <label className="text-sm text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {options.map((font) => (
          <option key={font} value={font}>
            {font}
          </option>
        ))}
      </select>
    </div>
  )
}

// 数字输入组件
function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <label className="text-sm text-gray-700">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {suffix && <span className="text-xs text-gray-500">{suffix}</span>}
      </div>
    </div>
  )
}

// 章节顺序编辑器
function SectionOrderEditor({
  sections,
  onReorder,
}: {
  sections: ResumeSectionType[]
  onReorder: (sections: ResumeSectionType[]) => void
}) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)

  const handleDragStart = (index: number) => {
    setDraggingIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggingIndex === null || draggingIndex === index) return

    const newSections = [...sections]
    const [removed] = newSections.splice(draggingIndex, 1)
    newSections.splice(index, 0, removed)
    setDraggingIndex(index)
    onReorder(newSections)
  }

  const handleDragEnd = () => {
    setDraggingIndex(null)
  }

  const getSectionLabel = (key: ResumeSectionType) => {
    return AVAILABLE_SECTIONS.find((s) => s.key === key)?.label || key
  }

  return (
    <div className="space-y-1">
      {sections.map((section, index) => (
        <div
          key={section}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          className={`
            flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200
            cursor-move hover:bg-gray-100 transition-colors
            ${draggingIndex === index ? 'opacity-50 bg-blue-50 border-blue-300' : ''}
          `}
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700 flex-1 capitalize">
            {getSectionLabel(section)}
          </span>
          <span className="text-xs text-gray-400">{index + 1}</span>
        </div>
      ))}
    </div>
  )
}

export function TemplateCustomizer({
  baseTemplate,
  onSave,
  previewResumeId,
  className = '',
}: TemplateCustomizerProps) {
  const [config, setConfig] = useState<TemplateConfig>(baseTemplate.config)
  const [customName, setCustomName] = useState(`${baseTemplate.name} (Custom)`)
  const [saving, setSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // 可用字体列表
  const fontOptions = [
    'Helvetica',
    'Helvetica-Bold',
    'Times-Roman',
    'Times-Bold',
    'Courier',
    'Courier-Bold',
  ]

  // 布局选项
  const layoutOptions = [
    { value: 'single-column', label: 'Single Column' },
    { value: 'two-column', label: 'Two Column' },
  ]

  // 重置为基础模板
  const handleReset = () => {
    setConfig(baseTemplate.config)
    setCustomName(`${baseTemplate.name} (Custom)`)
  }

  // 保存自定义模板
  const handleSave = async () => {
    try {
      setSaving(true)
      await onSave(customName, config)
    } finally {
      setSaving(false)
    }
  }

  // 更新颜色
  const updateColor = (key: keyof TemplateConfig['colors'], value: string) => {
    setConfig((prev) => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }))
  }

  // 更新字体
  const updateFont = (key: keyof TemplateConfig['fonts'], value: string | number) => {
    setConfig((prev) => ({
      ...prev,
      fonts: { ...prev.fonts, [key]: value },
    }))
  }

  // 更新间距
  const updateSpacing = (key: keyof TemplateConfig['spacing'], value: number) => {
    setConfig((prev) => ({
      ...prev,
      spacing: { ...prev.spacing, [key]: value },
    }))
  }

  // 更新布局
  const updateLayout = (layout: 'single-column' | 'two-column') => {
    setConfig((prev) => ({ ...prev, layout }))
  }

  // 更新章节顺序
  const updateSectionsOrder = (sections: ResumeSectionType[]) => {
    setConfig((prev) => ({ ...prev, sections_order: sections }))
  }

  // 生成预览URL
  useEffect(() => {
    if (previewResumeId) {
      const url = `/api/resumes/${previewResumeId}/export?format=html&template=${baseTemplate.id}`
      setPreviewUrl(url)
    } else {
      setPreviewUrl(`/api/templates/${baseTemplate.id}/preview`)
    }
  }, [baseTemplate.id, previewResumeId])

  return (
    <div className={`${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Configuration Panel */}
        <div className="space-y-6">
          {/* Template Name */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Template Name</h3>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="My Custom Template"
            />
          </div>

          {/* Colors */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Colors
            </h3>
            <div className="space-y-1">
              <ColorPicker
                label="Primary"
                value={config.colors.primary}
                onChange={(v) => updateColor('primary', v)}
              />
              <ColorPicker
                label="Secondary"
                value={config.colors.secondary || config.colors.primary}
                onChange={(v) => updateColor('secondary', v)}
              />
              <ColorPicker
                label="Text"
                value={config.colors.text}
                onChange={(v) => updateColor('text', v)}
              />
              <ColorPicker
                label="Text Light"
                value={config.colors.textLight}
                onChange={(v) => updateColor('textLight', v)}
              />
              <ColorPicker
                label="Background"
                value={config.colors.background}
                onChange={(v) => updateColor('background', v)}
              />
              <ColorPicker
                label="Accent"
                value={config.colors.accent}
                onChange={(v) => updateColor('accent', v)}
              />
            </div>
          </div>

          {/* Typography */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Type className="h-4 w-4" />
              Typography
            </h3>
            <div className="space-y-1">
              <FontSelector
                label="Heading Font"
                value={config.fonts.heading}
                options={fontOptions}
                onChange={(v) => updateFont('heading', v)}
              />
              <FontSelector
                label="Body Font"
                value={config.fonts.body}
                options={fontOptions}
                onChange={(v) => updateFont('body', v)}
              />
              <NumberInput
                label="Heading Size"
                value={config.fonts.headingSize}
                onChange={(v) => updateFont('headingSize', v)}
                min={10}
                max={24}
                step={1}
                suffix="pt"
              />
              <NumberInput
                label="Body Size"
                value={config.fonts.bodySize}
                onChange={(v) => updateFont('bodySize', v)}
                min={8}
                max={14}
                step={1}
                suffix="pt"
              />
            </div>
          </div>

          {/* Layout */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Layout
            </h3>
            <div className="space-y-4">
              {/* Layout Type */}
              <div>
                <label className="text-sm text-gray-700 block mb-2">
                  Layout Type
                </label>
                <div className="flex gap-2">
                  {layoutOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        updateLayout(option.value as 'single-column' | 'two-column')
                      }
                      className={`
                        flex-1 px-3 py-2 text-sm rounded-lg border transition-colors
                        ${
                          config.layout === option.value
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spacing */}
              <div className="pt-2 border-t border-gray-100">
                <NumberInput
                  label="Section Gap"
                  value={config.spacing.sectionGap}
                  onChange={(v) => updateSpacing('sectionGap', v)}
                  min={8}
                  max={30}
                  step={1}
                  suffix="px"
                />
                <NumberInput
                  label="Item Gap"
                  value={config.spacing.itemGap}
                  onChange={(v) => updateSpacing('itemGap', v)}
                  min={4}
                  max={20}
                  step={1}
                  suffix="px"
                />
                <NumberInput
                  label="Line Height"
                  value={config.spacing.lineHeight}
                  onChange={(v) => updateSpacing('lineHeight', v)}
                  min={1}
                  max={2}
                  step={0.1}
                />
              </div>
            </div>
          </div>

          {/* Section Order */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Section Order
              <span className="font-normal text-sm text-gray-500 ml-2">
                (drag to reorder)
              </span>
            </h3>
            <SectionOrderEditor
              sections={config.sections_order}
              onReorder={updateSectionsOrder}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Custom Template
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="bg-gray-100 rounded-lg p-4 min-h-[600px]">
          <h3 className="font-semibold text-gray-900 mb-3">Preview</h3>
          {previewUrl ? (
            <iframe
              src={previewUrl}
              className="w-full h-[calc(100%-2rem)] bg-white rounded shadow"
              title="Template Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Preview not available</p>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2 text-center">
            Note: Some changes may require saving to see in preview
          </p>
        </div>
      </div>
    </div>
  )
}

export default TemplateCustomizer
