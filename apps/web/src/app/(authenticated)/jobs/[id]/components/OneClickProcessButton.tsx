'use client'

import { useState } from 'react'
import { Button } from '@careermatch/ui'
import { ProcessingStatusCard } from '@/components/ProcessingStatusCard'
import { useProcessJob } from '@/hooks/useProcessJob'
import { Rocket, X } from 'lucide-react'

interface OneClickProcessButtonProps {
  jobId: string
  resumeId?: string
}

export function OneClickProcessButton({ jobId, resumeId }: OneClickProcessButtonProps) {
  const [showProcessing, setShowProcessing] = useState(false)
  const [taskId, setTaskId] = useState<string | null>(null)
  const processJob = useProcessJob()

  const handleStartProcessing = async () => {
    if (!resumeId) {
      alert('请先选择或创建一个简历')
      return
    }

    try {
      const result = await processJob.mutateAsync({ jobId, resumeId })
      setTaskId(result.taskId)
      setShowProcessing(true)
    } catch (error) {
      console.error('Failed to start processing:', error)
      alert(error instanceof Error ? error.message : '启动处理失败，请重试')
    }
  }

  const handleComplete = (result: unknown) => {
    console.log('Processing completed:', result)
    // Optionally refresh the page or show a success message
    setTimeout(() => {
      window.location.reload()
    }, 2000)
  }

  if (showProcessing && taskId) {
    return (
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            正在处理岗位申请
          </h3>
          <button
            onClick={() => setShowProcessing(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <ProcessingStatusCard taskId={taskId} onComplete={handleComplete} />
      </div>
    )
  }

  return (
    <Button
      variant="primary"
      onClick={handleStartProcessing}
      disabled={processJob.isPending || !resumeId}
      className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
    >
      <Rocket className="w-5 h-5" />
      🚀 一键处理
      {!resumeId && <span className="text-xs">(需要简历)</span>}
    </Button>
  )
}
