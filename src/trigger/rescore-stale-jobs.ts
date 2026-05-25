import { logger, schedules, tasks } from '@trigger.dev/sdk/v3'

import { getSupabaseAdminClient } from '../../apps/web/src/lib/supabase-admin'
import { rescoreStaleJobs } from '../../apps/web/src/lib/jobs/rescore-stale-jobs'

export const rescoreStaleJobsTask = schedules.task({
  id: 'rescore-stale-jobs',
  cron: {
    pattern: '0 3 * * *',
    timezone: 'Pacific/Auckland',
  },
  maxDuration: 1800,
  run: async () => {
    logger.log('Starting stale job rescore sweep')

    const supabase = getSupabaseAdminClient()
    const result = await rescoreStaleJobs({
      supabase,
      triggerAnalysisTask: async (payload) => {
        await tasks.trigger('analyze-saved-job', payload)
      },
    })

    logger.log('Completed stale job rescore sweep', result)
    return result
  },
})
