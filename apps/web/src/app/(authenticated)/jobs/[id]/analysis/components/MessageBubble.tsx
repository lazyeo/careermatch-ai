'use client'

import { User, Bot } from 'lucide-react'
import { MarkdownAnalysis } from './MarkdownAnalysis'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

interface MessageBubbleProps {
  message: Message
}

/**
 * 消息气泡组件 - 展示对话中的单条消息
 */
export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-primary-100' : 'bg-gray-200'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-primary-600" />
        ) : (
          <Bot className="w-4 h-4 text-gray-600" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-primary-600 text-white'
            : 'bg-white border border-gray-200'
        }`}
      >
        {isUser ? (
          // User message - plain text
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          // Assistant message - Markdown rendered
          <div className="text-sm">
            <MarkdownAnalysis
              content={message.content}
              className="prose-sm"
            />
          </div>
        )}

        {/* Timestamp */}
        <div
          className={`text-xs mt-1 ${
            isUser ? 'text-primary-200' : 'text-gray-400'
          }`}
        >
          {formatTime(message.createdAt)}
        </div>
      </div>
    </div>
  )
}

/**
 * Format timestamp to readable time
 */
function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // Less than 1 minute
  if (diff < 60000) {
    return '刚刚'
  }

  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes}分钟前`
  }

  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours}小时前`
  }

  // More than 24 hours - show date
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default MessageBubble
