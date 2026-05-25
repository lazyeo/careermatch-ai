import { test } from 'node:test'
import * as assert from 'node:assert/strict'

import { enqueueStaleJobAnalyses } from './rescore-stale-jobs'

test('enqueueStaleJobAnalyses re-enqueues every stale job and reports counts', async () => {
  const enqueued: Array<{ userId: string; jobId: string }> = []

  const result = await enqueueStaleJobAnalyses({
    jobs: [
      { id: 'job-1', user_id: 'user-1' },
      { id: 'job-2', user_id: 'user-2' },
    ],
    enqueueJobAnalysis: async ({ userId, jobId }) => {
      enqueued.push({ userId, jobId })
    },
  })

  assert.deepEqual(enqueued, [
    { userId: 'user-1', jobId: 'job-1' },
    { userId: 'user-2', jobId: 'job-2' },
  ])
  assert.equal(result.total, 2)
  assert.equal(result.enqueued, 2)
  assert.equal(result.failed, 0)
})

test('enqueueStaleJobAnalyses continues after a single enqueue failure', async () => {
  const result = await enqueueStaleJobAnalyses({
    jobs: [
      { id: 'job-1', user_id: 'user-1' },
      { id: 'job-2', user_id: 'user-2' },
    ],
    enqueueJobAnalysis: async ({ jobId }) => {
      if (jobId === 'job-1') {
        throw new Error('dispatch failed')
      }
    },
  })

  assert.equal(result.total, 2)
  assert.equal(result.enqueued, 1)
  assert.equal(result.failed, 1)
  assert.deepEqual(result.errors, [{ jobId: 'job-1', error: 'dispatch failed' }])
})
