import { logger, task } from '@trigger.dev/sdk/v3'

import type { ProcessJobPipelinePayload } from '../../apps/web/src/lib/jobs/enqueue-process-job-pipeline'

export const processJobPipelineTask = task({
  id: 'process-job-pipeline',
  maxDuration: 3600,
  run: async (payload: ProcessJobPipelinePayload) => {
    logger.log('Starting process job pipeline task', payload)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL
    const internalSecret =
      process.env.INTERNAL_PROCESS_JOB_SECRET || process.env.TRIGGER_SECRET_KEY

    if (!appUrl) {
      throw new Error('NEXT_PUBLIC_APP_URL or APP_URL is required to run process-job-pipeline')
    }

    if (!internalSecret) {
      throw new Error(
        'INTERNAL_PROCESS_JOB_SECRET or TRIGGER_SECRET_KEY is required to run process-job-pipeline'
      )
    }

    const response = await fetch(`${appUrl.replace(/\/$/, '')}/api/internal/process-job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-job-secret': internalSecret,
      },
      body: JSON.stringify({ taskId: payload.taskId, mode: payload.mode }),
    })

    const responseBody = await response.text()
    if (!response.ok) {
      throw new Error(
        `process-job-pipeline failed with ${response.status}: ${responseBody || response.statusText}`
      )
    }

    const result = responseBody ? JSON.parse(responseBody) : null
    logger.log('Process job pipeline task completed', result)
    return result
  },
})
