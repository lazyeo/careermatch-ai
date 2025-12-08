/**
 * Template Preview API
 * GET /api/templates/[id]/preview - 生成模板预览HTML
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { HTMLRenderer } from '@/lib/resume-renderers/html-renderer'
import type {
  ResumeTemplate,
  DatabaseResumeTemplate,
  TemplateConfig,
  ResumeContent,
} from '@careermatch/shared'

// 示例简历数据用于预览
const SAMPLE_RESUME_CONTENT: ResumeContent = {
  personalInfo: {
    fullName: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    linkedIn: 'linkedin.com/in/johnsmith',
  },
  careerObjective:
    'Experienced software engineer with 5+ years of expertise in building scalable web applications. Passionate about clean code, user experience, and continuous learning. Seeking a senior engineering role where I can contribute to innovative products and mentor junior developers.',
  skills: [
    { name: 'TypeScript' },
    { name: 'React' },
    { name: 'Node.js' },
    { name: 'PostgreSQL' },
    { name: 'AWS' },
    { name: 'Docker' },
    { name: 'GraphQL' },
    { name: 'Python' },
  ],
  workExperience: [
    {
      id: 'work-1',
      company: 'Tech Solutions Inc.',
      position: 'Senior Software Engineer',
      startDate: '2021-03-01',
      endDate: undefined,
      isCurrent: true,
      description:
        'Leading development of cloud-native microservices architecture serving 10M+ users.',
      achievements: [
        'Led migration from monolith to microservices, reducing deployment time by 60%',
        'Mentored team of 5 junior developers, conducting code reviews and technical sessions',
        'Implemented CI/CD pipeline reducing release cycles from 2 weeks to daily deployments',
      ],
    },
    {
      id: 'work-2',
      company: 'StartupXYZ',
      position: 'Full Stack Developer',
      startDate: '2019-01-15',
      endDate: '2021-02-28',
      isCurrent: false,
      description:
        'Built core product features for a B2B SaaS platform from ground up.',
      achievements: [
        'Developed real-time collaboration features using WebSockets and Redis',
        'Optimized database queries resulting in 40% faster page load times',
        'Integrated third-party APIs including Stripe, Twilio, and Salesforce',
      ],
    },
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'E-commerce Platform',
      description:
        'Full-stack e-commerce solution with inventory management, payment processing, and analytics dashboard.',
      technologies: ['Next.js', 'PostgreSQL', 'Stripe', 'Redis'],
      highlights: [],
      startDate: '2023-06-01',
      endDate: '2023-12-15',
    },
    {
      id: 'proj-2',
      name: 'Task Management App',
      description:
        'Real-time collaborative task management application with team features and integrations.',
      technologies: ['React', 'Node.js', 'Socket.io', 'MongoDB'],
      highlights: [],
      startDate: '2022-09-01',
      endDate: '2023-03-30',
    },
  ],
  education: [
    {
      id: 'edu-1',
      institution: 'University of California, Berkeley',
      degree: 'Bachelor of Science',
      major: 'Computer Science',
      startDate: '2015-08-01',
      endDate: '2019-05-15',
      gpa: 3.8,
    },
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'AWS Solutions Architect - Associate',
      issuer: 'Amazon Web Services',
      issueDate: '2022-06-15',
    },
    {
      id: 'cert-2',
      name: 'Professional Scrum Master I',
      issuer: 'Scrum.org',
      issueDate: '2021-09-20',
    },
  ],
}

/**
 * 转换数据库模板到应用模板类型
 */
function transformTemplate(dbTemplate: DatabaseResumeTemplate): ResumeTemplate {
  return {
    id: dbTemplate.id,
    name: dbTemplate.name,
    description: dbTemplate.description,
    category: dbTemplate.category,
    config: dbTemplate.config as TemplateConfig,
    previewUrl: dbTemplate.preview_url,
    supportsPdf: dbTemplate.supports_pdf,
    supportsHtml: dbTemplate.supports_html,
    isActive: dbTemplate.is_active,
    createdAt: new Date(dbTemplate.created_at),
    updatedAt: new Date(dbTemplate.updated_at),
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params
    const supabase = await createClient()

    // 获取模板配置
    const { data: dbTemplate, error } = await supabase
      .from('resume_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single()

    if (error || !dbTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    const template = transformTemplate(dbTemplate as DatabaseResumeTemplate)

    // 检查是否支持HTML
    if (!template.supportsHtml) {
      return NextResponse.json(
        { error: 'Template does not support HTML preview' },
        { status: 400 }
      )
    }

    // 使用HTML渲染器生成预览
    const renderer = new HTMLRenderer(template)
    const html = await renderer.render(SAMPLE_RESUME_CONTENT)

    // 返回HTML响应
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // 缓存1小时
      },
    })
  } catch (error) {
    console.error('Template preview error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate preview',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
