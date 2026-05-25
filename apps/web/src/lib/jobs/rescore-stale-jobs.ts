import type { SupabaseClient } from '@supabase/supabase-js'

import { enqueueAutomaticJobAnalysis } from './enqueue-job-analysis'

type DbClient = SupabaseClient

export type StaleJobForRescore = {
  id: string
  user_id: string
}

export type EnqueueStaleJobAnalysesResult = {
  total: number
  enqueued: number
  failed: number
  errors: Array<{ jobId: string; error: string }>
}

export async function enqueueStaleJobAnalyses({
  jobs,
  enqueueJobAnalysis,
}: {
  jobs: StaleJobForRescore[]
  enqueueJobAnalysis: (job: { userId: string; jobId: string }) => Promise<void>
}): Promise<EnqueueStaleJobAnalysesResult> {
  const result: EnqueueStaleJobAnalysesResult = {
    total: jobs.length,
    enqueued: 0,
    failed: 0,
    errors: [],
  }

  for (const job of jobs) {
    try {
      await enqueueJobAnalysis({ userId: job.user_id, jobId: job.id })
      result.enqueued += 1
    } catch (error) {
      result.failed += 1
      result.errors.push({
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return result
}

export async function findStaleJobsForRescore(
  supabase: DbClient,
  {
    staleBefore,
    limit = 50,
  }: {
    staleBefore: Date
    limit?: number
  }
): Promise<StaleJobForRescore[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('id, user_id')
    .eq('status', 'saved')
    .or(`last_analyzed_at.is.null,last_analyzed_at.lt.${staleBefore.toISOString()}`)
    .order('last_analyzed_at', { ascending: true, nullsFirst: true })
    .limit(limit)

  if (error) {
    throw new Error(error.message || 'Failed to find stale jobs for rescore')
  }

  return data || []
}

export async function rescoreStaleJobs({
  supabase,
  triggerAnalysisTask,
  staleBefore = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  limit,
}: {
  supabase: DbClient
  triggerAnalysisTask: Parameters<typeof enqueueAutomaticJobAnalysis>[0]['triggerAnalysisTask']
  staleBefore?: Date
  limit?: number
}): Promise<EnqueueStaleJobAnalysesResult> {
  const jobs = await findStaleJobsForRescore(supabase, { staleBefore, limit })

  return enqueueStaleJobAnalyses({
    jobs,
    enqueueJobAnalysis: async ({ userId, jobId }) => {
      await enqueueAutomaticJobAnalysis({
        supabase,
        userId,
        jobId,
        source: 'manual_retry',
        triggerAnalysisTask,
      })
    },
  })
}
