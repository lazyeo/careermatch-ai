'use client'

import { AssistantChat } from '@/components/assistant/AssistantChat'

export default function AssistantPage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <main className="flex w-full flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl flex-1 flex-col overflow-hidden rounded-lg border border-line-2 bg-surface shadow-soft">
          <div className="border-b border-line px-5 py-4">
            <p className="cm-eyebrow">AI Copilot</p>
            <h1 className="font-display text-xl font-semibold text-ink">AI Career Assistant</h1>
            <p className="mt-1 text-sm text-ink-3">
              Your personal AI agent for job search and career advice
            </p>
          </div>
          <AssistantChat />
        </div>
      </main>
    </div>
  )
}
