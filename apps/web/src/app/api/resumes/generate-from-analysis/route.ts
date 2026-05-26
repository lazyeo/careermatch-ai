import { createClient } from '@/lib/supabase-server'
import {
  createAIClient,
  isAnyAIConfigured,
  getBestModel,
  getDefaultProvider,
  TEMPERATURE_PRESETS,
  type AIProviderType,
} from '@/lib/ai-providers'
import { validateResumeContent, type FlattenedProfile } from '@/lib/ai/resume-quality-validator'
import { fitResumeContentToOnePageBudget } from '@/lib/resume-content-budget'
import { NextRequest, NextResponse } from 'next/server'
import type { ResumeContent } from '@careermatch/shared'

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
          content: `You are a professional resume writer specializing in creating targeted resumes based on AI analysis.
You will create a concise, job-specific resume based on the user's profile and AI analysis suggestions.

**CRITICAL REQUIREMENT**:
All content in the generated resume MUST be in **ENGLISH**. Even if the input profile or job description is in another language, you must translate and adapt it to professional English.
Default to a one-page A4 resume. Select the strongest evidence; do not include everything.

**Important**:
1. Resume content must be based on the user's real experience and skills.
2. Highlight the most relevant content based on AI analysis.
3. Use professional English wording and format.
4. Quantify achievements with specific numbers.
5. Output must be strictly in JSON format.

**Output Format**:
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
  "professional_summary": "2-sentence targeted professional summary",
  "work_experience": [
    {
      "company": "公司名称",
      "position": "职位",
      "location": "地点",
      "start_date": "YYYY-MM",
      "end_date": "YYYY-MM 或 至今",
      "achievements": [
        "Quantified achievement with impact",
        "Second concise achievement"
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
    "technical": ["skill1", "skill2"],
    "soft": ["skill1", "skill2"],
    "languages": ["language1"],
    "tools": ["tool1", "tool2"]
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
      max_tokens: 16384,
      response_format: { type: 'json_object' },
    })

    const generatedContent = completion.choices[0]?.message?.content
    if (!generatedContent) {
      throw new Error('Failed to generate resume content')
    }

    // Parse the generated content robustly (handles ``` fences, extra text, trailing commas)
    let resumeContent: Record<string, unknown>
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

    // Transform AI output to ResumeContent format for validation
    const normalizedResumeContent = fitResumeContentToOnePageBudget(transformToResumeContent(resumeContent))

    // Build FlattenedProfile for validation
    const fullProfile: FlattenedProfile = {
      id: profileResult.data.id,
      fullName: profileResult.data.full_name || '',
      email: profileResult.data.email || user.email || '',
      phone: profileResult.data.phone || null,
      location: profileResult.data.location || null,
      professionalSummary: profileResult.data.professional_summary || null,
      linkedinUrl: profileResult.data.linkedin_url || null,
      githubUrl: profileResult.data.github_url || null,
      portfolioUrl: profileResult.data.portfolio_url || null,
      targetRoles: profileResult.data.target_roles || [],
      workExperiences: (workResult.data || []).map((we: Record<string, unknown>) => ({
        id: we.id as string,
        company: (we.company_name as string) || '',
        position: (we.job_title as string) || '',
        location: (we.location as string) || null,
        startDate: new Date(we.start_date as string),
        endDate: we.end_date ? new Date(we.end_date as string) : null,
        isCurrent: !we.end_date,
        description: (we.description as string) || null,
        achievements: (we.achievements as string[]) || [],
      })),
      educationRecords: (educationResult.data || []).map((edu: Record<string, unknown>) => ({
        id: edu.id as string,
        institution: (edu.institution_name as string) || '',
        degree: (edu.degree as string) || '',
        major: (edu.field_of_study as string) || '',
        location: (edu.location as string) || null,
        startDate: edu.start_date ? new Date(edu.start_date as string) : null,
        graduationDate: edu.end_date ? new Date(edu.end_date as string) : null,
        gpa: (edu.gpa as number) || null,
        achievements: (edu.honors as string[]) || [],
      })),
      skills: (skillsResult.data || []).map((skill: Record<string, unknown>) => ({
        id: skill.id as string,
        name: (skill.skill_name as string) || '',
        category: (skill.category as string) || null,
        level: (skill.proficiency_level as string) || null,
        yearsOfExperience: (skill.years_of_experience as number) || null,
      })),
      projects: (projectsResult.data || []).map((proj: Record<string, unknown>) => ({
        id: proj.id as string,
        projectName: (proj.project_name as string) || '',
        description: (proj.description as string) || null,
        role: (proj.role as string) || null,
        startDate: proj.start_date ? new Date(proj.start_date as string) : null,
        endDate: proj.end_date ? new Date(proj.end_date as string) : null,
        technologiesUsed: (proj.technologies as string[]) || [],
        achievements: (proj.achievements as string[]) || [],
        projectUrl: (proj.project_url as string) || null,
      })),
      certifications: (certificationsResult.data || []).map((cert: Record<string, unknown>) => ({
        id: cert.id as string,
        name: (cert.certification_name as string) || '',
        issuingOrganization: (cert.issuing_organization as string) || null,
        issuedDate: cert.issue_date ? new Date(cert.issue_date as string) : null,
        expirationDate: cert.expiration_date ? new Date(cert.expiration_date as string) : null,
        credentialId: (cert.credential_id as string) || null,
        credentialUrl: (cert.credential_url as string) || null,
      })),
    }

    // Run quality validation
    console.log('🔍 Running quality validation...')
    const qualityReport = await validateResumeContent(
      normalizedResumeContent,
      fullProfile,
      {
        checkHallucinations: true,
        checkCompleteness: true,
        checkRelevance: false,
        strictMode: false,
        minQualityScore: 50,
        maxHallucinationCount: 10,
      }
    )

    console.log(`📊 Quality Score: ${qualityReport.qualityScore}/100`)
    console.log(`   - Accuracy: ${qualityReport.accuracy}%`)
    console.log(`   - Completeness: ${qualityReport.completeness}%`)
    console.log(`   - Hallucinations: ${qualityReport.hallucinations.length}`)
    console.log(`   - Warnings: ${qualityReport.stats.warningCount}`)

    // Generate title
    const resumeTitle = `简历 - ${job.title} at ${job.company}`

    // Save resume to database
    // Check for existing resume for this job
    const { data: existingResume } = await supabase
      .from('resumes')
      .select('id, version')
      .eq('job_id', session.job_id)
      .eq('user_id', user.id)
      .single()

    let resume
    if (existingResume) {
      // Update existing resume
      const { data: updatedResume, error: updateError } = await supabase
        .from('resumes')
        .update({
          title: resumeTitle,
          content: normalizedResumeContent,
          analysis_session_id: session.id,
          source: 'ai_generated',
          version: (existingResume.version || 1) + 1,
          updated_at: new Date().toISOString(),
          // Quality validation fields
          quality_score: qualityReport.qualityScore,
          validation_flags: qualityReport.flags,
          source_mapping: qualityReport.sourceMapping,
        })
        .eq('id', existingResume.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating resume:', updateError)
        throw new Error('Failed to update resume')
      }
      resume = updatedResume
      console.log('✅ Resume updated:', resume.id, 'Version:', resume.version)
    } else {
      // Create new resume
      const { data: newResume, error: saveError } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          title: resumeTitle,
          content: normalizedResumeContent,
          job_id: session.job_id,
          analysis_session_id: session.id,
          source: 'ai_generated',
          version: 1,
          is_primary: false,
          // Quality validation fields
          quality_score: qualityReport.qualityScore,
          validation_flags: qualityReport.flags,
          source_mapping: qualityReport.sourceMapping,
        })
        .select()
        .single()

      if (saveError) {
        console.error('Error saving resume:', saveError)
        throw new Error('Failed to save resume')
      }
      resume = newResume
      console.log('✅ New resume created:', resume.id)
    }



    console.log('✅ Resume generated and saved:', resume.id)

    // Log the generation details with quality metrics
    try {
      await supabase.from('resume_generation_logs').insert({
        user_id: user.id,
        resume_id: resume.id,
        job_id: session.job_id,
        provider: providerName,
        model: model,
        prompt: prompt,
        context_snapshot: {
          job: {
            title: job.title,
            company: job.company,
            description: job.description,
            requirements: job.requirements
          },
          profile: profile,
          analysis: session.analysis
        },
        generated_content: generatedContent,
        // Quality validation results
        validation_result: {
          qualityScore: qualityReport.qualityScore,
          accuracy: qualityReport.accuracy,
          completeness: qualityReport.completeness,
          hallucinationCount: qualityReport.hallucinations.length,
          flags: qualityReport.flags,
        },
        quality_metrics: {
          accuracy: qualityReport.accuracy,
          completeness: qualityReport.completeness,
          relevance: qualityReport.relevance,
          hallucination_count: qualityReport.hallucinations.length,
          error_count: qualityReport.stats.errorCount,
          warning_count: qualityReport.stats.warningCount,
          validated_at: qualityReport.validatedAt.toISOString(),
          validator_version: qualityReport.validator,
        },
      })
      console.log('📝 Generation log saved with quality metrics')
    } catch (logError) {
      // Don't fail the request if logging fails, just log the error
      console.error('⚠️ Failed to save generation log:', logError)
    }

    return NextResponse.json({
      resumeId: resume.id,
      content: normalizedResumeContent,
      title: resumeTitle,
      // Include quality report in response
      qualityReport: {
        score: qualityReport.qualityScore,
        accuracy: qualityReport.accuracy,
        completeness: qualityReport.completeness,
        hallucinations: qualityReport.hallucinations.length,
        warnings: qualityReport.stats.warningCount,
        errors: qualityReport.stats.errorCount,
        suggestions: qualityReport.suggestions,
      },
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
Please generate a targeted resume based on the following information.

**IMPORTANT**: The output resume content MUST be in ENGLISH.

## Target Job Information
- **Title**: ${job.title}
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

## Resume Generation Requirements

Generate a focused resume for this target job. The default goal is to fit on one A4 page.

### 1. 内容选择原则
- Select only the most relevant experience and skills based on the analysis.
- Prioritize evidence that directly matches the role requirements.
- Omit lower-value details instead of making the resume long.

### 2. 措辞优化
- Use keywords recommended by the analysis.
- Quantify achievements with specific numbers, percentages, or scale where available.
- Start bullets with strong English action verbs.
- Show impact and value clearly.

### 3. 格式要求
- Professional summary: exactly 2 concise sentences, under 55 words total.
- Work experience: reverse chronological order, max 3 roles, 2-3 quantified achievements per role.
- Skills: max 18 total skills across all categories.
- Projects: max 2 most relevant projects, each with a short description and at most 1-2 achievements.
- Certifications: max 3 most relevant certifications.

### 4. Important Notes
- All content must be based on real user information, do not fabricate.
- Date format: YYYY-MM.
- Use real contact information provided.
- If information is missing, omit the field.
- **ENSURE ALL CONTENT IS IN ENGLISH.**

Please strictly output in JSON format.
`
}

/**
 * Transform AI-generated resume content to ResumeContent format
 * AI生成的简历格式转换为标准ResumeContent格式
 */
function transformToResumeContent(aiOutput: Record<string, unknown>): ResumeContent {
  const personalInfo = aiOutput.personal_info as Record<string, unknown> | undefined
  const workExperience = aiOutput.work_experience as Array<Record<string, unknown>> | undefined
  const education = aiOutput.education as Array<Record<string, unknown>> | undefined
  const skills = aiOutput.skills as Record<string, string[]> | undefined
  const projects = aiOutput.projects as Array<Record<string, unknown>> | undefined
  const certifications = aiOutput.certifications as Array<Record<string, unknown>> | undefined

  return {
    personalInfo: {
      fullName: (personalInfo?.full_name as string) || '',
      email: (personalInfo?.email as string) || '',
      phone: (personalInfo?.phone as string) || '',
      location: (personalInfo?.location as string) || '',
      linkedIn: personalInfo?.linkedin as string | undefined,
      github: personalInfo?.github as string | undefined,
      website: personalInfo?.website as string | undefined,
    },
    careerObjective: (aiOutput.professional_summary as string) || undefined,
    skills: [
      ...(skills?.technical || []).map((name: string) => ({ name, category: 'technical' })),
      ...(skills?.soft || []).map((name: string) => ({ name, category: 'soft' })),
      ...(skills?.languages || []).map((name: string) => ({ name, category: 'languages' })),
      ...(skills?.tools || []).map((name: string) => ({ name, category: 'tools' })),
    ],
    workExperience: (workExperience || []).map((exp, index) => ({
      id: `work-${index}`,
      company: (exp.company as string) || '',
      position: (exp.position as string) || '',
      location: exp.location as string | undefined,
      startDate: (exp.start_date as string) || '',
      endDate: exp.end_date as string | undefined,
      isCurrent: !exp.end_date,
      description: (exp.description as string) || '',
      achievements: (exp.achievements as string[]) || [],
    })),
    projects: (projects || []).map((proj, index) => ({
      id: `proj-${index}`,
      name: (proj.name as string) || '',
      description: (proj.description as string) || '',
      role: proj.role as string | undefined,
      technologies: (proj.technologies as string[]) || [],
      startDate: proj.start_date as string | undefined,
      endDate: proj.end_date as string | undefined,
      url: proj.url as string | undefined,
      highlights: (proj.achievements as string[]) || [],
    })),
    education: (education || []).map((edu, index) => ({
      id: `edu-${index}`,
      institution: (edu.institution as string) || '',
      degree: (edu.degree as string) || '',
      major: (edu.field as string) || '',
      location: edu.location as string | undefined,
      startDate: (edu.start_date as string) || '',
      endDate: edu.end_date as string | undefined,
      gpa: edu.gpa as number | undefined,
      achievements: edu.honors as string[] | undefined,
    })),
    certifications: (certifications || []).map((cert, index) => ({
      id: `cert-${index}`,
      name: (cert.name as string) || '',
      issuer: (cert.issuer as string) || '',
      issueDate: (cert.date as string) || '',
      credentialId: cert.credential_id as string | undefined,
    })),
  }
}
