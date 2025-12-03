'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@careermatch/ui'
import { Send, Loader2 } from 'lucide-react'
import { MessageBubble } from './MessageBubble'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

interface ChatInterfaceProps {
  sessionId: string
  jobId: string
  initialMessages?: Array<{ id: string; role: string; content: string; created_at: string }>
}

/**
 * 对话界面组件 - 支持与AI顾问追问对话
 */
export function ChatInterface({ sessionId, jobId, initialMessages = [] }: ChatInterfaceProps) {
  // Convert initial messages to proper format
  const [messages, setMessages] = useState<Message[]>(
    initialMessages.map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      createdAt: new Date(m.created_at),
    }))
  )
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    '面试可能会问什么问题？',
    '我的简历需要如何优化？',
    '这个岗位的核心要求是什么？',
  ])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      createdAt: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch(`/api/jobs/${jobId}/analyze/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: userMessage.content }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()

      const aiMessage: Message = {
        id: data.messageId,
        role: 'assistant',
        content: data.response,
        createdAt: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])

      // Update suggested questions
      if (data.suggestedQuestions && data.suggestedQuestions.length > 0) {
        setSuggestedQuestions(data.suggestedQuestions)
      }
    } catch (error) {
      console.error('Chat error:', error)

      // Show error message
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '抱歉，发送消息时出现错误。请稍后重试。',
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleQuickQuestion = (question: string) => {
    setInput(question)
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col">
      {/* Suggested Questions */}
      {messages.length === 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">快速提问:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages List */}
      {messages.length > 0 && (
        <div className="border rounded-lg bg-gray-50 p-4 mb-4 max-h-96 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">AI正在思考...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Quick Suggestions after conversation started */}
      {messages.length > 0 && suggestedQuestions.length > 0 && !isLoading && (
        <div className="mb-3">
          <p className="text-xs text-gray-400 mb-1.5">继续追问:</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入你的问题，例如：如何突出我的技术能力？"
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          disabled={isLoading}
        />
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading || !input.trim()}
          className="px-4"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  )
}

export default ChatInterface
