import { logger, task } from '@trigger.dev/sdk/v3'

import { getSupabaseAdminClient } from '../../apps/web/src/lib/supabase-admin'
import {
  processAutomaticJobAnalysisTask,
  type AutomaticJobAnalysisPayload,
} from '../../apps/web/src/lib/jobs/run-job-analysis'

async function runAutomaticAnalysis(payload: AutomaticJobAnalysisPayload) {
  logger.log('Starting automatic job analysis task', payload)

  const supabase = getSupabaseAdminClient()
  const result = await processAutomaticJobAnalysisTask(supabase, payload)

  logger.log('Automatic job analysis task completed', result)
  return result
}

export const analyzeSavedJobTask = task({
  id: 'analyze-saved-job',
  maxDuration: 1800,
  run: runAutomaticAnalysis,
})

export const automaticJobAnalysisTask = task({
  id: 'automatic-job-analysis',
  maxDuration: 1800,
  run: runAutomaticAnalysis,
})
