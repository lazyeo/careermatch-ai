'use client'

import { useState, useEffect } from 'react'
import { Button } from '@careermatch/ui'
import {
  X,
  Check,
  Sparkles,
  FileText,
  Palette,
  Building2,
  Loader2,
  Eye,
  ChevronRight,
} from 'lucide-react'
import type { TemplateRecommendation } from '@/lib/ai/template-recommender'

// 模板信息（与template-recommender.ts保持同步）
interface TemplateInfo {
  id: string
  name: string
  description: string
  bestFor: string[]
  layout: 'single-column' | 'two-column'
  style: 'modern' | 'classic' | 'creative' | 'professional'
  colors: {
    primary: string
    secondary?: string
  }
}

// 预定义模板数据
const TEMPLATES: TemplateInfo[] = [
  {
    id: 'modern-blue',
    name: 'Modern Blue',
    description: '现代简约风格，适合大多数职位',
    bestFor: ['产品经理', '市场', '综合岗位'],
    layout: 'single-column',
    style: 'modern',
    colors: { primary: '#3B82F6', secondary: '#60A5FA' },
  },
  {
    id: 'classic-serif',
    name: 'Classic Serif',
    description: '传统正式风格，适合正式行业',
    bestFor: ['金融', '法律', '咨询', '政府'],
    layout: 'single-column',
    style: 'classic',
    colors: { primary: '#1F2937', secondary: '#6B7280' },
  },
  {
    id: 'creative-gradient',
    name: 'Creative Gradient',
    description: '创意渐变风格，适合创意岗位',
    bestFor: ['设计师', '创意总监', '品牌'],
    layout: 'two-column',
    style: 'creative',
    colors: { primary: '#8B5CF6', secondary: '#EC4899' },
  },
  {
    id: 'executive-minimal',
    name: 'Executive Minimal',
    description: '极简高管风格，大量留白',
    bestFor: ['高管', '总监', '副总裁'],
    layout: 'single-column',
    style: 'professional',
    colors: { primary: '#0F172A', secondary: '#334155' },
  },
  {
    id: 'tech-engineer',
    name: 'Tech Engineer',
    description: '技术工程师专用模板',
    bestFor: ['软件工程师', '后端开发', '架构师'],
    layout: 'single-column',
    style: 'modern',
    colors: { primary: '#059669', secondary: '#10B981' },
  },
  {
    id: 'finance-analyst',
    name: 'Finance Analyst',
    description: '金融分析师专用模板',
    bestFor: ['金融分析师', '投资', '会计'],
    layout: 'single-column',
    style: 'professional',
    colors: { primary: '#0369A1', secondary: '#0284C7' },
  },
  {
    id: 'creative-designer',
    name: 'Creative Designer',
    description: '创意设计师专用模板',
    bestFor: ['UI/UX设计师', '视觉设计', '创意总监'],
    layout: 'two-column',
    style: 'creative',
    colors: { primary: '#DC2626', secondary: '#F97316' },
  },
  {
    id: 'technical-dark',
    name: 'Technical Dark',
    description: '深色技术风格，代码字体',
    bestFor: ['工程师', '开发者', 'DevOps'],
    layout: 'single-column',
    style: 'modern',
    colors: { primary: '#18181B', secondary: '#3F3F46' },
  },
]

// 风格图标映射
const styleIcons: Record<string, JSX.Element> = {
  modern: <Sparkles className="w-4 h-4" />,
  classic: <FileText className="w-4 h-4" />,
  creative: <Palette className="w-4 h-4" />,
  professional: <Building2 className="w-4 h-4" />,
}

// 风格标签
const styleLabels: Record<string, string> = {
  modern: '现代',
  classic: '经典',
  creative: '创意',
  professional: '专业',
}

interface TemplateSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (templateId: string) => void
  recommendation?: TemplateRecommendation | null
  isLoading?: boolean
}

/**
 * 模板选择器Modal
 * 显示所有可用模板，支持AI推荐和手动选择
 */
export function TemplateSelector({
  isOpen,
  onClose,
  onSelect,
  recommendation,
  isLoading = false,
}: TemplateSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    recommendation?.templateId || null
  )
  const [filter, setFilter] = useState<string | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<TemplateInfo | null>(null)

  // 更新选中的模板当推荐变化时
  useEffect(() => {
    if (recommendation?.templateId) {
      setSelectedId(recommendation.templateId)
    }
  }, [recommendation?.templateId])

  if (!isOpen) return null

  // 过滤模板
  const filteredTemplates = filter
    ? TEMPLATES.filter((t) => t.style === filter)
    : TEMPLATES

  // 获取推荐的模板
  const recommendedTemplate = recommendation
    ? TEMPLATES.find((t) => t.id === recommendation.templateId)
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">选择简历模板</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              选择一个适合目标岗位的模板风格
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI推荐提示 */}
        {recommendation && recommendedTemplate && (
          <div className="mx-6 mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-indigo-900">
                    AI推荐: {recommendedTemplate.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                    {recommendation.confidence}% 匹配
                  </span>
                </div>
                <p className="text-xs text-indigo-700 mt-0.5">
                  {recommendation.reason}
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedId(recommendedTemplate.id)
                  onSelect(recommendedTemplate.id)
                }}
                className="gap-1"
              >
                使用推荐
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* 风格筛选 */}
        <div className="px-6 py-3 border-b">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter(null)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                filter === null
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全部
            </button>
            {Object.entries(styleLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full transition-colors ${
                  filter === key
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {styleIcons[key]}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 模板网格 */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                selected={selectedId === template.id}
                recommended={recommendation?.templateId === template.id}
                onClick={() => setSelectedId(template.id)}
                onPreview={() => setPreviewTemplate(template)}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            {selectedId ? (
              <span>
                已选择: <strong>{TEMPLATES.find((t) => t.id === selectedId)?.name}</strong>
              </span>
            ) : (
              <span>请选择一个模板</span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button
              variant="primary"
              onClick={() => selectedId && onSelect(selectedId)}
              disabled={!selectedId || isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  使用此模板生成简历
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 模板预览Modal */}
      {previewTemplate && (
        <TemplatePreview
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onSelect={() => {
            setSelectedId(previewTemplate.id)
            setPreviewTemplate(null)
          }}
        />
      )}
    </div>
  )
}

// 模板卡片组件
function TemplateCard({
  template,
  selected,
  recommended,
  onClick,
  onPreview,
}: {
  template: TemplateInfo
  selected: boolean
  recommended: boolean
  onClick: () => void
  onPreview: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`
        relative cursor-pointer rounded-lg border-2 transition-all duration-200 group
        ${selected
          ? 'border-indigo-500 ring-2 ring-indigo-200 shadow-lg'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
        }
      `}
    >
      {/* 推荐标记 */}
      {recommended && (
        <span className="absolute -top-2 -right-2 z-10 px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-medium rounded-full shadow">
          推荐
        </span>
      )}

      {/* 颜色条 */}
      <div className="flex h-2 w-full overflow-hidden rounded-t-md">
        <div
          className="flex-1"
          style={{ backgroundColor: template.colors.primary }}
        />
        {template.colors.secondary && (
          <div
            className="flex-1"
            style={{ backgroundColor: template.colors.secondary }}
          />
        )}
      </div>

      {/* 模板预览Mock */}
      <div className="p-3 bg-white">
        <div
          className={`
            w-full h-24 rounded border border-gray-100 overflow-hidden
            ${template.layout === 'two-column' ? 'flex' : ''}
          `}
        >
          {template.layout === 'two-column' ? (
            <>
              <div
                className="w-1/3 p-1.5"
                style={{ backgroundColor: template.colors.secondary || template.colors.primary }}
              >
                <div className="h-1.5 w-3/4 bg-white/80 rounded mb-1.5" />
                <div className="h-1 w-full bg-white/60 rounded mb-0.5" />
                <div className="h-1 w-2/3 bg-white/60 rounded mb-2" />
                <div className="h-1 w-full bg-white/40 rounded mb-0.5" />
                <div className="h-1 w-1/2 bg-white/40 rounded" />
              </div>
              <div className="flex-1 p-1.5 bg-gray-50">
                <div
                  className="h-1.5 w-2/3 rounded mb-1.5"
                  style={{ backgroundColor: template.colors.primary }}
                />
                <div className="h-1 w-full bg-gray-300 rounded mb-0.5" />
                <div className="h-1 w-5/6 bg-gray-300 rounded mb-2" />
                <div className="h-1 w-full bg-gray-200 rounded mb-0.5" />
                <div className="h-1 w-3/4 bg-gray-200 rounded" />
              </div>
            </>
          ) : (
            <div className="p-1.5 bg-gray-50 h-full">
              <div
                className="h-1.5 w-1/2 rounded mb-1.5"
                style={{ backgroundColor: template.colors.primary }}
              />
              <div className="h-1 w-2/3 bg-gray-300 rounded mb-2" />
              <div
                className="h-1 w-1/4 rounded mb-0.5"
                style={{ backgroundColor: template.colors.primary, opacity: 0.7 }}
              />
              <div className="h-1 w-full bg-gray-200 rounded mb-0.5" />
              <div className="h-1 w-5/6 bg-gray-200 rounded mb-2" />
              <div
                className="h-1 w-1/3 rounded mb-0.5"
                style={{ backgroundColor: template.colors.primary, opacity: 0.7 }}
              />
              <div className="h-1 w-full bg-gray-200 rounded" />
            </div>
          )}
        </div>

        {/* 模板信息 */}
        <div className="mt-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 text-xs">{template.name}</h3>
            <span className="flex items-center gap-0.5 text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
              {styleIcons[template.style]}
              {styleLabels[template.style]}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">
            {template.description}
          </p>
        </div>

        {/* 预览按钮 - 悬停时显示 */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onPreview()
          }}
          className="absolute bottom-12 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white/90 rounded-full shadow hover:bg-gray-100"
        >
          <Eye className="w-3 h-3 text-gray-600" />
        </button>

        {/* 选中标记 */}
        {selected && (
          <div className="absolute top-3 right-3 bg-indigo-500 text-white p-1 rounded-full">
            <Check className="w-3 h-3" />
          </div>
        )}
      </div>
    </div>
  )
}

// 模板预览组件
function TemplatePreview({
  template,
  onClose,
  onSelect,
}: {
  template: TemplateInfo
  onClose: () => void
  onSelect: () => void
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* 颜色条 */}
        <div className="flex h-3">
          <div
            className="flex-1"
            style={{ backgroundColor: template.colors.primary }}
          />
          {template.colors.secondary && (
            <div
              className="flex-1"
              style={{ backgroundColor: template.colors.secondary }}
            />
          )}
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{template.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{template.description}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 模板预览 - 大尺寸 */}
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <div
              className={`
                w-full h-64 bg-white rounded shadow-sm overflow-hidden
                ${template.layout === 'two-column' ? 'flex' : ''}
              `}
            >
              {template.layout === 'two-column' ? (
                <>
                  <div
                    className="w-1/3 p-4"
                    style={{ backgroundColor: template.colors.secondary || template.colors.primary }}
                  >
                    <div className="h-3 w-3/4 bg-white/80 rounded mb-3" />
                    <div className="h-2 w-full bg-white/60 rounded mb-1" />
                    <div className="h-2 w-2/3 bg-white/60 rounded mb-4" />
                    <div className="h-2 w-full bg-white/40 rounded mb-1" />
                    <div className="h-2 w-1/2 bg-white/40 rounded mb-4" />
                    <div className="h-2 w-full bg-white/40 rounded mb-1" />
                    <div className="h-2 w-3/4 bg-white/40 rounded" />
                  </div>
                  <div className="flex-1 p-4 bg-gray-50">
                    <div
                      className="h-3 w-2/3 rounded mb-3"
                      style={{ backgroundColor: template.colors.primary }}
                    />
                    <div className="h-2 w-full bg-gray-300 rounded mb-1" />
                    <div className="h-2 w-5/6 bg-gray-300 rounded mb-4" />
                    <div className="h-2 w-full bg-gray-200 rounded mb-1" />
                    <div className="h-2 w-3/4 bg-gray-200 rounded mb-4" />
                    <div className="h-2 w-full bg-gray-200 rounded mb-1" />
                    <div className="h-2 w-4/5 bg-gray-200 rounded" />
                  </div>
                </>
              ) : (
                <div className="p-4 h-full">
                  <div
                    className="h-3 w-1/2 rounded mb-3"
                    style={{ backgroundColor: template.colors.primary }}
                  />
                  <div className="h-2 w-2/3 bg-gray-300 rounded mb-4" />
                  <div
                    className="h-2 w-1/4 rounded mb-2"
                    style={{ backgroundColor: template.colors.primary, opacity: 0.7 }}
                  />
                  <div className="h-2 w-full bg-gray-200 rounded mb-1" />
                  <div className="h-2 w-5/6 bg-gray-200 rounded mb-4" />
                  <div
                    className="h-2 w-1/3 rounded mb-2"
                    style={{ backgroundColor: template.colors.primary, opacity: 0.7 }}
                  />
                  <div className="h-2 w-full bg-gray-200 rounded mb-1" />
                  <div className="h-2 w-4/5 bg-gray-200 rounded mb-4" />
                  <div
                    className="h-2 w-1/4 rounded mb-2"
                    style={{ backgroundColor: template.colors.primary, opacity: 0.7 }}
                  />
                  <div className="h-2 w-full bg-gray-200 rounded mb-1" />
                  <div className="h-2 w-3/4 bg-gray-200 rounded" />
                </div>
              )}
            </div>
          </div>

          {/* 模板特性 */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-xs font-medium text-gray-500">布局</span>
              <p className="text-sm text-gray-900 capitalize">
                {template.layout === 'single-column' ? '单栏布局' : '双栏布局'}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500">风格</span>
              <p className="text-sm text-gray-900">{styleLabels[template.style]}</p>
            </div>
            <div className="col-span-2">
              <span className="text-xs font-medium text-gray-500">适用岗位</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {template.bestFor.map((item) => (
                  <span
                    key={item}
                    className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              返回
            </Button>
            <Button variant="primary" onClick={onSelect} className="flex-1">
              选择此模板
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TemplateSelector
