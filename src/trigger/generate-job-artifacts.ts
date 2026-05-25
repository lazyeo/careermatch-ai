import { logger, task } from '@trigger.dev/sdk/v3'

import { getSupabaseAdminClient } from '../../apps/web/src/lib/supabase-admin'
import { generateJobArtifacts } from '../../apps/web/src/server/job-processing/process-job-task'

export type GenerateJobArtifactsPayload = {
  jobId: string
  userId: string
  analysisSessionId: string
}

export const generateJobArtifactsTask = task({
  id: 'generate-job-artifacts',
  maxDuration: 1800,
  run: async (payload: GenerateJobArtifactsPayload) => {
    logger.log('Starting generate job artifacts task', payload)

    const result = await generateJobArtifacts(getSupabaseAdminClient(), payload)

    logger.log('Generate job artifacts task completed', result)
    return result
  },
})
