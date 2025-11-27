'use client'

/**
 * 全局 Providers 包装
 *
 * 统一管理所有 Context Providers
 */

import { AssistantProvider } from './AssistantProvider'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return <AssistantProvider>{children}</AssistantProvider>
}

export { AssistantProvider }
