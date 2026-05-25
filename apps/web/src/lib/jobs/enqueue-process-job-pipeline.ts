type InsertSingleResult<T> = PromiseLike<{ data: T | null; error: { message: string } | null }>

type ProcessingTaskInsertRecord = {
  user_id: string
  job_id: string
  resume_id: string | null
  status: 'pending'
  current_step: 'queued'
  steps_completed: []
}

type ProcessingTaskRow = {
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

export type ProcessJobPipelineMode = 'analysis_only' | 'full_artifacts'

export type ProcessJobPipelinePayload = {
  taskId: string
  userId: string
  jobId: string
  resumeId: string | null
  mode: ProcessJobPipelineMode
}

export type EnqueueProcessJobPipelineParams = {
  supabase: SupabaseLike
  userId: string
  jobId: string
  resumeId?: string | null
  mode: ProcessJobPipelineMode
  triggerPipelineTask: (payload: ProcessJobPipelinePayload) => Promise<void>
}

export type EnqueueProcessJobPipelineResult = {
  taskId: string
  status: 'pending'
}

export async function enqueueProcessJobPipeline({
  supabase,
  userId,
  jobId,
  resumeId,
  mode,
  triggerPipelineTask,
}: EnqueueProcessJobPipelineParams): Promise<EnqueueProcessJobPipelineResult> {
  const { data: task, error } = await supabase
    .from('processing_tasks')
    .insert({
      user_id: userId,
      job_id: jobId,
      resume_id: resumeId ?? null,
      status: 'pending',
      current_step: 'queued',
      steps_completed: [],
    })
    .select()
    .single()

  if (error || !task) {
    throw new Error(error?.message || 'Failed to create processing task')
  }

  try {
    await triggerPipelineTask({
      taskId: task.id,
      userId,
      jobId,
      resumeId: resumeId ?? null,
      mode,
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
            : 'Failed to dispatch process job pipeline',
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
