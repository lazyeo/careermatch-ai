'use client'

/**
 * AI 助手聊天组件
 *
 * 消息列表和输入区域
 * 支持分析意图识别和卡片显示
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Loader2, RefreshCw, Square, Paperclip, Upload } from 'lucide-react'
import { Button } from '@careermatch/ui'
import { MessageBubble } from './MessageBubble'
import {
  useAssistantStore,
  useAssistantMessages,
  useAssistantIsLoading,
  useAssistantIsStreaming,
  useAssistantStreamingContent,
  useAssistantError,
} from '@/stores/assistant-store'

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
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  // 检查待处理的分析结果
  useEffect(() => {
    const checkPendingResults = () => {
      messages.forEach(msg => {
        if (msg.metadata?.analysisCard?.status === 'loading') {
          const jobId = msg.metadata.analysisCard.jobId
          const result = localStorage.getItem(`analysis-result-${jobId}`)
          if (result) {
            try {
              const parsed = JSON.parse(result)
              updateAnalysisCard(msg.id, {
                status: parsed.error ? 'failed' : 'completed',
                score: parsed.score,
                recommendation: parsed.recommendation,
                summary: parsed.summary,
                sessionId: parsed.sessionId,
                error: parsed.error,
              })
              localStorage.removeItem(`analysis-result-${jobId}`)
            } catch (e) {
              console.error('Failed to parse pending analysis result:', e)
            }
          }
        }
      })
    }

    checkPendingResults()
  }, [messages, updateAnalysisCard])

  // 处理文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await handleUpload(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // 处理文件上传
  const handleUpload = async (file: File) => {
    if (isUploading) return

    // 验证文件类型
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
    if (!validTypes.includes(file.type)) {
      setError('不支持的文件类型。请上传 PDF, Word 或 TXT 文件。')
      return
    }

    // 确保有会话
    let sessionId = currentSession?.id
    if (!sessionId) {
      useAssistantStore.getState().startNewSession()
      sessionId = useAssistantStore.getState().currentSession?.id
    }

    if (!sessionId) {
      setError('无法创建会话，请刷新页面重试')
      return
    }

    setIsUploading(true)
    setError(null)

    // 添加一个临时的"正在上传"消息
    addMessage({
      sessionId,
      role: 'assistant',
      content: `正在分析简历 "${file.name}"... (可能需要 30-60 秒)`,
    })

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/resume-upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('上传失败')
      }

      await response.json()

      addMessage({
        sessionId,
        role: 'assistant',
        content: `✅ 简历 "${file.name}" 解析成功！\n\n已更新您的个人资料和技能标签。您可以直接问我："我适合什么工作？" 或 "帮我写一封求职信"。`,
      })

    } catch (err) {
      console.error('Upload failed:', err)
      setError('简历上传/解析失败，请重试。')
      addMessage({
        sessionId,
        role: 'assistant',
        content: `❌ 简历 "${file.name}" 解析失败。请确保文件格式正确且未损坏。`,
      })
    } finally {
      setIsUploading(false)
      setIsDragging(false)
    }
  }

  // 拖拽事件处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) await handleUpload(file)
  }

  // 处理分析请求
  const handleAnalysisRequest = useCallback(async (userMessage: string) => {
    const activeJob = currentContext?.activeJob
    if (!activeJob) return false

    addMessage({
      sessionId: currentSession?.id || '',
      role: 'user',
      content: userMessage,
    })

    const messageId = addAnalysisMessage(
      activeJob.id,
      activeJob.title,
      activeJob.company
    )

    const analysisUrl = `/jobs/${activeJob.id}/analysis?mode=profile&autoStart=true`
    router.push(analysisUrl)

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
          localStorage.removeItem(`analysis-result-${activeJob.id}`)
        } catch (e) {
          console.error('Failed to parse analysis result:', e)
        }
        window.removeEventListener('storage', handleAnalysisComplete)
      }
    }

    window.addEventListener('storage', handleAnalysisComplete)

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
    const currentContent = useAssistantStore.getState().streamingContent
    if (currentContent) {
      useAssistantStore.getState().finalizeStream(undefined, undefined, undefined)
    } else {
      useAssistantStore.getState().setStreaming(false)
      useAssistantStore.getState().clearStreamContent()
    }
    setLoading(false)
  }, [setLoading])

  // 发送消息
  const handleSend = async () => {
    if (!input.trim() || isLoading || isStreaming) return

    const userMessage = input.trim()
    setInput('')
    clearError()

    const hasActiveJob = !!currentContext?.activeJob
    if (isAnalysisIntent(userMessage, hasActiveJob)) {
      const handled = await handleAnalysisRequest(userMessage)
      if (handled) return
    }

    addMessage({
      sessionId: currentSession?.id || '',
      role: 'user',
      content: userMessage,
    })

    setLoading(true)
    abortControllerRef.current = new AbortController()

    try {
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
              if (line.trim() !== 'data: ') {
                console.warn('Parse error:', parseError)
              }
            }
          }
        }
      }

      useAssistantStore.getState().finalizeStream(
        undefined,
        suggestions,
        undefined
      )
    } catch (err) {
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

  // 处理分析卡片导航
  const handleAnalysisNavigate = () => {
    // closeAssistant()
  }

  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant')
  const suggestions = lastAssistantMessage?.metadata?.suggestions || []

  return (
    <div
      className="flex-1 flex flex-col min-h-0 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 拖拽遮罩层 */}
      {isDragging && (
        <div className="absolute inset-0 bg-primary-50/90 z-50 flex items-center justify-center border-2 border-dashed border-primary-500 m-2 rounded-xl">
          <div className="text-center text-primary-700">
            <Upload className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg font-medium">释放以上传简历</p>
            <p className="text-sm opacity-75">支持 PDF, Word, TXT</p>
          </div>
        </div>
      )}

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
            <div className="mt-8 p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
              <p className="text-sm text-gray-500 mb-2">或者直接拖入简历文件</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                上传简历
              </Button>
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

        {isLoading && !isStreaming && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">思考中...</span>
          </div>
        )}

        {isUploading && (
          <div className="flex items-center gap-2 text-primary-600 bg-primary-50 p-3 rounded-lg self-start">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">正在分析简历...</span>
          </div>
        )}

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
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
        />

        <div className="flex gap-2">
          <Button
            variant="ghost"
            className="w-10 h-10 p-0 flex-shrink-0 text-gray-500 hover:text-gray-700"
            onClick={() => fileInputRef.current?.click()}
            title="上传简历"
            disabled={isLoading || isStreaming || isUploading}
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息，或拖入简历..."
            className="flex-1 resize-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[40px] max-h-[120px]"
            rows={1}
            disabled={isLoading || isStreaming || isUploading}
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
              disabled={!input.trim() || isLoading || isUploading}
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
