'use client'

import { useState, useEffect, ReactNode } from 'react'
import { Card, CardContent } from '@careermatch/ui'
import { FileText, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface JobDetailTabsProps {
    original: ReactNode
    aiInsights: ReactNode
}

type TabType = 'original' | 'ai-insights'

export function JobDetailTabs({ original, aiInsights }: JobDetailTabsProps) {
    const [activeTab, setActiveTab] = useState<TabType>('original')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const tabs: { id: TabType; label: string; icon: ReactNode }[] = [
        {
            id: 'original',
            label: '原始招聘文案',
            icon: mounted ? <FileText className="w-4 h-4" /> : <div className="w-4 h-4" />
        },
        {
            id: 'ai-insights',
            label: 'AI 智能助手',
            icon: mounted ? <Sparkles className="w-4 h-4" /> : <div className="w-4 h-4" />
        },
    ]

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm gap-2
                ${activeTab === tab.id
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }
              `}
                        >
                            <span className={`
                ${activeTab === tab.id ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'}
              `}>
                                {tab.icon}
                            </span>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'original' && (
                    <div className="animate-in fade-in duration-300">
                        <Card>
                            <CardContent className="py-6">
                                <div className="prose prose-sm max-w-none text-gray-700 bg-gray-50 p-4 rounded-lg">
                                    {typeof original === 'string' ? (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {original}
                                        </ReactMarkdown>
                                    ) : (
                                        original
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'ai-insights' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {aiInsights}
                    </div>
                )}
            </div>
        </div>
    )
}
