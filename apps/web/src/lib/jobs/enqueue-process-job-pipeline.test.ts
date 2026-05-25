import { test } from 'node:test'
import * as assert from 'node:assert/strict'

import { enqueueProcessJobPipeline } from './enqueue-process-job-pipeline'

type RecordedInsert = {
  table: string
  payload: Record<string, unknown>
}

type RecordedUpdate = {
  table: string
  payload: Record<string, unknown>
  eqCalls: Array<{ column: string; value: string }>
}

function createMockSupabase() {
  const inserts: RecordedInsert[] = []
  const updates: RecordedUpdate[] = []

  const supabase = {
    from(table: string) {
      return {
        insert(payload: Record<string, unknown>) {
          inserts.push({ table, payload })

          return {
            select() {
              return {
                async single() {
                  return {
                    data: {
                      id: 'task-full-123',
                      ...payload,
                    },
                    error: null,
                  }
                },
              }
            },
          }
        },
        update(payload: Record<string, unknown>) {
          const updateCall: RecordedUpdate = {
            table,
            payload,
            eqCalls: [],
          }
          updates.push(updateCall)

          return {
            eq(column: string, value: string) {
              updateCall.eqCalls.push({ column, value })
              return this
            },
          }
        },
      }
    },
  }

  return { supabase, inserts, updates }
}

test('enqueueProcessJobPipeline creates a queued full-artifacts task and triggers Trigger.dev', async () => {
  const { supabase, inserts, updates } = createMockSupabase()
  const triggerCalls: Array<Record<string, unknown>> = []

  const task = await enqueueProcessJobPipeline({
    supabase,
    userId: 'user-1',
    jobId: 'job-1',
    resumeId: 'resume-1',
    mode: 'full_artifacts',
    triggerPipelineTask: async (payload) => {
      triggerCalls.push(payload)
    },
  })

  assert.equal(task.taskId, 'task-full-123')
  assert.equal(task.status, 'pending')
  assert.deepEqual(inserts, [
    {
      table: 'processing_tasks',
      payload: {
        user_id: 'user-1',
        job_id: 'job-1',
        resume_id: 'resume-1',
        status: 'pending',
        current_step: 'queued',
        steps_completed: [],
      },
    },
  ])
  assert.deepEqual(triggerCalls, [
    {
      taskId: 'task-full-123',
      userId: 'user-1',
      jobId: 'job-1',
      resumeId: 'resume-1',
      mode: 'full_artifacts',
    },
  ])
  assert.equal(updates.length, 0)
})

test('enqueueProcessJobPipeline marks the task failed when Trigger.dev dispatch fails', async () => {
  const { supabase, updates } = createMockSupabase()

  await assert.rejects(
    () =>
      enqueueProcessJobPipeline({
        supabase,
        userId: 'user-2',
        jobId: 'job-2',
        resumeId: null,
        mode: 'analysis_only',
        triggerPipelineTask: async () => {
          throw new Error('Trigger dispatch failed')
        },
      }),
    /Trigger dispatch failed/
  )

  assert.equal(updates.length, 1)
  assert.equal(updates[0].table, 'processing_tasks')
  assert.equal(updates[0].payload.status, 'failed')
  assert.equal(updates[0].payload.current_step, 'failed')
  assert.equal(updates[0].payload.error, 'Trigger dispatch failed')
  assert.equal(typeof updates[0].payload.completed_at, 'string')
  assert.deepEqual(updates[0].eqCalls, [{ column: 'id', value: 'task-full-123' }])
})
