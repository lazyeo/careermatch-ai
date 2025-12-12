'use client'

/**
 * 消息气泡组件
 *
 * 显示单条聊天消息
 * 支持普通文本消息和分析卡片
 */

import { useRouter } from 'next/navigation'
import { User, Bot, ExternalLink, Play } from 'lucide-react'
import { Button } from '@careermatch/ui'
import { useTranslations, useLocale } from 'next-intl'
import type { AssistantMessage, AgentAction } from '@/lib/ai/prompts/types'
import ReactMarkdown from 'react-markdown'
import { AnalysisCard, type AnalysisCardData } from './AnalysisCard'

interface MessageBubbleProps {
  message: AssistantMessage
  isStreaming?: boolean
  onSuggestionClick?: (suggestion: string) => void
  onAnalysisNavigate?: () => void
}

export function MessageBubble({
  message,
  isStreaming = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSuggestionClick: _onSuggestionClick,
  onAnalysisNavigate,
}: MessageBubbleProps) {
  const t = useTranslations('assistant.time')
  const locale = useLocale()
  const router = useRouter()
  const isUser = message.role === 'user'
  const actions = message.metadata?.actions || []

  // 检查是否是分析卡片消息
  const analysisCard = message.metadata?.analysisCard as AnalysisCardData | undefined

  // 格式化时间
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    // 小于1分钟
    if (diff < 60 * 1000) {
      return t('justNow')
    }

    // 小于1小时
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000))
      return t('minutesAgo', { minutes })
    }

    // 今天
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    }

    // 昨天
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) {
      return t('yesterday') + ' ' + date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    }

    // 更早
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 处理操作点击
  const handleActionClick = (action: AgentAction) => {
    if (action.type === 'navigate') {
      router.push(action.target)
    } else if (action.type === 'execute') {
      // TODO: 实现操作执行
      console.log('Execute action:', action)
    }
  }

  // 如果是分析卡片消息，使用特殊渲染
  if (analysisCard && !isUser) {
    return (
      <div className="flex gap-3">
        {/* 头像 */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-accent-100">
          <Bot className="w-4 h-4 text-accent-600" />
        </div>

        {/* 卡片内容 */}
        <div className="flex-1 max-w-[90%]">
          {/* 简短说明 */}
          {message.content && (
            <p className="text-sm text-gray-600 mb-2">{message.content}</p>
          )}

          {/* 分析卡片 */}
          <AnalysisCard data={analysisCard} onNavigate={onAnalysisNavigate} />

          {/* 时间戳 */}
          <p className="text-xs text-gray-400 mt-2">
            {formatTime(message.createdAt)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* 头像 */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-primary-100' : 'bg-accent-100'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-primary-600" />
        ) : (
          <Bot className="w-4 h-4 text-accent-600" />
        )}
      </div>

      {/* 消息内容 */}
      <div className={`flex-1 ${isUser ? 'text-right' : ''}`}>
        <div
          className={`inline-block max-w-[85%] ${
            isUser
              ? 'bg-primary-600 text-white rounded-2xl rounded-tr-sm'
              : 'bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm'
          } px-4 py-2`}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="text-sm prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5">
              <ReactMarkdown
                components={{
                  // 自定义链接样式
                  a: ({ ...props }) => (
                    <a
                      {...props}
                      className="text-primary-600 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  ),
                  // 自定义代码样式
                  code: ({ ...props }) => (
                    <code
                      {...props}
                      className="bg-gray-200 px-1 py-0.5 rounded text-xs"
                    />
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* 流式输入光标 */}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-gray-400 animate-pulse ml-0.5" />
          )}
        </div>

        {/* 操作按钮 */}
        {!isUser && actions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => handleActionClick(action)}
              >
                {action.type === 'navigate' && <ExternalLink className="w-3 h-3" />}
                {action.type === 'execute' && <Play className="w-3 h-3" />}
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {/* 时间戳 */}
        <p className="text-xs text-gray-400 mt-1">
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  )
}

