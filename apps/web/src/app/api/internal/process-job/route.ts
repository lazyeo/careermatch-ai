/**
 * POST /api/internal/process-job
 *
 * Internal background processing entrypoint. Durable execution is owned by
 * Trigger.dev; this route validates the internal caller and delegates the
 * actual pipeline to server-side job-processing modules.
 */

import { NextRequest, NextResponse } from 'next/server'

import { getSupabaseAdminClient } from '@/lib/supabase-admin'
import {
  markProcessJobTaskFailed,
  processJobTask,
  type ProcessJobMode,
} from '@/server/job-processing/process-job-task'

export async function POST(request: NextRequest) {
  let taskId: string | null = null

  try {
    const internalSecret =
      process.env.INTERNAL_PROCESS_JOB_SECRET || process.env.TRIGGER_SECRET_KEY

    if (!internalSecret) {
      return NextResponse.json(
        { error: 'Internal processing secret is not configured' },
        { status: 500 }
      )
    }

    if (request.headers.get('x-internal-job-secret') !== internalSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    taskId = body.taskId as string

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId is required' },
        { status: 400 }
      )
    }

    const mode = (body.mode || 'full_artifacts') as ProcessJobMode
    const result = await processJobTask(getSupabaseAdminClient(), { taskId, mode })

    return NextResponse.json({
      success: true,
      taskId,
      result,
    })
  } catch (error) {
    console.error('Error in background processing:', error)

    if (taskId) {
      await markProcessJobTaskFailed(getSupabaseAdminClient(), taskId, error)
    }

    return NextResponse.json(
      {
        error: 'Background processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
