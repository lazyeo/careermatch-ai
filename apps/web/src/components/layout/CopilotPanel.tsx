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
                        className="h-12 w-8 rounded-l-xl rounded-r-none shadow-lg border-l border-y border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center p-0"
                        title={t('expand')}
                    >
                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </Button>
                </div>
            )}

            {/* Main Panel */}
            <div
                className={cn(
                    "fixed inset-y-0 right-0 z-30 w-[400px] bg-white border-l border-gray-200 shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col",
                    isCopilotOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                            <MessageSquare className="w-4 h-4 text-primary-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 text-sm">{t('title')}</h3>
                            <p className="text-xs text-gray-500">{t('subtitle')}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleCopilot}
                        className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                        title={t('close')}
                    >
                        <ChevronRight className="w-4 h-4 text-gray-500" />
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
