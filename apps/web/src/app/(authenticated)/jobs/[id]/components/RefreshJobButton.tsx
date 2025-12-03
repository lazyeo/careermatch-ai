'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@careermatch/ui'

interface RefreshJobButtonProps {
    jobId: string
    label?: string
}

export function RefreshJobButton({ jobId, label = '刷新' }: RefreshJobButtonProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleRefresh = async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/jobs/${jobId}/rescrape`, {
                method: 'POST',
            })

            if (!response.ok) {
                throw new Error('Failed to refresh job')
            }

            router.refresh()
        } catch (error) {
            console.error('Error refreshing job:', error)
            alert('刷新失败，请稍后重试')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
            className="gap-2"
        >
            <svg
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
            </svg>
            {isLoading ? '更新中...' : label}
        </Button>
    )
}
