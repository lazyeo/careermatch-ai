type InsertSingleResult<T> = Promise<{ data: T | null; error: { message: string } | null }>

type ProcessingTaskInsertRecord = {
  user_id: string
  job_id: string
  resume_id: string | null
  status: 'pending'
  current_step: 'queued'
  steps_completed: []
}

type ProcessingTaskRow = ProcessingTaskInsertRecord & {
  id: string
}

type SupabaseLike = {
  from(table: 'processing_tasks'): {
    insert(payload: ProcessingTaskInsertRecord): {
      select(): {
        single(): InsertSingleResult<ProcessingTaskRow>
      }
    }
    update(payload: Record<string, unknown>): {
      eq(column: string, value: string): unknown
    }
  }
}

export type AutomaticJobAnalysisSource =
  | 'job_create'
  | 'job_import'
  | 'job_rescrape'
  | 'manual_retry'
  | 'agent_save_job'
  | 'agent_batch_import'

export type EnqueueAutomaticJobAnalysisParams = {
  supabase: SupabaseLike
  userId: string
  jobId: string
  resumeId?: string | null
  source: AutomaticJobAnalysisSource
  triggerAnalysisTask: (payload: {
    taskId: string
    userId: string
    jobId: string
    resumeId: string | null
    source: AutomaticJobAnalysisSource
  }) => Promise<void>
}

export type EnqueueAutomaticJobAnalysisResult = {
  taskId: string
  status: 'pending'
}

export function buildAutomaticAnalysisTaskPayload(
  params: Pick<EnqueueAutomaticJobAnalysisParams, 'userId' | 'jobId' | 'resumeId'>
): ProcessingTaskInsertRecord {
  return {
    user_id: params.userId,
    job_id: params.jobId,
    resume_id: params.resumeId ?? null,
    status: 'pending',
    current_step: 'queued',
    steps_completed: [],
  }
}

export async function enqueueAutomaticJobAnalysis({
  supabase,
  userId,
  jobId,
  resumeId,
  source,
  triggerAnalysisTask,
}: EnqueueAutomaticJobAnalysisParams): Promise<EnqueueAutomaticJobAnalysisResult> {
  const insertPayload = buildAutomaticAnalysisTaskPayload({
    userId,
    jobId,
    resumeId,
  })

  const { data: task, error } = await supabase
    .from('processing_tasks')
    .insert(insertPayload)
    .select()
    .single()

  if (error || !task) {
    throw new Error(error?.message || 'Failed to create processing task')
  }

  try {
    await triggerAnalysisTask({
      taskId: task.id,
      userId,
      jobId,
      resumeId: resumeId ?? null,
      source,
    })
  } catch (triggerError) {
    await supabase
      .from('processing_tasks')
      .update({
        status: 'failed',
        current_step: 'failed',
        error:
          triggerError instanceof Error
            ? triggerError.message
            : 'Failed to dispatch automatic job analysis',
        completed_at: new Date().toISOString(),
      })
      .eq('id', task.id)

    throw triggerError
  }

  return {
    taskId: task.id,
    status: 'pending',
  }
}
