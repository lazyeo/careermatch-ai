'use client'

import { AssistantChat } from '@/components/assistant/AssistantChat'
import { useUIStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'
import { Button } from '@careermatch/ui'
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react'

import { useTranslations } from 'next-intl'

export function CopilotPanel() {
    const { isCopilotOpen, toggleCopilot } = useUIStore()
    const t = useTranslations('copilot')

    return (
        <>
            {/* Collapsed State Toggle Button (Visible when closed) */}
            {!isCopilotOpen && (
                <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleCopilot}
                        className="flex h-12 w-8 items-center justify-center rounded-l-lg rounded-r-none border-y border-l border-line bg-surface p-0 shadow-strong hover:bg-surface-2"
                        title={t('expand')}
                    >
                        <ChevronLeft className="h-4 w-4 text-ink-2" />
                    </Button>
                </div>
            )}

            {/* Main Panel */}
            <div
                className={cn(
                    "fixed inset-y-0 right-0 z-30 flex w-[min(400px,100vw)] transform flex-col border-l border-line bg-surface shadow-warm transition-transform duration-300 ease-in-out",
                    isCopilotOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-line bg-paper-tint px-4 py-3">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brick-soft">
                            <MessageSquare className="h-4 w-4 text-brick" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-ink">{t('title')}</h3>
                            <p className="text-xs text-ink-3">{t('subtitle')}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleCopilot}
                        className="h-8 w-8 rounded-full p-0"
                        title={t('close')}
                    >
                        <ChevronRight className="h-4 w-4 text-ink-3" />
                    </Button>
                </div>

                {/* Chat Content */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <AssistantChat />
                </div>
            </div>
        </>
    )
}
