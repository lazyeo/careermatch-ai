'use client'

import { SidebarNavigation } from './SidebarNavigation'
import { CopilotPanel } from './CopilotPanel'
import { useUIStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
    children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const { isCopilotOpen } = useUIStore()

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Left Sidebar */}
            <SidebarNavigation />

            {/* Main Content Area */}
            <main
                className={cn(
                    "flex-1 overflow-y-auto transition-all duration-300 ease-in-out",
                    // Add right margin when copilot is open to prevent overlap
                    // assuming CopilotPanel is fixed width 400px
                    isCopilotOpen ? "mr-[400px]" : "mr-0"
                )}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {children}
                </div>
            </main>

            {/* Right Co-pilot Panel */}
            <CopilotPanel />
        </div>
    )
}
