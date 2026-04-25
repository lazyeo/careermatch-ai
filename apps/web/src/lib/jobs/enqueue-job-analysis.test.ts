import { test } from 'node:test'
import * as assert from 'node:assert/strict'

import { enqueueAutomaticJobAnalysis } from './enqueue-job-analysis'

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
                      id: 'task-123',
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

test('enqueueAutomaticJobAnalysis creates a queued processing task and triggers analysis', async () => {
  const { supabase, inserts, updates } = createMockSupabase()
  const triggerCalls: Array<Record<string, unknown>> = []

  const task = await enqueueAutomaticJobAnalysis({
    supabase,
    userId: 'user-1',
    jobId: 'job-1',
    source: 'job_create',
    triggerAnalysisTask: async (payload) => {
      triggerCalls.push(payload)
    },
  })

  assert.equal(task.taskId, 'task-123')
  assert.equal(task.status, 'pending')
  assert.equal(inserts.length, 1)
  assert.deepEqual(inserts[0], {
    table: 'processing_tasks',
    payload: {
      user_id: 'user-1',
      job_id: 'job-1',
      resume_id: null,
      status: 'pending',
      current_step: 'queued',
      steps_completed: [],
    },
  })
  assert.deepEqual(triggerCalls, [
    {
      taskId: 'task-123',
      userId: 'user-1',
      jobId: 'job-1',
      resumeId: null,
      source: 'job_create',
    },
  ])
  assert.equal(updates.length, 0)
})

test('enqueueAutomaticJobAnalysis marks the task as failed when trigger dispatch fails', async () => {
  const { supabase, updates } = createMockSupabase()

  await assert.rejects(
    () =>
      enqueueAutomaticJobAnalysis({
        supabase,
        userId: 'user-2',
        jobId: 'job-2',
        source: 'job_import',
        resumeId: 'resume-9',
        triggerAnalysisTask: async () => {
          throw new Error('Trigger is down')
        },
      }),
    /Trigger is down/
  )

  assert.equal(updates.length, 1)
  assert.equal(updates[0].table, 'processing_tasks')
  assert.equal(updates[0].payload.status, 'failed')
  assert.equal(updates[0].payload.current_step, 'failed')
  assert.equal(updates[0].payload.error, 'Trigger is down')
  assert.equal(typeof updates[0].payload.completed_at, 'string')
  assert.deepEqual(updates[0].eqCalls, [{ column: 'id', value: 'task-123' }])
})
