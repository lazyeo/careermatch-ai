'use client'

/**
 * Template Gallery Component
 * 模板画廊组件 - 显示所有可用模板供用户选择
 */

import { useState, useEffect } from 'react'
import { Check, Sparkles, Building2, Palette, FileText } from 'lucide-react'
import type { ResumeTemplate } from '@careermatch/shared'

interface TemplateGalleryProps {
  onSelect: (templateId: string) => void
  selectedId?: string
  className?: string
}

// 模板分类图标映射
const categoryIcons: Record<string, React.ReactNode> = {
  modern: <Sparkles className="h-4 w-4" />,
  classic: <FileText className="h-4 w-4" />,
  creative: <Palette className="h-4 w-4" />,
  industry: <Building2 className="h-4 w-4" />,
}

// 模板分类标签
const categoryLabels: Record<string, string> = {
  modern: 'Modern',
  classic: 'Classic',
  creative: 'Creative',
  industry: 'Industry',
}

// 模板预览颜色条 - 用于视觉区分
function TemplateColorBar({ colors }: { colors: { primary: string; secondary?: string } }) {
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-t-lg">
      <div
        className="flex-1"
        style={{ backgroundColor: colors.primary }}
      />
      {colors.secondary && (
        <div
          className="flex-1"
          style={{ backgroundColor: colors.secondary }}
        />
      )}
    </div>
  )
}

// 模板卡片组件
function TemplateCard({
  template,
  selected,
  onClick,
}: {
  template: ResumeTemplate
  selected: boolean
  onClick: () => void
}) {
  const config = template.config

  return (
    <div
      onClick={onClick}
      className={`
        relative cursor-pointer rounded-lg border-2 transition-all duration-200
        ${selected
          ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
        }
      `}
    >
      {/* Color Preview Bar */}
      <TemplateColorBar
        colors={{
          primary: config.colors.primary,
          secondary: config.colors.secondary,
        }}
      />

      {/* Template Preview Mock */}
      <div className="p-4 bg-white rounded-b-lg">
        {/* Mock Resume Layout */}
        <div
          className={`
            w-full h-32 rounded border border-gray-100 overflow-hidden
            ${config.layout === 'two-column' ? 'flex' : ''}
          `}
        >
          {config.layout === 'two-column' ? (
            <>
              {/* Sidebar Mock */}
              <div
                className="w-1/3 p-2"
                style={{ backgroundColor: config.colors.secondary || config.colors.primary }}
              >
                <div className="h-2 w-3/4 bg-white/80 rounded mb-2" />
                <div className="h-1 w-full bg-white/60 rounded mb-1" />
                <div className="h-1 w-2/3 bg-white/60 rounded mb-3" />
                <div className="h-1 w-full bg-white/40 rounded mb-1" />
                <div className="h-1 w-1/2 bg-white/40 rounded" />
              </div>
              {/* Main Content Mock */}
              <div className="flex-1 p-2 bg-gray-50">
                <div
                  className="h-2 w-2/3 rounded mb-2"
                  style={{ backgroundColor: config.colors.primary }}
                />
                <div className="h-1 w-full bg-gray-300 rounded mb-1" />
                <div className="h-1 w-5/6 bg-gray-300 rounded mb-3" />
                <div className="h-1 w-full bg-gray-200 rounded mb-1" />
                <div className="h-1 w-3/4 bg-gray-200 rounded" />
              </div>
            </>
          ) : (
            /* Single Column Mock */
            <div className="p-2 bg-gray-50 h-full">
              <div
                className="h-2 w-1/2 rounded mb-2"
                style={{ backgroundColor: config.colors.primary }}
              />
              <div className="h-1 w-2/3 bg-gray-300 rounded mb-3" />
              <div
                className="h-1 w-1/4 rounded mb-1"
                style={{ backgroundColor: config.colors.primary, opacity: 0.7 }}
              />
              <div className="h-1 w-full bg-gray-200 rounded mb-1" />
              <div className="h-1 w-5/6 bg-gray-200 rounded mb-3" />
              <div
                className="h-1 w-1/3 rounded mb-1"
                style={{ backgroundColor: config.colors.primary, opacity: 0.7 }}
              />
              <div className="h-1 w-full bg-gray-200 rounded mb-1" />
              <div className="h-1 w-4/5 bg-gray-200 rounded" />
            </div>
          )}
        </div>

        {/* Template Info */}
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 text-sm">{template.name}</h3>
            <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {categoryIcons[template.category]}
              {categoryLabels[template.category]}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {template.description}
          </p>
        </div>

        {/* Selected Indicator */}
        {selected && (
          <div className="absolute top-3 right-3 bg-blue-500 text-white p-1 rounded-full">
            <Check className="h-3 w-3" />
          </div>
        )}
      </div>
    </div>
  )
}

// 分类筛选器
function CategoryFilter({
  categories,
  selected,
  onSelect,
}: {
  categories: string[]
  selected: string | null
  onSelect: (category: string | null) => void
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <button
        onClick={() => onSelect(null)}
        className={`
          px-3 py-1.5 text-sm rounded-full transition-colors
          ${selected === null
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }
        `}
      >
        All Templates
      </button>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full transition-colors
            ${selected === category
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
          `}
        >
          {categoryIcons[category]}
          {categoryLabels[category]}
        </button>
      ))}
    </div>
  )
}

export function TemplateGallery({
  onSelect,
  selectedId = 'modern-blue',
  className = '',
}: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<ResumeTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  // 获取模板列表
  useEffect(() => {
    async function fetchTemplates() {
      try {
        setLoading(true)
        const res = await fetch('/api/templates')
        if (!res.ok) {
          throw new Error('Failed to fetch templates')
        }
        const data = await res.json()
        setTemplates(data.templates || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load templates')
      } finally {
        setLoading(false)
      }
    }
    fetchTemplates()
  }, [])

  // 获取所有分类
  const categories = Array.from(new Set(templates.map((t) => t.category)))

  // 过滤模板
  const filteredTemplates = categoryFilter
    ? templates.filter((t) => t.category === categoryFilter)
    : templates

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-8 text-red-500">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-blue-500 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Category Filter */}
      <CategoryFilter
        categories={categories}
        selected={categoryFilter}
        onSelect={setCategoryFilter}
      />

      {/* Templates Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            selected={selectedId === template.id}
            onClick={() => onSelect(template.id)}
          />
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No templates found in this category.
        </div>
      )}
    </div>
  )
}

export default TemplateGallery
