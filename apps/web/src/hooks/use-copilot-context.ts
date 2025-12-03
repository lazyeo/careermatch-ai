import { useEffect } from 'react'
import { useAssistantStore } from '@/stores/assistant-store'
import type { PromptContext } from '@/lib/ai/prompts/types'

export function useCopilotContext(context: Partial<PromptContext>) {
    const updateContext = useAssistantStore((state) => state.updateContext)

    useEffect(() => {
        // Update context when the component mounts or context changes
        updateContext(context)

        // Optional: Clear context on unmount? 
        // Usually we want to keep it until the next page overwrites it, 
        // or we might want to clear specific fields.
        // For now, we'll leave it persistent as the user might want to ask about the previous page.
    }, [context, updateContext])
}
