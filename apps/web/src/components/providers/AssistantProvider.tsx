'use client'

/**
 * AI 助手 Provider
 *
 * 提供上下文感知和键盘快捷键支持
 */

import { useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useAssistantStore } from '@/stores/assistant-store'
import { createPageContext } from '@/lib/ai/prompts/builders/context-builder'

interface AssistantProviderProps {
  children: React.ReactNode
}

export function AssistantProvider({ children }: AssistantProviderProps) {
  const pathname = usePathname()
  const { updateContext, toggle, isOpen } = useAssistantStore()

  // 监听路径变化，更新上下文
  useEffect(() => {
    const pageContext = createPageContext(pathname)
    updateContext({ currentPage: pageContext })
  }, [pathname, updateContext])

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
