import { createClient } from '@/lib/supabase-server'
import {
  createAIClient,
  isAnyAIConfigured,
  getBestModel,
  getDefaultProvider,
  TEMPERATURE_PRESETS,
  type AIProviderType,
} from '@/lib/ai-providers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/resumes/generate-from-analysis
 *
 * 基于AI分析结果自动生成简历
 * Body: { sessionId: string, provider?: AIProviderType }
 * Returns: { resumeId: string, content: object }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if any AI provider is configured
    if (!isAnyAIConfigured()) {
      return NextResponse.json(
        { error: 'No AI provider is configured' },
        { status: 503 }
      )
    }

    // Get request body
    const body = await request.json()
    const { sessionId, provider } = body as {
      sessionId: string
      provider?: AIProviderType
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      )
    }

    // Fetch analysis session
    const { data: session, error: sessionError } = await supabase
      .from('analysis_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Analysis session not found' },
        { status: 404 }
      )
    }

    // Fetch job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', session.job_id)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Fetch user profile and all related data
    const [
      profileResult,
      workResult,
      educationResult,
      skillsResult,
      projectsResult,
      certificationsResult,
    ] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('work_experiences')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false }),
      supabase
        .from('education_records')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false }),
      supabase
        .from('user_skills')
        .select('*')
        .eq('user_id', user.id)
        .order('category'),
      supabase
        .from('user_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false }),
      supabase
        .from('user_certifications')
        .select('*')
        .eq('user_id', user.id)
        .order('issue_date', { ascending: false }),
    ])

    if (profileResult.error || !profileResult.data) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const profile = {
      ...profileResult.data,
      work_experiences: workResult.data || [],
      education_records: educationResult.data || [],
      skills: skillsResult.data || [],
      projects: projectsResult.data || [],
      certifications: certificationsResult.data || [],
    }

    // Get provider info
    const defaultProvider = getDefaultProvider()
    const providerName = provider || defaultProvider?.type || 'openai'
    const model = getBestModel(provider)

    console.log(`🤖 Generating resume with ${providerName.toUpperCase()}`)
    console.log(`📊 Using model: ${model}`)
    console.log(`📝 Based on analysis session: ${sessionId}`)

    // Build prompt for resume generation
    const prompt = buildResumeGenerationPrompt(job, profile, session.analysis)

    // Create AI client and generate
    const aiClient = createAIClient(provider)

    const completion = await aiClient.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `你是一位专业的简历撰写专家，擅长根据AI分析建议创建针对性的简历。
你将基于用户的个人档案信息和AI的分析建议，创建一份完整的、针对特定岗位的简历。

**重要**：
1. 简历内容必须基于用户真实的经历和技能
2. 根据AI分析建议，突出与岗位最相关的内容
3. 使用专业的措辞和格式
4. 量化成就，使用具体数字
5. 输出必须是严格的JSON格式，可以被直接解析

**输出格式**：
{
  "personal_info": {
    "full_name": "姓名",
    "email": "邮箱",
    "phone": "电话",
    "location": "地点",
    "linkedin": "LinkedIn链接（可选）",
    "github": "GitHub链接（可选）",
    "website": "个人网站（可选）"
  },
  "professional_summary": "2-3句话的专业简介，针对该岗位",
  "work_experience": [
    {
      "company": "公司名称",
      "position": "职位",
      "location": "地点",
      "start_date": "YYYY-MM",
      "end_date": "YYYY-MM 或 至今",
      "achievements": [
        "量化的成就1（包含数字和影响）",
        "量化的成就2"
      ]
    }
  ],
  "education": [
    {
      "institution": "学校名称",
      "degree": "学位",
      "field": "专业",
      "location": "地点",
      "start_date": "YYYY-MM",
      "end_date": "YYYY-MM",
      "gpa": "GPA（可选）",
      "honors": ["荣誉1", "荣誉2"]
    }
  ],
  "skills": {
    "technical": ["技能1", "技能2"],
    "soft": ["软技能1", "软技能2"],
    "languages": ["语言1", "语言2"],
    "tools": ["工具1", "工具2"]
  },
  "projects": [
    {
      "name": "项目名称",
      "role": "角色",
      "description": "简短描述",
      "technologies": ["技术1", "技术2"],
      "achievements": ["成就1", "成就2"],
      "url": "项目链接（可选）"
    }
  ],
  "certifications": [
    {
      "name": "证书名称",
      "issuer": "颁发机构",
      "date": "YYYY-MM",
      "credential_id": "证书ID（可选）"
    }
  ]
}`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: TEMPERATURE_PRESETS.ANALYTICAL,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    })

    const generatedContent = completion.choices[0]?.message?.content
    if (!generatedContent) {
      throw new Error('Failed to generate resume content')
    }

    // Parse the generated content robustly (handles ``` fences, extra text, trailing commas)
    let resumeContent
    try {
      const { parseJsonFromAI, cleanJsonResponse } = await import('@/lib/json-utils')
      const cleanedPreview = cleanJsonResponse(generatedContent)
      if (cleanedPreview !== generatedContent) {
        console.log('🔧 Cleaned AI response before JSON parse')
      }
      resumeContent = parseJsonFromAI<Record<string, unknown>>(generatedContent)
    } catch (parseError) {
      console.error('Failed to parse generated resume:', parseError)
      console.error('Raw content:', generatedContent)
      throw new Error('Invalid resume format generated')
    }

    // Generate title
    const resumeTitle = `简历 - ${job.title} at ${job.company}`

    // Save resume to database
    const { data: resume, error: saveError } = await supabase
      .from('resumes')
      .insert({
        user_id: user.id,
        title: resumeTitle,
        content: resumeContent,
        job_id: session.job_id,
        analysis_session_id: session.id,
        source: 'ai_generated',
        version: 1,
        is_primary: false,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving resume:', saveError)
      throw new Error('Failed to save resume')
    }

    console.log('✅ Resume generated and saved:', resume.id)

    return NextResponse.json({
      resumeId: resume.id,
      content: resumeContent,
      title: resumeTitle,
    })
  } catch (error) {
    console.error('Error generating resume:', error)
    return NextResponse.json(
      { error: 'Failed to generate resume' },
      { status: 500 }
    )
  }
}

/**
 * Build prompt for resume generation
 */
function buildResumeGenerationPrompt(
  job: Record<string, unknown>,
  profile: {
    full_name?: string
    email?: string
    phone?: string
    location?: string
    professional_summary?: string
    target_roles?: string[]
    work_experiences: Array<Record<string, unknown>>
    education_records: Array<Record<string, unknown>>
    skills: Array<Record<string, unknown>>
    projects: Array<Record<string, unknown>>
    certifications: Array<Record<string, unknown>>
  },
  analysisContent: string
): string {
  // Format work experiences
  const workExperiencesFormatted = profile.work_experiences.map((exp) => ({
    company: exp.company_name,
    title: exp.job_title,
    location: exp.location,
    startDate: exp.start_date,
    endDate: exp.end_date || '至今',
    description: exp.description,
    achievements: exp.achievements,
  }))

  // Format education
  const educationFormatted = profile.education_records.map((edu) => ({
    institution: edu.institution_name,
    degree: edu.degree,
    field: edu.field_of_study,
    location: edu.location,
    startDate: edu.start_date,
    endDate: edu.end_date,
    gpa: edu.gpa,
    honors: edu.honors,
  }))

  // Format skills by category
  const skillsFormatted = profile.skills.map((skill) => ({
    name: skill.skill_name,
    category: skill.category,
    level: skill.proficiency_level,
    years: skill.years_of_experience,
  }))

  // Format projects
  const projectsFormatted = profile.projects.map((proj) => ({
    name: proj.project_name,
    role: proj.role,
    description: proj.description,
    technologies: proj.technologies,
    achievements: proj.achievements,
    url: proj.project_url,
  }))

  // Format certifications
  const certificationsFormatted = profile.certifications.map((cert) => ({
    name: cert.certification_name,
    issuer: cert.issuing_organization,
    date: cert.issue_date,
    expires: cert.expiration_date,
    credentialId: cert.credential_id,
  }))

  return `
请基于以下信息生成一份针对性的简历。

## 目标岗位信息
- **职位**: ${job.title}
- **公司**: ${job.company}
- **地点**: ${job.location || '未指定'}
- **描述**: ${job.description || '未提供'}
- **要求**: ${job.requirements || '未提供'}

---

## AI分析建议

${analysisContent}

---

## 用户个人档案信息

### 基本信息
- **姓名**: ${profile.full_name || '未填写'}
- **邮箱**: ${profile.email || '未填写'}
- **电话**: ${profile.phone || '未填写'}
- **位置**: ${profile.location || '未填写'}
- **目标岗位**: ${profile.target_roles?.join('、') || '未设置'}

### 个人简介
${profile.professional_summary || '未填写'}

### 工作经历 (${profile.work_experiences.length} 条)
${JSON.stringify(workExperiencesFormatted, null, 2)}

### 教育背景 (${profile.education_records.length} 条)
${JSON.stringify(educationFormatted, null, 2)}

### 技能 (${profile.skills.length} 项)
${JSON.stringify(skillsFormatted, null, 2)}

### 项目经验 (${profile.projects.length} 个)
${JSON.stringify(projectsFormatted, null, 2)}

### 证书 (${profile.certifications.length} 个)
${JSON.stringify(certificationsFormatted, null, 2)}

---

## 简历生成要求

请基于以上的AI分析建议和用户真实信息，生成一份完整的、针对该岗位的简历：

### 1. 内容选择原则
- 根据AI分析建议，选择最相关的经历和技能
- 突出与岗位要求匹配的能力
- 按重要性排序内容

### 2. 措辞优化
- 使用AI分析中建议的关键词
- 量化成就（使用具体数字、百分比、规模）
- 采用行动动词开头（领导、开发、优化、提升等）
- 体现影响力和价值

### 3. 格式要求
- 专业简介：2-3句话，针对该岗位定制
- 工作经历：按时间倒序，每个职位3-5个量化成就
- 技能分类：技术技能、软技能、语言、工具
- 项目经验：选择最相关的2-3个项目

### 4. 注意事项
- 所有内容必须基于用户真实信息，不能编造
- 日期格式统一使用 YYYY-MM
- 联系方式使用用户提供的真实信息
- 如果某些信息缺失，可以省略该字段

请严格按照JSON格式输出，确保可以被直接解析。
`
}
