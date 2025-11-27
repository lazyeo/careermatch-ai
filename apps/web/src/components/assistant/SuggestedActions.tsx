'use client'

/**
 * 上下文感知的建议操作
 *
 * 根据当前页面上下文显示相关操作按钮
 */

import { useRouter } from 'next/navigation'
import { Sparkles, FileText, Plus, Wand2, Download, MessageSquare } from 'lucide-react'
import { Button } from '@careermatch/ui'
import { useAssistantContext } from '@/stores/assistant-store'
import type { PageType } from '@/lib/ai/prompts/types'

// 图标映射
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  FileText,
  Plus,
  Wand2,
  Download,
  MessageSquare,
}

// 操作定义
interface SuggestedAction {
  id: string
  label: string
  icon: string
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'outline'
}

// 页面类型对应的操作
const PAGE_ACTIONS: Record<PageType, SuggestedAction[]> = {
  'job-detail': [
    {
      id: 'analyze-job',
      label: '匹配分析',
      icon: 'Sparkles',
      href: '{{jobId}}/analysis',
      variant: 'primary',
    },
    {
      id: 'generate-cover-letter',
      label: '生成求职信',
      icon: 'FileText',
      href: '{{jobId}}/cover-letter',
    },
  ],
  'job-analysis': [
    {
      id: 'optimize-resume',
      label: 'AI优化简历',
      icon: 'Wand2',
      variant: 'primary',
    },
    {
      id: 'interview-prep',
      label: '面试准备',
      icon: 'MessageSquare',
    },
  ],
  jobs: [
    {
      id: 'import-job',
      label: '导入岗位',
      icon: 'Plus',
      href: '/jobs/import',
      variant: 'primary',
    },
  ],
  'resume-detail': [
    {
      id: 'improve-resume',
      label: '优化简历',
      icon: 'Sparkles',
      variant: 'primary',
    },
    {
      id: 'export-pdf',
      label: '导出PDF',
      icon: 'Download',
    },
  ],
  dashboard: [
    {
      id: 'import-job',
      label: '导入岗位',
      icon: 'Plus',
      href: '/jobs/import',
    },
  ],
  // 其他页面暂无特定操作
  resumes: [],
  'resume-edit': [],
  profile: [],
  'profile-upload': [],
  applications: [],
  'job-cover-letter': [],
  'job-import': [],
  other: [],
}

export function SuggestedActions() {
  const router = useRouter()
  const context = useAssistantContext()

  if (!context?.currentPage) return null

  const pageType = context.currentPage.type
  const params = context.currentPage.params || {}

  // 获取当前页面的操作
  const actions = PAGE_ACTIONS[pageType] || []

  if (actions.length === 0) return null

  // 处理操作点击
  const handleAction = (action: SuggestedAction) => {
    if (action.href) {
      // 替换参数
      let href = action.href
      if (params.jobId) {
        href = href.replace('{{jobId}}', `/jobs/${params.jobId}`)
      }
      if (params.resumeId) {
        href = href.replace('{{resumeId}}', `/resumes/${params.resumeId}`)
      }
      // 如果是相对路径，补全
      if (!href.startsWith('/')) {
        href = `/${href}`
      }
      router.push(href)
    } else if (action.onClick) {
      action.onClick()
    }
  }

  return (
    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
      <p className="text-xs text-gray-500 mb-2">快捷操作</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const Icon = iconMap[action.icon] || Sparkles

          return (
            <Button
              key={action.id}
              variant={action.variant || 'outline'}
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => handleAction(action)}
            >
              <Icon className="w-3.5 h-3.5" />
              {action.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
