/**
 * 简历生成 API V2 - CV策略驱动
 *
 * POST /api/resumes/generate-v2
 * 基于8维度分析的CV策略生成针对性简历
 *
 * Body: {
 *   sessionId: string,        // V2分析会话ID（必须有dimensions）
 *   provider?: AIProviderType,
 *   templateId?: string       // 可选的模板ID，不提供则自动推荐
 * }
 *
 * Returns: {
 *   resumeId, content, title,
 *   templateId,              // 使用的模板
 *   templateRecommendation?, // 模板推荐信息（如果自动选择）
 *   qualityReport
 * }
 */

import { createClient } from '@/lib/supabase-server'
import {
  createAIClient,
  isAnyAIConfigured,
  getBestModel,
  getDefaultProvider,
  TEMPERATURE_PRESETS,
  type AIProviderType,
} from '@/lib/ai-providers'
import {
  validateResumeContent,
  type FlattenedProfile,
} from '@/lib/ai/resume-quality-validator'
import {
  optimizeResumeContent,
  type OptimizedResumeContent,
} from '@/lib/ai/resume-content-optimizer'
import {
  recommendTemplate,
  type TemplateRecommendation,
} from '@/lib/ai/template-recommender'
import { NextRequest, NextResponse } from 'next/server'
import type {
  CVStrategy,
  FullProfile,
  ResumeContent,
  AnalysisDimensions,
} from '@careermatch/shared'

// =====================================================
// POST: 生成CV策略驱动的简历
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. 验证用户
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. 检查AI配置
    if (!isAnyAIConfigured()) {
      return NextResponse.json(
        { error: 'No AI provider is configured' },
        { status: 503 }
      )
    }

    // 3. 解析请求
    const body = await request.json()
    const { sessionId, provider, templateId } = body as {
      sessionId: string
      provider?: AIProviderType
      templateId?: string
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      )
    }

    // 4. 获取V2分析会话（必须有dimensions）
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

    // 检查是否有8维度数据
    const dimensions = session.dimensions as AnalysisDimensions | null
    if (!dimensions || !dimensions.cvStrategy) {
      return NextResponse.json(
        {
          error: 'This session does not have CV strategy. Please use analyze-v2 API first.',
          hint: 'Call POST /api/jobs/[id]/analyze-v2 to get 8-dimension analysis with CV strategy.',
        },
        { status: 400 }
      )
    }

    const cvStrategy = dimensions.cvStrategy

    // 5. 获取岗位信息
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', session.job_id)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // 6. 获取完整Profile
    const fullProfile = await fetchFullProfile(supabase, user.id)
    if (!fullProfile || !fullProfile.profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // 7. 确定使用的模板
    let finalTemplateId = templateId
    let templateRecommendation: TemplateRecommendation | null = null

    if (!finalTemplateId) {
      // 自动推荐模板
      templateRecommendation = recommendTemplate(
        job.title as string,
        job.company as string,
        cvStrategy
      )
      finalTemplateId = templateRecommendation.templateId
      console.log(
        `📋 Auto-recommended template: ${finalTemplateId} (${templateRecommendation.reason})`
      )
    }

    // 8. 使用CV策略优化Profile内容
    console.log('🔧 Optimizing content with CV strategy...')
    const optimizedContent = optimizeResumeContent(
      fullProfile,
      cvStrategy,
      job.title as string,
      job.company as string
    )
    console.log(`   Notes: ${optimizedContent.optimizationNotes.join('; ')}`)

    // 9. AI增强内容（措辞优化、职业目标生成等）
    const providerName = provider || getDefaultProvider()?.type || 'openai'
    const model = getBestModel(provider)

    console.log(`🤖 Enhancing content with ${providerName.toUpperCase()}...`)
    console.log(`📊 Using model: ${model}`)

    const enhancedContent = await enhanceWithAI(
      optimizedContent,
      job,
      session.analysis as string,
      cvStrategy,
      provider
    )

    // 10. 质量验证
    console.log('🔍 Running quality validation...')
    const flatProfile = buildFlattenedProfile(fullProfile)
    const qualityReport = await validateResumeContent(
      enhancedContent,
      flatProfile,
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

    // 11. 保存简历
    const resumeTitle = `简历 - ${job.title} at ${job.company} (V2)`

    // 检查是否已存在
    const { data: existingResume } = await supabase
      .from('resumes')
      .select('id, version')
      .eq('job_id', session.job_id)
      .eq('user_id', user.id)
      .single()

    let resume
    const resumeData = {
      title: resumeTitle,
      content: enhancedContent,
      analysis_session_id: session.id,
      template_id: finalTemplateId,
      source: 'ai_generated',
      quality_score: qualityReport.qualityScore,
      validation_flags: qualityReport.flags,
      source_mapping: qualityReport.sourceMapping,
    }

    if (existingResume) {
      const { data: updatedResume, error: updateError } = await supabase
        .from('resumes')
        .update({
          ...resumeData,
          version: (existingResume.version || 1) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingResume.id)
        .select()
        .single()

      if (updateError) throw updateError
      resume = updatedResume
      console.log('✅ Resume updated:', resume.id)
    } else {
      const { data: newResume, error: saveError } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          job_id: session.job_id,
          ...resumeData,
          version: 1,
          is_primary: false,
        })
        .select()
        .single()

      if (saveError) throw saveError
      resume = newResume
      console.log('✅ New resume created:', resume.id)
    }

    // 12. 记录生成日志
    try {
      await supabase.from('resume_generation_logs').insert({
        user_id: user.id,
        resume_id: resume.id,
        job_id: session.job_id,
        provider: providerName,
        model: model,
        prompt: '[V2 CV Strategy Based]',
        context_snapshot: {
          job: { title: job.title, company: job.company },
          cvStrategy: cvStrategy,
          optimizationNotes: optimizedContent.optimizationNotes,
          templateId: finalTemplateId,
        },
        generated_content: JSON.stringify(enhancedContent),
        validation_result: {
          qualityScore: qualityReport.qualityScore,
          accuracy: qualityReport.accuracy,
          completeness: qualityReport.completeness,
        },
        quality_metrics: {
          accuracy: qualityReport.accuracy,
          completeness: qualityReport.completeness,
          relevance: qualityReport.relevance,
          hallucination_count: qualityReport.hallucinations.length,
        },
      })
    } catch (logError) {
      console.warn('Failed to save generation log:', logError)
    }

    return NextResponse.json({
      resumeId: resume.id,
      content: enhancedContent,
      title: resumeTitle,
      templateId: finalTemplateId,
      templateRecommendation: templateRecommendation
        ? {
            templateId: templateRecommendation.templateId,
            reason: templateRecommendation.reason,
            confidence: templateRecommendation.confidence,
          }
        : undefined,
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
    console.error('Error in generate-v2:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate resume',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// =====================================================
// 辅助函数
// =====================================================

async function fetchFullProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<FullProfile | null> {
  const [
    profileResult,
    workResult,
    eduResult,
    skillsResult,
    projectsResult,
    certsResult,
  ] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('user_id', userId).single(),
    supabase
      .from('work_experiences')
      .select('*')
      .eq('user_id', userId)
      .order('display_order'),
    supabase
      .from('education_records')
      .select('*')
      .eq('user_id', userId)
      .order('display_order'),
    supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', userId)
      .order('display_order'),
    supabase
      .from('user_projects')
      .select('*')
      .eq('user_id', userId)
      .order('display_order'),
    supabase
      .from('user_certifications')
      .select('*')
      .eq('user_id', userId)
      .order('display_order'),
  ])

  return {
    profile: profileResult.data,
    work_experiences: workResult.data,
    education_records: eduResult.data,
    skills: skillsResult.data,
    projects: projectsResult.data,
    certifications: certsResult.data,
  }
}

function buildFlattenedProfile(profile: FullProfile): FlattenedProfile {
  return {
    id: profile.profile?.id || '',
    fullName: profile.profile?.full_name || '',
    email: profile.profile?.email || '',
    phone: profile.profile?.phone || null,
    location: profile.profile?.location || null,
    professionalSummary: profile.profile?.professional_summary || null,
    linkedinUrl: profile.profile?.linkedin_url || null,
    githubUrl: profile.profile?.github_url || null,
    portfolioUrl: profile.profile?.website_url || null,
    targetRoles: profile.profile?.target_roles || [],
    workExperiences: (profile.work_experiences || []).map((we) => ({
      id: we.id,
      company: we.company || '',
      position: we.position || '',
      location: we.location || null,
      startDate: new Date(we.start_date),
      endDate: we.end_date ? new Date(we.end_date) : null,
      isCurrent: we.is_current,
      description: we.description || null,
      achievements: we.achievements || [],
    })),
    educationRecords: (profile.education_records || []).map((edu) => ({
      id: edu.id,
      institution: edu.institution || '',
      degree: edu.degree || '',
      major: edu.major || '',
      location: edu.location || null,
      startDate: edu.start_date ? new Date(edu.start_date) : null,
      graduationDate: edu.end_date ? new Date(edu.end_date) : null,
      gpa: edu.gpa || null,
      achievements: edu.achievements || [],
    })),
    skills: (profile.skills || []).map((skill) => ({
      id: skill.id,
      name: skill.name || '',
      category: skill.category || null,
      level: skill.level || null,
      yearsOfExperience: skill.years_experience || null,
    })),
    projects: (profile.projects || []).map((proj) => ({
      id: proj.id,
      projectName: proj.name || '',
      description: proj.description || null,
      role: proj.role || null,
      startDate: proj.start_date ? new Date(proj.start_date) : null,
      endDate: proj.end_date ? new Date(proj.end_date) : null,
      technologiesUsed: proj.technologies || [],
      achievements: proj.highlights || [],
      projectUrl: proj.url || null,
    })),
    certifications: (profile.certifications || []).map((cert) => ({
      id: cert.id,
      name: cert.name || '',
      issuingOrganization: cert.issuer || null,
      issuedDate: cert.issue_date ? new Date(cert.issue_date) : null,
      expirationDate: cert.expiry_date ? new Date(cert.expiry_date) : null,
      credentialId: cert.credential_id || null,
      credentialUrl: cert.credential_url || null,
    })),
  }
}

async function enhanceWithAI(
  optimizedContent: OptimizedResumeContent,
  job: Record<string, unknown>,
  analysis: string,
  cvStrategy: CVStrategy,
  provider?: AIProviderType
): Promise<ResumeContent> {
  const aiClient = createAIClient(provider)
  const model = getBestModel(provider)

  const prompt = buildEnhancementPrompt(optimizedContent, job, analysis, cvStrategy)

  const completion = await aiClient.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: `You are an expert professional resume writer with years of experience crafting compelling resumes that land interviews at top companies.

**Your Mission**: Transform the provided resume content into a powerful, interview-winning resume tailored for the target position.

**Critical Rules**:
1. **Accuracy First**: DO NOT invent facts, dates, company names, or metrics not in the original content
2. **Expand & Enhance**:
   - Each work experience MUST have 3-5 achievement bullets (expand if fewer provided)
   - Each achievement should be 15-25 words, quantified when possible
   - Add context and impact to make accomplishments stand out
3. **Professional Summary**: Write a compelling 2-3 sentence summary highlighting key qualifications for the target role
4. **Action Verbs**: Start each bullet with a strong action verb from the provided CV strategy
5. **Tone**: Match the CV strategy tone (technical/executive/creative/formal/conversational)
6. **Skills**: Keep skills categorized and relevant to the target job
7. **Projects**: Include clear descriptions with technologies and outcomes
8. **Output Format**: Return valid JSON matching the exact input structure

**Enhancement Guidelines**:
- Transform passive voice to active voice
- Add specificity: "improved performance" → "improved application response time by optimizing database queries"
- Highlight transferable skills relevant to the target role
- Ensure consistent tense (past for completed roles, present for current)`,
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

  const responseText = completion.choices[0]?.message?.content
  if (!responseText) {
    throw new Error('AI returned empty response')
  }

  try {
    const { parseJsonFromAI } = await import('@/lib/json-utils')
    const enhanced = parseJsonFromAI<ResumeContent>(responseText)
    return enhanced
  } catch {
    console.warn('Failed to parse AI response, using optimized content as-is')
    return optimizedContent
  }
}

function buildEnhancementPrompt(
  content: OptimizedResumeContent,
  job: Record<string, unknown>,
  analysis: string,
  cvStrategy: CVStrategy
): string {
  // 提取经历描述指导
  const framingGuidance = Object.entries(cvStrategy.experienceFraming || {})
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n')

  return `
## Target Position
- **Job Title**: ${job.title}
- **Company**: ${job.company}
- **Industry**: ${job.industry || 'Not specified'}
${job.description ? `- **Key Requirements**: ${(job.description as string).substring(0, 500)}...` : ''}

## CV Strategy (Follow These Guidelines)
- **Tone**: ${cvStrategy.tone} (${getToneDescription(cvStrategy.tone)})
- **Action Verbs to Use**: ${cvStrategy.actionVerbs.join(', ')}
- **Skills to Highlight**: ${cvStrategy.skillsHighlight.join(', ')}
- **Focus Areas**: ${cvStrategy.projectFocus?.join(', ') || 'General'}
- **Content to Avoid**: ${cvStrategy.avoid?.join(', ') || 'None specified'}

${framingGuidance ? `## Experience Framing Guidance\n${framingGuidance}` : ''}

## Original Resume Content
\`\`\`json
${JSON.stringify(content, null, 2)}
\`\`\`

## Your Task: Enhance This Resume

### 1. Professional Summary (careerObjective)
Create a powerful 2-3 sentence professional summary that:
- Opens with years of experience and primary expertise
- Highlights 2-3 key skills matching the target job
- Ends with career objective or value proposition
- Use the ${cvStrategy.tone} tone

### 2. Work Experience (workExperience)
For EACH work experience entry:
- Write 3-5 achievement bullets (CRITICAL: expand if original has fewer)
- Start each bullet with an action verb: ${cvStrategy.actionVerbs.slice(0, 5).join(', ')}
- Include quantifiable results when the original mentions any metrics
- Show impact: What was accomplished? What was the business result?
- Keep descriptions professional and specific

### 3. Skills (skills)
- Prioritize skills mentioned in CV strategy's skillsHighlight
- Group by category if possible (technical, soft, tools)
- Keep only skills present in original content

### 4. Projects (projects)
For EACH project:
- Clear description of what was built (15-30 words)
- Technologies used
- Key outcomes or impact
- Your specific role if mentioned

### 5. Education (education)
- Keep factual information unchanged
- Highlight relevant coursework or achievements if present

### 6. Certifications (certifications)
- Keep as provided, ensure dates are formatted consistently

## Output Format
Return a valid JSON object with the EXACT same structure as the input:
{
  "personalInfo": { ... },
  "careerObjective": "Enhanced summary...",
  "skills": [ ... ],
  "workExperience": [ ... ],
  "projects": [ ... ],
  "education": [ ... ],
  "certifications": [ ... ]
}

IMPORTANT:
- Preserve all field names exactly (camelCase)
- Keep all IDs if present
- Maintain date formats as-is
- Do NOT add fields not in original
`
}

/**
 * 获取tone描述
 */
function getToneDescription(tone: string): string {
  const descriptions: Record<string, string> = {
    technical: 'Use technical terminology, focus on implementation details and metrics',
    executive: 'Emphasize strategic vision, business impact, and leadership',
    creative: 'Show creative thinking and unique perspective',
    conversational: 'Friendly and personable, while remaining professional',
    formal: 'Professional and objective, factual statements',
  }
  return descriptions[tone] || 'Professional and clear'
}
