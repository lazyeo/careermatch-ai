import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { parseResumeContent, extractFileContent } from '@careermatch/resume-parser'
import type { ResumeFileType } from '@careermatch/shared'

// 允许的文件类型和MIME类型映射
const ALLOWED_TYPES: Record<string, ResumeFileType> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * POST /api/resume-upload
 * 上传简历文件并进行AI解析
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 解析multipart表单数据
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // 验证文件类型
    const fileType = ALLOWED_TYPES[file.type]
    if (!fileType) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported: PDF, Word, TXT' },
        { status: 400 }
      )
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 10MB' },
        { status: 400 }
      )
    }

    // 读取文件内容
    const buffer = Buffer.from(await file.arrayBuffer())

    // 生成存储路径
    const timestamp = Date.now()
    const storagePath = `${user.id}/${timestamp}_${file.name}`

    // 创建上传记录
    const { data: uploadRecord, error: insertError } = await supabase
      .from('resume_uploads')
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_type: fileType,
        file_size: file.size,
        storage_path: storagePath,
        status: 'processing',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating upload record:', insertError)
      return NextResponse.json(
        { error: 'Failed to create upload record' },
        { status: 500 }
      )
    }

    // 上传文件到Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('resume-uploads')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (storageError) {
      console.error('Error uploading file:', storageError)
      // 更新状态为失败
      await supabase
        .from('resume_uploads')
        .update({
          status: 'failed',
          error_message: 'Failed to upload file to storage',
        })
        .eq('id', uploadRecord.id)

      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // 提取文件内容
    let textContent: string
    try {
      textContent = await extractFileContent(buffer, fileType)
      console.log(`📄 Extracted ${textContent.length} characters from ${fileType}`)
    } catch (extractError) {
      console.error('Error extracting file content:', extractError)
      await supabase
        .from('resume_uploads')
        .update({
          status: 'failed',
          error_message: 'Failed to extract text from file',
        })
        .eq('id', uploadRecord.id)

      return NextResponse.json(
        { error: 'Failed to extract text from file' },
        { status: 500 }
      )
    }

    if (!textContent.trim()) {
      await supabase
        .from('resume_uploads')
        .update({
          status: 'failed',
          error_message: 'No text content found in file',
        })
        .eq('id', uploadRecord.id)

      return NextResponse.json(
        { error: 'No text content found in file' },
        { status: 400 }
      )
    }

    // 使用AI解析简历
    try {
      const parsedData = await parseResumeContent(textContent)

      // 更新记录为完成状态
      const { data: updatedRecord, error: updateError } = await supabase
        .from('resume_uploads')
        .update({
          status: 'completed',
          parsed_data: parsedData,
          ai_provider: 'claude',
          ai_model: 'claude-sonnet-4-5-20250929',
          processed_at: new Date().toISOString(),
        })
        .eq('id', uploadRecord.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating upload record:', updateError)
        return NextResponse.json(
          { error: 'Failed to save parsed data' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        id: updatedRecord.id,
        status: 'completed',
        parsed_data: parsedData,
        file_name: file.name,
      }, { status: 201 })
    } catch (parseError) {
      console.error('❌ Error parsing resume:', parseError)
      console.error('❌ Parse error stack:', (parseError as Error)?.stack)

      const errorMessage = (parseError as Error)?.message || 'AI parsing failed'
      const isConfigError = errorMessage.includes('API_KEY') || errorMessage.includes('not configured')

      await supabase
        .from('resume_uploads')
        .update({
          status: 'failed',
          error_message: errorMessage,
        })
        .eq('id', uploadRecord.id)

      return NextResponse.json(
        {
          error: isConfigError
            ? 'AI service not configured. Please contact administrator.'
            : 'Failed to parse resume content',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in POST /api/resume-upload:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/resume-upload
 * 获取用户的上传记录列表
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: uploads, error } = await supabase
      .from('resume_uploads')
      .select('id, file_name, file_type, file_size, status, created_at, processed_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching upload records:', error)
      return NextResponse.json(
        { error: 'Failed to fetch upload records' },
        { status: 500 }
      )
    }

    return NextResponse.json(uploads)
  } catch (error) {
    console.error('Error in GET /api/resume-upload:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
