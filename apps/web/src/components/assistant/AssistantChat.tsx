'use client'

/**
 * AI 助手聊天组件
 *
 * 消息列表和输入区域
 * 支持分析意图识别和卡片显示
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Loader2, RefreshCw, Square } from 'lucide-react'
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

// 分析意图关键词
const ANALYSIS_KEYWORDS = [
  '分析',
  '匹配',
  '匹配度',
  '评估',
  '看看',
  '帮我看',
  '这个岗位',
  '这份工作',
  '合适吗',
  '适合吗',
  '能申请吗',
  'analyze',
  'analysis',
  'match',
]

/**
 * 检测是否是分析意图
 */
function isAnalysisIntent(message: string, hasActiveJob: boolean): boolean {
  if (!hasActiveJob) return false

  const lowerMessage = message.toLowerCase()
  return ANALYSIS_KEYWORDS.some((keyword) =>
    lowerMessage.includes(keyword.toLowerCase())
  )
}

export function AssistantChat() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const messages = useAssistantMessages()
  const isLoading = useAssistantIsLoading()
  const isStreaming = useAssistantIsStreaming()
  const streamingContent = useAssistantStreamingContent()
  const error = useAssistantError()
  const {
    addMessage,
    addAnalysisMessage,
    updateAnalysisCard,
    setLoading,
    setError,
    clearError,
    currentSession,
    currentContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    close: _closeAssistant,
  } = useAssistantStore()

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

  // 处理分析请求
  const handleAnalysisRequest = useCallback(async (userMessage: string) => {
    const activeJob = currentContext?.activeJob
    if (!activeJob) return false

    // 添加用户消息
    addMessage({
      sessionId: currentSession?.id || '',
      role: 'user',
      content: userMessage,
    })

    // 添加分析卡片消息（加载状态）
    const messageId = addAnalysisMessage(
      activeJob.id,
      activeJob.title,
      activeJob.company
    )

    // 检查用户是否有简历，决定分析模式
    let analysisUrl = `/jobs/${activeJob.id}/analysis`
    try {
      const response = await fetch('/api/resumes')
      if (response.ok) {
        const resumes = await response.json()
        const hasResumes = Array.isArray(resumes) && resumes.length > 0
        if (!hasResumes) {
          // 没有简历，使用Profile模式
          analysisUrl = `/jobs/${activeJob.id}/analysis?mode=profile`
        }
      }
    } catch (e) {
      console.warn('Failed to check resumes:', e)
      // 出错时默认使用Profile模式，更友好
      analysisUrl = `/jobs/${activeJob.id}/analysis?mode=profile`
    }

    // 跳转到分析页面
    router.push(analysisUrl)

    // 监听分析结果（通过localStorage事件）
    const handleAnalysisComplete = (event: StorageEvent) => {
      if (event.key === `analysis-result-${activeJob.id}`) {
        try {
          const result = JSON.parse(event.newValue || '{}')
          updateAnalysisCard(messageId, {
            status: result.error ? 'failed' : 'completed',
            score: result.score,
            recommendation: result.recommendation,
            summary: result.summary,
            sessionId: result.sessionId,
            error: result.error,
          })
          // 清理
          localStorage.removeItem(`analysis-result-${activeJob.id}`)
        } catch (e) {
          console.error('Failed to parse analysis result:', e)
        }
        window.removeEventListener('storage', handleAnalysisComplete)
      }
    }

    window.addEventListener('storage', handleAnalysisComplete)

    // 5分钟超时自动清理
    setTimeout(() => {
      window.removeEventListener('storage', handleAnalysisComplete)
    }, 5 * 60 * 1000)

    return true
  }, [currentContext, currentSession, addMessage, addAnalysisMessage, updateAnalysisCard, router])

  // 停止生成
  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    // 保存当前已生成的内容
    const currentContent = useAssistantStore.getState().streamingContent
    if (currentContent) {
      useAssistantStore.getState().finalizeStream(undefined, undefined, undefined)
    } else {
      useAssistantStore.getState().setStreaming(false)
      useAssistantStore.getState().clearStreamContent()
    }
    setLoading(false)
  }, [])

  // 发送消息（支持流式响应）
  const handleSend = async () => {
    if (!input.trim() || isLoading || isStreaming) return

    const userMessage = input.trim()
    setInput('')
    clearError()

    // 检查是否是分析意图
    const hasActiveJob = !!currentContext?.activeJob
    if (isAnalysisIntent(userMessage, hasActiveJob)) {
      const handled = await handleAnalysisRequest(userMessage)
      if (handled) return
    }

    // 添加用户消息
    addMessage({
      sessionId: currentSession?.id || '',
      role: 'user',
      content: userMessage,
    })

    setLoading(true)

    // 创建新的 AbortController
    abortControllerRef.current = new AbortController()

    try {
      // 使用流式 API - 使用store级别的currentContext（由usePageContext更新）
      const response = await fetch('/api/assistant/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          sessionId: currentSession?.id,
          context: currentContext,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '请求失败')
      }

      // 处理SSE流
      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取响应流')

      const decoder = new TextDecoder()
      let streamContent = ''
      let suggestions: string[] = []

      setLoading(false)
      useAssistantStore.getState().setStreaming(true)
      useAssistantStore.getState().clearStreamContent()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'content') {
                streamContent += data.data
                useAssistantStore.getState().appendStreamContent(data.data)
              } else if (data.type === 'done') {
                suggestions = data.data.suggestions || []
                streamContent = data.data.content || streamContent
              } else if (data.type === 'error') {
                throw new Error(data.data.message)
              }
            } catch (parseError) {
              // 忽略解析错误，可能是不完整的chunk
              if (line.trim() !== 'data: ') {
                console.warn('Parse error:', parseError)
              }
            }
          }
        }
      }

      // 流结束，添加最终消息
      useAssistantStore.getState().finalizeStream(
        undefined,
        suggestions,
        undefined
      )
    } catch (err) {
      // 处理用户主动中断
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Stream aborted by user')
        return
      }
      setError(err instanceof Error ? err.message : '发送失败，请重试')
      useAssistantStore.getState().setStreaming(false)
      useAssistantStore.getState().clearStreamContent()
    } finally {
      setLoading(false)
      abortControllerRef.current = null
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

  // 处理分析卡片导航（可选：关闭侧栏）
  const handleAnalysisNavigate = () => {
    // 可以选择关闭助手侧栏
    // closeAssistant()
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
            onAnalysisNavigate={handleAnalysisNavigate}
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
          {isStreaming ? (
            <Button
              variant="outline"
              onClick={handleStop}
              className="w-10 h-10 p-0 flex-shrink-0 bg-red-50 hover:bg-red-100 border-red-200"
              title="停止生成"
            >
              <Square className="w-4 h-4 text-red-600 fill-red-600" />
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 p-0 flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          按 Enter 发送，Shift + Enter 换行
        </p>
      </div>
    </div>
  )
}
