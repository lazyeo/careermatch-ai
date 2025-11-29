'use client'

/**
 * 上下文感知的建议操作
 *
 * 根据当前页面上下文显示相关操作按钮
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

// 操作定义
interface SuggestedAction {
  id: string
  label: string
  icon: string
  href?: string
  apiAction?: string // API调用标识
  variant?: 'primary' | 'outline'
  description?: string
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
      description: '分析此岗位与您的匹配度',
    },
    {
      id: 'generate-cover-letter',
      label: '生成求职信',
      icon: 'FileText',
      href: '{{jobId}}/cover-letter',
      description: '生成针对此岗位的求职信',
    },
  ],
  'job-analysis': [
    {
      id: 'optimize-resume',
      label: 'AI优化简历',
      icon: 'Wand2',
      apiAction: 'optimize-resume',
      variant: 'primary',
      description: '根据分析结果优化简历',
    },
    {
      id: 'generate-cover-letter',
      label: '生成求职信',
      icon: 'FileText',
      href: '{{jobId}}/cover-letter',
      description: '生成针对此岗位的求职信',
    },
  ],
  'job-cover-letter': [
    {
      id: 'back-to-job',
      label: '查看岗位',
      icon: 'Briefcase',
      href: '{{jobId}}',
    },
    {
      id: 'analyze-job',
      label: '匹配分析',
      icon: 'Sparkles',
      href: '{{jobId}}/analysis',
    },
  ],
  jobs: [
    {
      id: 'import-job',
      label: '导入岗位',
      icon: 'Plus',
      href: '/jobs/import',
      variant: 'primary',
      description: '从URL或文本导入岗位',
    },
  ],
  'job-import': [
    {
      id: 'view-jobs',
      label: '查看岗位',
      icon: 'Briefcase',
      href: '/jobs',
    },
  ],
  'resume-detail': [
    {
      id: 'edit-resume',
      label: '编辑简历',
      icon: 'FileEdit',
      href: '{{resumeId}}/edit',
      variant: 'primary',
    },
    {
      id: 'export-pdf',
      label: '导出PDF',
      icon: 'Download',
      apiAction: 'export-pdf',
      description: '导出为PDF文件',
    },
  ],
  'resume-edit': [
    {
      id: 'view-resume',
      label: '预览简历',
      icon: 'FileText',
      href: '{{resumeId}}',
    },
  ],
  resumes: [
    {
      id: 'create-resume',
      label: '创建简历',
      icon: 'Plus',
      href: '/resumes/new',
      variant: 'primary',
    },
  ],
  dashboard: [
    {
      id: 'import-job',
      label: '导入岗位',
      icon: 'Plus',
      href: '/jobs/import',
    },
    {
      id: 'view-profile',
      label: '完善档案',
      icon: 'User',
      href: '/profile',
    },
  ],
  profile: [
    {
      id: 'upload-resume',
      label: '上传简历',
      icon: 'Upload',
      href: '/profile/upload',
      variant: 'primary',
      description: 'AI解析简历填充档案',
    },
  ],
  'profile-edit': [
    {
      id: 'back-to-profile',
      label: '返回档案',
      icon: 'User',
      href: '/profile',
    },
  ],
  'profile-upload': [
    {
      id: 'back-to-profile',
      label: '返回档案',
      icon: 'User',
      href: '/profile',
    },
  ],
  applications: [
    {
      id: 'view-jobs',
      label: '浏览岗位',
      icon: 'Briefcase',
      href: '/jobs',
    },
  ],
  other: [],
}

export function SuggestedActions() {
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
  const handleApiAction = async (action: SuggestedAction) => {
    setLoadingAction(action.id)

    try {
      switch (action.apiAction) {
        case 'optimize-resume':
          // 添加用户消息
          addMessage({
            sessionId: '',
            role: 'user',
            content: `请帮我优化简历以匹配当前岗位`,
          })
          // TODO: 调用优化API
          addMessage({
            sessionId: '',
            role: 'assistant',
            content: `简历优化功能正在开发中。您可以先查看分析结果中的建议来手动优化简历。`,
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
        content: `操作失败：${error instanceof Error ? error.message : '未知错误'}`,
      })
    } finally {
      setLoadingAction(null)
    }
  }

  // 处理操作点击
  const handleAction = (action: SuggestedAction) => {
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
      <p className="text-xs text-gray-500 mb-2">快捷操作</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const Icon = iconMap[action.icon] || Sparkles
          const isLoading = loadingAction === action.id

          return (
            <Button
              key={action.id}
              variant={action.variant || 'outline'}
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => handleAction(action)}
              disabled={isLoading}
              title={action.description}
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Icon className="w-3.5 h-3.5" />
              )}
              {action.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
