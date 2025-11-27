import { NextRequest, NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'
import { getCurrentUser, createClient } from '@/lib/supabase-server'
import { ResumePDFTemplate } from '@/components/ResumePDFTemplate'
import type { ResumeContent } from '@careermatch/shared'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户身份
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // 获取简历数据
    const { data: resume, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error || !resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      )
    }

    // 准备简历数据 - 处理 snake_case 和 camelCase 字段名兼容
    const rawContent = resume.content as Record<string, unknown>

    // Handle personalInfo field names
    const rawPersonalInfo = (rawContent.personalInfo || rawContent.personal_info || {}) as Record<string, unknown>
    const personalInfo = {
      fullName: (rawPersonalInfo.fullName || rawPersonalInfo.full_name || '') as string,
      email: (rawPersonalInfo.email || '') as string,
      phone: (rawPersonalInfo.phone || '') as string,
      location: (rawPersonalInfo.location || '') as string,
      linkedIn: (rawPersonalInfo.linkedIn || rawPersonalInfo.linkedin || '') as string,
      github: (rawPersonalInfo.github || '') as string,
    }

    const content: ResumeContent = {
      personalInfo,
      careerObjective: (rawContent.careerObjective || rawContent.career_objective || '') as string,
      skills: (rawContent.skills || []) as ResumeContent['skills'],
      workExperience: (rawContent.workExperience || rawContent.work_experience || []) as ResumeContent['workExperience'],
      projects: (rawContent.projects || []) as ResumeContent['projects'],
      education: (rawContent.education || []) as ResumeContent['education'],
      certifications: (rawContent.certifications || []) as ResumeContent['certifications'],
      interests: (rawContent.interests || []) as string[],
    }

    const resumeData = {
      title: resume.title,
      content,
    }

    // 生成PDF
    const stream = await renderToStream(
      ResumePDFTemplate({ resume: resumeData })
    )

    // 将stream转换为Buffer
    const chunks: Uint8Array[] = []
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    // 返回PDF文件
    const fileName = `${resume.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
