/**
 * GET /api/tasks/[id]/status
 * 
 * 查询处理任务的状态
 * 返回任务的当前状态、进度和结果
 */

import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: taskId } = await params
    const supabase = await createClient()

    // 验证用户
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 查询任务状态
    const { data: task, error: taskError } = await supabase
      .from('processing_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // 返回完整的任务信息
    return NextResponse.json(task)
  } catch (error) {
    console.error('Error in GET /api/tasks/[id]/status:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
