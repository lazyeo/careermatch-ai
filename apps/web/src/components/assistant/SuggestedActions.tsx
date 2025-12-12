'use client'

/**
 * 上下文感知的建议操作
 *
 * 根据当前页面上下文显示相关操作按钮
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Sparkles,
  FileText,
  Plus,
  Wand2,
  Download,
  MessageSquare,
  Upload,
  Briefcase,
  User,
  FileEdit,
  Loader2,
} from 'lucide-react'
import { Button } from '@careermatch/ui'
import { useAssistantContext, useAssistantStore } from '@/stores/assistant-store'
import type { PageType } from '@/lib/ai/prompts/types'

// 图标映射
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  FileText,
  Plus,
  Wand2,
  Download,
  MessageSquare,
  Upload,
  Briefcase,
  User,
  FileEdit,
  Loader2,
}

// 操作定义（不包含label和description，这些将从翻译中获取）
interface ActionConfig {
  id: string
  labelKey: string
  descriptionKey?: string
  icon: string
  href?: string
  apiAction?: string
  variant?: 'primary' | 'outline'
}

// 页面类型对应的操作配置
const PAGE_ACTIONS: Record<PageType, ActionConfig[]> = {
  'job-detail': [
    { id: 'analyze-job', labelKey: 'matchAnalysis', descriptionKey: 'matchAnalysisDesc', icon: 'Sparkles', href: '{{jobId}}/analysis', variant: 'primary' },
    { id: 'generate-cover-letter', labelKey: 'generateCoverLetter', descriptionKey: 'generateCoverLetterDesc', icon: 'FileText', href: '{{jobId}}/cover-letter' },
  ],
  'job-analysis': [
    { id: 'optimize-resume', labelKey: 'aiOptimizeResume', descriptionKey: 'aiOptimizeResumeDesc', icon: 'Wand2', apiAction: 'optimize-resume', variant: 'primary' },
    { id: 'generate-cover-letter', labelKey: 'generateCoverLetter', descriptionKey: 'generateCoverLetterDesc', icon: 'FileText', href: '{{jobId}}/cover-letter' },
  ],
  'job-cover-letter': [
    { id: 'back-to-job', labelKey: 'viewAnalysis', icon: 'Briefcase', href: '{{jobId}}' },
    { id: 'analyze-job', labelKey: 'matchAnalysis', icon: 'Sparkles', href: '{{jobId}}/analysis' },
  ],
  jobs: [
    { id: 'import-job', labelKey: 'importJob', descriptionKey: 'importJobDesc', icon: 'Plus', href: '/jobs/import', variant: 'primary' },
  ],
  'job-import': [
    { id: 'view-jobs', labelKey: 'viewAnalysis', icon: 'Briefcase', href: '/jobs' },
  ],
  'resume-detail': [
    { id: 'edit-resume', labelKey: 'aiOptimizeResume', icon: 'FileEdit', href: '{{resumeId}}/edit', variant: 'primary' },
    { id: 'export-pdf', labelKey: 'applyNow', descriptionKey: 'applyNowDesc', icon: 'Download', apiAction: 'export-pdf' },
  ],
  'resume-edit': [
    { id: 'view-resume', labelKey: 'viewAnalysis', icon: 'FileText', href: '{{resumeId}}' },
  ],
  resumes: [
    { id: 'create-resume', labelKey: 'aiOptimizeResume', icon: 'Plus', href: '/resumes/new', variant: 'primary' },
  ],
  dashboard: [
    { id: 'import-job', labelKey: 'importJob', icon: 'Plus', href: '/jobs/import' },
    { id: 'view-profile', labelKey: 'viewAnalysis', icon: 'User', href: '/profile' },
  ],
  profile: [
    { id: 'upload-resume', labelKey: 'aiOptimizeResume', descriptionKey: 'aiOptimizeResumeDesc', icon: 'Upload', href: '/profile/upload', variant: 'primary' },
  ],
  'profile-edit': [
    { id: 'back-to-profile', labelKey: 'viewAnalysis', icon: 'User', href: '/profile' },
  ],
  'profile-upload': [
    { id: 'back-to-profile', labelKey: 'viewAnalysis', icon: 'User', href: '/profile' },
  ],
  applications: [
    { id: 'view-jobs', labelKey: 'viewAnalysis', icon: 'Briefcase', href: '/jobs' },
  ],
  other: [],
}

export function SuggestedActions() {
  const t = useTranslations('assistant')
  const router = useRouter()
  const context = useAssistantContext()
  const { addMessage } = useAssistantStore()
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  if (!context?.currentPage) return null

  const pageType = context.currentPage.type
  const params = context.currentPage.params || {}

  // 获取当前页面的操作
  const actions = PAGE_ACTIONS[pageType] || []

  if (actions.length === 0) return null

  // 处理API操作
  const handleApiAction = async (action: ActionConfig) => {
    setLoadingAction(action.id)

    try {
      switch (action.apiAction) {
        case 'optimize-resume':
          // 添加用户消息
          addMessage({
            sessionId: '',
            role: 'user',
            content: t('quickActions.aiOptimizeResume'),
          })
          // TODO: 调用优化API
          addMessage({
            sessionId: '',
            role: 'assistant',
            content: t('quickActions.optimizeResumeMessage'),
          })
          break

        case 'export-pdf':
          if (params.resumeId) {
            // 触发PDF导出
            window.open(`/api/resumes/${params.resumeId}/pdf`, '_blank')
          }
          break

        default:
          console.log('Unknown API action:', action.apiAction)
      }
    } catch (error) {
      console.error('Action failed:', error)
      addMessage({
        sessionId: '',
        role: 'assistant',
        content: t('quickActions.actionFailed', { error: error instanceof Error ? error.message : 'Unknown error' }),
      })
    } finally {
      setLoadingAction(null)
    }
  }

  // 处理操作点击
  const handleAction = (action: ActionConfig) => {
    if (action.apiAction) {
      handleApiAction(action)
      return
    }

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
    }
  }

  return (
    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
      <p className="text-xs text-gray-500 mb-2">{t('actions.suggestedActions')}</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const Icon = iconMap[action.icon] || Sparkles
          const isLoading = loadingAction === action.id
          const label = t(`quickActions.${action.labelKey}`)
          const description = action.descriptionKey ? t(`quickActions.${action.descriptionKey}`) : undefined

          return (
            <Button
              key={action.id}
              variant={action.variant || 'outline'}
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => handleAction(action)}
              disabled={isLoading}
              title={description}
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Icon className="w-3.5 h-3.5" />
              )}
              {label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
