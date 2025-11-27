/**
 * AI 助手状态管理
 *
 * 使用 Zustand 管理 AI 助手侧栏的全局状态
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  PromptContext,
  AssistantMessage,
  AssistantSession,
  AgentAction,
  IntentType,
} from '@/lib/ai/prompts/types'

// ============================================
// 状态类型定义
// ============================================

export interface AssistantState {
  // UI 状态
  isOpen: boolean
  isMinimized: boolean

  // 会话状态
  currentSession: AssistantSession | null
  sessions: AssistantSession[]

  // 加载状态
  isLoading: boolean
  isStreaming: boolean
  streamingContent: string

  // 上下文状态
  currentContext: Partial<PromptContext> | null

  // 错误状态
  error: string | null
}

export interface AssistantActions {
  // UI 操作
  toggle: () => void
  open: () => void
  close: () => void
  minimize: () => void
  maximize: () => void

  // 会话操作
  startNewSession: (initialContext?: Partial<PromptContext>) => void
  loadSession: (sessionId: string) => void
  setCurrentSession: (session: AssistantSession | null) => void
  setSessions: (sessions: AssistantSession[]) => void
  archiveSession: (sessionId: string) => void

  // 消息操作
  addMessage: (message: Omit<AssistantMessage, 'id' | 'createdAt'>) => void
  updateLastMessage: (content: string) => void
  setMessages: (messages: AssistantMessage[]) => void

  // 流式响应
  setStreaming: (streaming: boolean) => void
  appendStreamContent: (content: string) => void
  clearStreamContent: () => void
  finalizeStream: (
    actions?: AgentAction[],
    suggestions?: string[],
    intent?: IntentType
  ) => void

  // 加载状态
  setLoading: (loading: boolean) => void

  // 上下文操作
  updateContext: (context: Partial<PromptContext>) => void
  clearContext: () => void

  // 错误处理
  setError: (error: string | null) => void
  clearError: () => void

  // 重置
  reset: () => void
}

export type AssistantStore = AssistantState & AssistantActions

// ============================================
// 初始状态
// ============================================

const initialState: AssistantState = {
  isOpen: false,
  isMinimized: false,
  currentSession: null,
  sessions: [],
  isLoading: false,
  isStreaming: false,
  streamingContent: '',
  currentContext: null,
  error: null,
}

// ============================================
// 辅助函数
// ============================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

// ============================================
// Store 创建
// ============================================

export const useAssistantStore = create<AssistantStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ============================================
      // UI 操作
      // ============================================

      toggle: () => {
        const { isOpen, isMinimized } = get()
        if (isMinimized) {
          set({ isMinimized: false })
        } else {
          set({ isOpen: !isOpen })
        }
      },

      open: () => set({ isOpen: true, isMinimized: false }),

      close: () => set({ isOpen: false }),

      minimize: () => set({ isMinimized: true }),

      maximize: () => set({ isMinimized: false }),

      // ============================================
      // 会话操作
      // ============================================

      startNewSession: (initialContext) => {
        const sessionId = generateId()
        const now = getCurrentTimestamp()

        const newSession: AssistantSession = {
          id: sessionId,
          userId: '', // 将在服务端设置
          title: undefined,
          status: 'active',
          initialContext: initialContext || undefined,
          currentContext: initialContext || undefined,
          messages: [],
          createdAt: now,
          updatedAt: now,
        }

        set((state) => ({
          currentSession: newSession,
          sessions: [newSession, ...state.sessions],
          error: null,
        }))
      },

      loadSession: (sessionId) => {
        const { sessions } = get()
        const session = sessions.find((s) => s.id === sessionId)
        if (session) {
          set({ currentSession: session, error: null })
        }
      },

      setCurrentSession: (session) => set({ currentSession: session }),

      setSessions: (sessions) => set({ sessions }),

      archiveSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, status: 'archived' as const } : s
          ),
          currentSession:
            state.currentSession?.id === sessionId
              ? { ...state.currentSession, status: 'archived' as const }
              : state.currentSession,
        }))
      },

      // ============================================
      // 消息操作
      // ============================================

      addMessage: (message) => {
        const messageId = generateId()
        const now = getCurrentTimestamp()
        const { currentSession } = get()

        if (!currentSession) {
          console.warn('No active session to add message to')
          return
        }

        const newMessage: AssistantMessage = {
          ...message,
          id: messageId,
          createdAt: now,
        }

        set((state) => {
          if (!state.currentSession) return state

          const updatedSession: AssistantSession = {
            ...state.currentSession,
            messages: [...state.currentSession.messages, newMessage],
            updatedAt: now,
            lastMessageAt: now,
          }

          return {
            currentSession: updatedSession,
            sessions: state.sessions.map((s) =>
              s.id === updatedSession.id ? updatedSession : s
            ),
          }
        })
      },

      updateLastMessage: (content) => {
        set((state) => {
          if (!state.currentSession || state.currentSession.messages.length === 0) {
            return state
          }

          const messages = [...state.currentSession.messages]
          const lastIndex = messages.length - 1
          messages[lastIndex] = {
            ...messages[lastIndex],
            content,
          }

          const updatedSession: AssistantSession = {
            ...state.currentSession,
            messages,
            updatedAt: getCurrentTimestamp(),
          }

          return {
            currentSession: updatedSession,
            sessions: state.sessions.map((s) =>
              s.id === updatedSession.id ? updatedSession : s
            ),
          }
        })
      },

      setMessages: (messages) => {
        set((state) => {
          if (!state.currentSession) return state

          const updatedSession: AssistantSession = {
            ...state.currentSession,
            messages,
            updatedAt: getCurrentTimestamp(),
          }

          return {
            currentSession: updatedSession,
            sessions: state.sessions.map((s) =>
              s.id === updatedSession.id ? updatedSession : s
            ),
          }
        })
      },

      // ============================================
      // 流式响应
      // ============================================

      setStreaming: (streaming) => set({ isStreaming: streaming }),

      appendStreamContent: (content) => {
        set((state) => ({
          streamingContent: state.streamingContent + content,
        }))
      },

      clearStreamContent: () => set({ streamingContent: '' }),

      finalizeStream: (actions, suggestions, intent) => {
        const { streamingContent, currentSession } = get()

        if (!currentSession) return

        // 添加最终消息
        const messageId = generateId()
        const now = getCurrentTimestamp()

        const finalMessage: AssistantMessage = {
          id: messageId,
          sessionId: currentSession.id,
          role: 'assistant',
          content: streamingContent,
          metadata: {
            intent,
            actions,
            suggestions,
          },
          createdAt: now,
        }

        set((state) => {
          if (!state.currentSession) return state

          const updatedSession: AssistantSession = {
            ...state.currentSession,
            messages: [...state.currentSession.messages, finalMessage],
            updatedAt: now,
            lastMessageAt: now,
          }

          return {
            currentSession: updatedSession,
            sessions: state.sessions.map((s) =>
              s.id === updatedSession.id ? updatedSession : s
            ),
            isStreaming: false,
            streamingContent: '',
          }
        })
      },

      // ============================================
      // 加载状态
      // ============================================

      setLoading: (loading) => set({ isLoading: loading }),

      // ============================================
      // 上下文操作
      // ============================================

      updateContext: (context) => {
        set((state) => ({
          currentContext: { ...state.currentContext, ...context },
        }))

        // 同时更新当前会话的上下文
        const { currentSession } = get()
        if (currentSession) {
          set((state) => {
            if (!state.currentSession) return state

            const updatedSession: AssistantSession = {
              ...state.currentSession,
              currentContext: { ...state.currentSession.currentContext, ...context },
            }

            return {
              currentSession: updatedSession,
              sessions: state.sessions.map((s) =>
                s.id === updatedSession.id ? updatedSession : s
              ),
            }
          })
        }
      },

      clearContext: () => set({ currentContext: null }),

      // ============================================
      // 错误处理
      // ============================================

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      // ============================================
      // 重置
      // ============================================

      reset: () => set(initialState),
    }),
    {
      name: 'careermatch-assistant',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // 只持久化部分状态
        isOpen: state.isOpen,
        currentSession: state.currentSession,
        sessions: state.sessions.slice(0, 10), // 只保存最近10个会话
      }),
    }
  )
)

// ============================================
// 选择器 Hooks
// ============================================

export const useAssistantIsOpen = () => useAssistantStore((state) => state.isOpen)
export const useAssistantIsMinimized = () => useAssistantStore((state) => state.isMinimized)
export const useAssistantIsLoading = () => useAssistantStore((state) => state.isLoading)
export const useAssistantIsStreaming = () => useAssistantStore((state) => state.isStreaming)
export const useAssistantCurrentSession = () =>
  useAssistantStore((state) => state.currentSession)
export const useAssistantMessages = () =>
  useAssistantStore((state) => state.currentSession?.messages || [])
export const useAssistantError = () => useAssistantStore((state) => state.error)
export const useAssistantContext = () => useAssistantStore((state) => state.currentContext)
export const useAssistantStreamingContent = () =>
  useAssistantStore((state) => state.streamingContent)
