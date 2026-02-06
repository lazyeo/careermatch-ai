import { useMutation } from '@tanstack/react-query'

interface ProcessJobParams {
  jobId: string
  resumeId: string
}

interface ProcessJobResponse {
  taskId: string
  status: string
  message?: string
}

export function useProcessJob() {
  return useMutation({
    mutationFn: async ({ jobId, resumeId }: ProcessJobParams): Promise<ProcessJobResponse> => {
      const res = await fetch(`/api/jobs/${jobId}/process-full`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId }),
      })
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to start processing' }))
        throw new Error(error.message || 'Failed to start processing')
      }
      
      return res.json()
    },
  })
}
