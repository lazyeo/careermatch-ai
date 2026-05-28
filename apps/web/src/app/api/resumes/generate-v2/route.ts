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
  createAICompletion,
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
import { fitResumeContentToOnePageBudget } from '@/lib/resume-content-budget'
import { buildGeneratedResumeTitle } from '@/lib/resumes/resume-title'
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

    const enhancedContent = fitResumeContentToOnePageBudget(await enhanceWithAI(
      optimizedContent,
      job,
      session.analysis as string,
      cvStrategy,
      provider
    ))

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
    const resumeTitle = buildGeneratedResumeTitle(job)

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
  const prompt = buildEnhancementPrompt(optimizedContent, job, analysis, cvStrategy)

  const response = await createAICompletion({
    messages: [
      {
        role: 'system',
        content: `You are an elite resume strategist who has helped thousands land jobs at Google, Meta, Amazon, and Fortune 500 companies.

**CORE MISSION**: Create a HIGHLY TARGETED one-page resume that speaks directly to the specific job posting. This is NOT about listing everything - it's about strategic positioning.

**THE GOLDEN RULE**: Every single line must answer: "Why should THIS company hire THIS person for THIS specific role?"

## CRITICAL CUSTOMIZATION REQUIREMENTS:

### 1. Professional Summary (MOST IMPORTANT)
Write a compelling 2-sentence summary that:
- Opens with exact years of experience in the SPECIFIC field the job requires
- Names 2-3 skills that DIRECTLY match the job requirements
- Mentions a quantified achievement relevant to the target role
- Ends with why you're excited about THIS specific role/company
- NEVER use generic phrases like "seeking new opportunities" or "passionate professional"

### 2. Work Experience Transformation
For EACH position, you MUST:
- Reframe achievements to highlight skills the TARGET JOB requires
- Add 2-3 high-impact bullet points
- Start EVERY bullet with a STRONG action verb
- Include AT LEAST one metric/number per bullet (estimate reasonably if needed)
- Connect each achievement to a requirement in the job posting
- Use the EXACT terminology from the job description where applicable

### 3. Skills Prioritization
- Put skills mentioned in the job posting FIRST
- Remove or deprioritize skills not relevant to this specific role
- Match the exact phrasing used in the job description

### 4. Projects Selection
- Highlight projects using technologies mentioned in the job
- Reframe project outcomes to match job requirements
- Keep only 1-2 most relevant projects, with concise technical depth or business impact

## ACCURACY CONSTRAINTS:
- DO NOT invent facts, but DO expand and add context
- Transform vague statements into specific, impactful ones
- Estimate reasonable metrics where the original implies success
- Reframe existing experience to highlight relevant transferable skills

## OUTPUT FORMAT:
Return valid JSON with the exact input structure. All content must be in English.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: TEMPERATURE_PRESETS.ANALYTICAL,
    maxTokens: 16384,
  }, provider)

  const responseText = response.content
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

  // 提取岗位关键词
  const jobDescription = (job.description as string) || ''
  const jobRequirements = (job.requirements as string) || ''
  const fullJobContext = `${jobDescription}\n${jobRequirements}`.trim()

  // 构建重点权重说明
  const emphasisGuide = cvStrategy.emphasis
    ? Object.entries(cvStrategy.emphasis)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([section, weight]) => `- ${section}: ${weight}% importance`)
      .join('\n')
    : ''

  return `
# TARGET JOB ANALYSIS

## Position Details
- **Job Title**: ${job.title}
- **Company**: ${job.company}
- **Location**: ${job.location || 'Not specified'}
- **Job Type**: ${job.job_type || 'Not specified'}

## Full Job Description & Requirements
\`\`\`
${fullJobContext || 'No detailed description available'}
\`\`\`

## KEY REQUIREMENTS EXTRACTED (Use these exact terms in resume!)
Skills to highlight: ${cvStrategy.skillsHighlight.join(', ')}
Project focus areas: ${cvStrategy.projectFocus?.join(', ') || 'General technical projects'}
Content to AVOID: ${cvStrategy.avoid?.join(', ') || 'Nothing specific'}

---

# CV STRATEGY (MUST FOLLOW)

## Writing Tone: ${cvStrategy.tone.toUpperCase()}
${getToneDescription(cvStrategy.tone)}

## Action Verbs to Use (Start EVERY bullet with one of these):
${cvStrategy.actionVerbs.join(', ')}

## Section Priority (Focus effort on high-weight sections):
${emphasisGuide || 'All sections equal priority'}

${framingGuidance ? `## Experience Framing Guidance:\n${framingGuidance}` : ''}

---

# CANDIDATE'S ORIGINAL CONTENT

\`\`\`json
${JSON.stringify(content, null, 2)}
\`\`\`

---

# YOUR TRANSFORMATION TASK

## 1. Professional Summary (careerObjective)
WRITE a powerful 2-sentence summary that:
- States exact years of relevant experience (calculate from work history)
- Names ${cvStrategy.skillsHighlight.slice(0, 3).join(', ')} as core competencies
- Includes ONE impressive metric from work history if available
- Connects directly to "${job.title}" at "${job.company}"
- Uses ${cvStrategy.tone} tone throughout

Keep it under 55 words.

## 2. Work Experience (CRITICAL - Most important section)
For EACH position:
- REWRITE description to highlight ${cvStrategy.skillsHighlight.slice(0, 5).join(', ')}
- KEEP only the 2-3 strongest achievement bullets
- Each bullet format: "[Action Verb] + [What you did] + [Quantified result] + [Business impact]"
- USE terminology from the job description
- EVERY bullet must start with: ${cvStrategy.actionVerbs.slice(0, 5).join(' / ')}

## 3. Skills (Reorder by relevance)
Put these skills FIRST: ${cvStrategy.skillsHighlight.join(', ')}
Then add other relevant skills from original content

## 4. Projects (Align with job requirements)
- Emphasize technologies matching: ${cvStrategy.projectFocus?.join(', ') || 'job requirements'}
- Keep at most 2 projects
- Use 1 concise outcome/metric per project

## 5. Education & Certifications
- Keep factual, add relevant coursework if applicable

---

# OUTPUT REQUIREMENTS

Return ONLY a valid JSON object:
{
  "personalInfo": { fullName, email, phone, location, linkedIn, github, website },
  "careerObjective": "Your enhanced 2-sentence summary...",
  "skills": [{ "name": "skill", "category": "category" }, ...],
  "workExperience": [{ company, position, startDate, endDate, isCurrent, description, achievements: ["bullet1", "bullet2", ...] }, ...],
  "projects": [{ name, description, technologies: [], highlights: [] }, ...],
  "education": [{ institution, degree, major, startDate, endDate, gpa }, ...],
  "certifications": [{ name, issuer, issueDate }, ...]
}

CRITICAL RULES:
- ALL text in English
- Keep original field names (camelCase)
- Keep IDs if present
- Do NOT invent new facts, only enhance/expand existing ones
- One-page budget: max 18 skills, max 3 work experiences, max 2-3 bullets per role, max 2 projects, max 3 certifications
`
}

/**
 * 获取tone描述
 */
function getToneDescription(tone: string): string {
  const descriptions: Record<string, string> = {
    technical: `Write like a senior engineer:
- Use technical terminology precisely (APIs, microservices, CI/CD, etc.)
- Include specific technologies, frameworks, and tools
- Focus on system design, scalability, and performance metrics
- Example: "Architected a distributed microservices system handling 10M+ daily requests with 99.9% uptime"`,

    executive: `Write like a C-level executive:
- Emphasize strategic vision and business outcomes
- Focus on revenue impact, cost savings, and market growth
- Highlight leadership and team-building achievements
- Example: "Led digital transformation initiative that increased revenue by $5M annually"`,

    creative: `Write like a creative professional:
- Show innovation and unique problem-solving approaches
- Emphasize design thinking and user-centric outcomes
- Include portfolio-worthy project descriptions
- Example: "Reimagined the user onboarding experience, increasing engagement by 40%"`,

    conversational: `Write in a warm, personable tone:
- Use active voice and accessible language
- Show personality while maintaining professionalism
- Focus on collaboration and team contributions
- Example: "Partnered with cross-functional teams to ship features loved by 100K users"`,

    formal: `Write in traditional professional style:
- Use objective, factual statements
- Maintain conservative formatting and language
- Focus on credentials and established achievements
- Example: "Managed portfolio of $50M in client assets with consistent above-benchmark returns"`,
  }
  return descriptions[tone] || 'Professional and clear communication style'
}
