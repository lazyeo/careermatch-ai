'use client'

import { useState, useEffect, ReactNode } from 'react'
import { Card, CardContent } from '@careermatch/ui'
import { FileText, Layout, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface JobDetailTabsProps {
    details: ReactNode
    original: ReactNode
    analysis: ReactNode
}

type TabType = 'details' | 'original' | 'analysis'

export function JobDetailTabs({ details, original, analysis }: JobDetailTabsProps) {
    const [activeTab, setActiveTab] = useState<TabType>('details')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const tabs: { id: TabType; label: string; icon: ReactNode }[] = [
        {
            id: 'details',
            label: '职位详情',
            icon: mounted ? <Layout className="w-4 h-4" /> : <div className="w-4 h-4" />
        },
        {
            id: 'original',
            label: '原始招聘文案',
            icon: mounted ? <FileText className="w-4 h-4" /> : <div className="w-4 h-4" />
        },
        {
            id: 'analysis',
            label: 'AI 深度分析',
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
                {activeTab === 'details' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {details}
                    </div>
                )}

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

                {activeTab === 'analysis' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {analysis}
                    </div>
                )}
            </div>
        </div>
    )
}
