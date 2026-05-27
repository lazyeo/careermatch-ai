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
        <div className="flex h-screen overflow-hidden bg-paper text-ink">
            <SidebarNavigation />

            <main
                className={cn(
                    "min-w-0 flex-1 overflow-y-auto pt-16 transition-all duration-300 ease-in-out md:pt-0",
                    isCopilotOpen ? "lg:mr-[400px]" : "mr-0"
                )}
            >
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    {children}
                </div>
            </main>

            <CopilotPanel />
        </div>
    )
}
