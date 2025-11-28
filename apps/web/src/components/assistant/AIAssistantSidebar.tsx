'use client'

/**
 * AI 助手侧栏主容器
 *
 * 可折叠的全局 AI 助手侧栏
 */

import { useEffect } from 'react'
import { X, Minus, MessageSquare, Trash2 } from 'lucide-react'
import { Button } from '@careermatch/ui'
import {
  useAssistantStore,
  useAssistantIsOpen,
  useAssistantIsMinimized,
} from '@/stores/assistant-store'
import { AssistantChat } from './AssistantChat'
import { SuggestedActions } from './SuggestedActions'

export function AIAssistantSidebar() {
  const isOpen = useAssistantIsOpen()
  const isMinimized = useAssistantIsMinimized()
  const { close, minimize, maximize, startNewSession, clearCurrentSession, currentSession } = useAssistantStore()

  // 自动创建新会话
  useEffect(() => {
    if (isOpen && !currentSession) {
      startNewSession()
    }
  }, [isOpen, currentSession, startNewSession])

  // 最小化状态 - 显示悬浮按钮
  if (isMinimized) {
    return (
      <button
        onClick={maximize}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 flex items-center justify-center transition-all hover:scale-105"
        title="展开 AI 助手"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    )
  }

  // 关闭状态 - 显示悬浮触发按钮
  if (!isOpen) {
    return (
      <button
        onClick={() => useAssistantStore.getState().open()}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 flex items-center justify-center transition-all hover:scale-105 group"
        title="打开 AI 助手 (Cmd+/)"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="absolute -top-10 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Cmd + /
        </span>
      </button>
    )
  }

  // 展开状态 - 显示完整侧栏
  return (
    <>
      {/* 背景遮罩 - 移动端 */}
      <div
        className="fixed inset-0 bg-black/20 z-40 lg:hidden"
        onClick={close}
      />

      {/* 侧栏 */}
      <aside className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-xl z-50 flex flex-col border-l border-gray-200 animate-slide-in-right">
        {/* 头部 */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-accent-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">AI 助手</h2>
              <p className="text-xs text-gray-500">智能求职顾问</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCurrentSession}
              className="w-8 h-8 p-0 text-gray-500 hover:text-gray-700"
              title="清除会话"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={minimize}
              className="w-8 h-8 p-0"
              title="最小化"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={close}
              className="w-8 h-8 p-0"
              title="关闭"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* 上下文感知操作 */}
        <SuggestedActions />

        {/* 聊天区域 */}
        <AssistantChat />
      </aside>
    </>
  )
}

// 动画样式
const styles = `
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.animate-slide-in-right {
  animation: slide-in-right 0.2s ease-out;
}
`

// 注入样式
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  document.head.appendChild(styleEl)
}
