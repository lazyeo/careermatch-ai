'use client'

import { useQuery } from '@tanstack/react-query'
import { CheckCircle, Circle, Loader2, XCircle, AlertCircle } from 'lucide-react'
import { useEffect } from 'react'

interface ProcessingStatusCardProps {
  taskId: string
  onComplete?: (result: unknown) => void
}

interface TaskStep {
  id: string
  label: string
  status: 'pending' | 'running' | 'completed' | 'failed'
}

export function ProcessingStatusCard({ taskId, onComplete }: ProcessingStatusCardProps) {
  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}/status`)
      if (!res.ok) throw new Error('Failed to fetch task status')
      return res.json()
    },
    refetchInterval: (query) => {
      const data = query.state.data as { status?: string } | undefined
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false // stop polling
      }
      return 2000 // poll every 2s
    },
    enabled: !!taskId,
  })

  useEffect(() => {
    if (task?.status === 'completed' && onComplete) {
      onComplete(task.result)
    }
  }, [task?.status, task?.result, onComplete])

  const steps: TaskStep[] = [
    { id: 'analyze', label: '岗位分析', status: 'pending' },
    { id: 'generate_resume', label: '生成简历', status: 'pending' },
    { id: 'generate_cover_letter', label: '生成求职信', status: 'pending' },
  ]

  // Update step statuses based on current task progress
  if (task?.currentStep) {
    const stepOrder = ['analyze', 'generate_resume', 'generate_cover_letter']
    const currentIndex = stepOrder.indexOf(task.currentStep)
    
    steps.forEach((step, index) => {
      if (index < currentIndex) {
        step.status = 'completed'
      } else if (index === currentIndex) {
        step.status = task.status === 'failed' ? 'failed' : 'running'
      }
    })
  }

  if (task?.status === 'completed') {
    steps.forEach(step => {
      step.status = 'completed'
    })
  }

  const getStatusIcon = (status: TaskStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600" />
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600 dark:text-gray-300">加载中...</span>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center text-yellow-600">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>任务不存在</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          处理进度
        </h3>
        {task.status === 'failed' && (
          <div className="flex items-center text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
            <XCircle className="w-5 h-5 mr-2" />
            <span className="text-sm">{task.error || '处理失败，请重试'}</span>
          </div>
        )}
        {task.status === 'completed' && (
          <div className="flex items-center text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span className="text-sm">处理完成！</span>
          </div>
        )}
      </div>

      {/* Progress Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start">
            <div className="flex-shrink-0 mr-4">
              {getStatusIcon(step.status)}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${
                  step.status === 'completed' 
                    ? 'text-green-600 dark:text-green-400' 
                    : step.status === 'running'
                    ? 'text-blue-600 dark:text-blue-400'
                    : step.status === 'failed'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {step.label}
                </span>
                {step.status === 'running' && (
                  <span className="text-xs text-blue-500">进行中...</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`mt-2 h-8 w-0.5 ml-2.5 ${
                  step.status === 'completed' 
                    ? 'bg-green-300' 
                    : 'bg-gray-200 dark:bg-gray-700'
                }`} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>总体进度</span>
          <span>{Math.round((task.progress || 0) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(task.progress || 0) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
