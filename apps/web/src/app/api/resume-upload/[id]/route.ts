import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/resume-upload/[id]
 * 获取单个上传记录及其解析结果
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: upload, error } = await supabase
      .from('resume_uploads')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Upload record not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching upload record:', error)
      return NextResponse.json(
        { error: 'Failed to fetch upload record' },
        { status: 500 }
      )
    }

    return NextResponse.json(upload)
  } catch (error) {
    console.error('Error in GET /api/resume-upload/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/resume-upload/[id]
 * 删除上传记录和文件
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 获取记录以获取存储路径
    const { data: upload, error: fetchError } = await supabase
      .from('resume_uploads')
      .select('storage_path')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !upload) {
      return NextResponse.json(
        { error: 'Upload record not found' },
        { status: 404 }
      )
    }

    // 从Storage删除文件
    if (upload.storage_path) {
      await supabase.storage
        .from('resume-uploads')
        .remove([upload.storage_path])
    }

    // 删除数据库记录
    const { error: deleteError } = await supabase
      .from('resume_uploads')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting upload record:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete upload record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/resume-upload/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
