'use client'

import { AssistantChat } from '@/components/assistant/AssistantChat'


export default function AssistantPage() {
    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* AppHeader removed */}
            <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4">
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100 bg-white">
                        <h1 className="text-lg font-semibold text-gray-900">AI Career Assistant</h1>
                        <p className="text-sm text-gray-500">
                            Your personal AI agent for job search and career advice
                        </p>
                    </div>
                    <AssistantChat />
                </div>
            </main>
        </div>
    )
}
