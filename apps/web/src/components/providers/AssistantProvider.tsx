'use client'

/**
 * AI 助手 Provider
 *
 * 提供上下文感知和键盘快捷键支持
 */

import { useEffect, useCallback } from 'react'
import { useAssistantStore } from '@/stores/assistant-store'
import { usePageContext } from '@/components/assistant/hooks'

interface AssistantProviderProps {
  children: React.ReactNode
}

export function AssistantProvider({ children }: AssistantProviderProps) {
  const { toggle, isOpen } = useAssistantStore()

  // 使用 usePageContext hook 自动加载上下文
  usePageContext()

  // 键盘快捷键处理
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Cmd/Ctrl + / 切换侧栏
      if ((event.metaKey || event.ctrlKey) && event.key === '/') {
        event.preventDefault()
        toggle()
      }

      // Escape 关闭侧栏
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault()
        toggle()
      }
    },
    [toggle, isOpen]
  )

  // 注册键盘事件
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return <>{children}</>
}
