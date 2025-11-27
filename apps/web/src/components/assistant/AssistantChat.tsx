'use client'

/**
 * AI 助手聊天组件
 *
 * 消息列表和输入区域
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@careermatch/ui'
import {
  useAssistantStore,
  useAssistantMessages,
  useAssistantIsLoading,
  useAssistantIsStreaming,
  useAssistantStreamingContent,
  useAssistantError,
} from '@/stores/assistant-store'
import { MessageBubble } from './MessageBubble'

export function AssistantChat() {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const messages = useAssistantMessages()
  const isLoading = useAssistantIsLoading()
  const isStreaming = useAssistantIsStreaming()
  const streamingContent = useAssistantStreamingContent()
  const error = useAssistantError()
  const { addMessage, setLoading, setError, clearError, currentSession } = useAssistantStore()

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent, scrollToBottom])

  // 聚焦输入框
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // 发送消息
  const handleSend = async () => {
    if (!input.trim() || isLoading || isStreaming) return

    const userMessage = input.trim()
    setInput('')
    clearError()

    // 添加用户消息
    addMessage({
      sessionId: currentSession?.id || '',
      role: 'user',
      content: userMessage,
    })

    setLoading(true)

    try {
      // 调用 API
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          sessionId: currentSession?.id,
          context: currentSession?.currentContext,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '请求失败')
      }

      const data = await response.json()

      // 添加助手回复
      addMessage({
        sessionId: currentSession?.id || '',
        role: 'assistant',
        content: data.content,
        metadata: {
          intent: data.metadata?.intent,
          actions: data.actions,
          suggestions: data.suggestions,
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 处理建议点击
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    inputRef.current?.focus()
  }

  // 获取最后一条助手消息的建议
  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant')
  const suggestions = lastAssistantMessage?.metadata?.suggestions || []

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-50 flex items-center justify-center">
              <span className="text-3xl">👋</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">你好！我是 AI 助手</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              我可以帮你分析岗位、优化简历、生成求职信，或回答任何求职相关问题。
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {['帮我分析这个岗位', '如何优化我的简历？', '生成求职信'].map((text) => (
                <button
                  key={text}
                  onClick={() => handleSuggestionClick(text)}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onSuggestionClick={handleSuggestionClick}
          />
        ))}

        {/* 流式响应显示 */}
        {isStreaming && streamingContent && (
          <MessageBubble
            message={{
              id: 'streaming',
              sessionId: '',
              role: 'assistant',
              content: streamingContent,
              createdAt: new Date().toISOString(),
            }}
            isStreaming
          />
        )}

        {/* 加载指示器 */}
        {isLoading && !isStreaming && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">思考中...</span>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
            <p className="text-sm text-error-700">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="mt-2 gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              重试
            </Button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 建议问题 */}
      {suggestions.length > 0 && !isLoading && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 输入区域 */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            className="flex-1 resize-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[40px] max-h-[120px]"
            rows={1}
            disabled={isLoading || isStreaming}
          />
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isStreaming}
            className="w-10 h-10 p-0 flex-shrink-0"
          >
            {isLoading || isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          按 Enter 发送，Shift + Enter 换行
        </p>
      </div>
    </div>
  )
}
