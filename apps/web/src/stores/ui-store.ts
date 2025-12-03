import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
    isSidebarOpen: boolean
    isCopilotOpen: boolean
    toggleSidebar: () => void
    toggleCopilot: () => void
    setSidebarOpen: (open: boolean) => void
    setCopilotOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            isSidebarOpen: true,
            isCopilotOpen: true,
            toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
            toggleCopilot: () => set((state) => ({ isCopilotOpen: !state.isCopilotOpen })),
            setSidebarOpen: (open) => set({ isSidebarOpen: open }),
            setCopilotOpen: (open) => set({ isCopilotOpen: open }),
        }),
        {
            name: 'ui-storage',
        }
    )
)
