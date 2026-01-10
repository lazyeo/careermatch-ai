/**
 * 8维度岗位分析 API V2 - 流式版本
 *
 * POST /api/jobs/[id]/analyze-v2/stream
 * 流式输出8维度分析，避免超时问题
 *
 * Body: { provider?: AIProviderType, force?: boolean }
 * Returns: SSE stream with analysis chunks
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
import { NextRequest } from 'next/server'
import type { FullProfile, AnalysisDimensions } from '@careermatch/shared'
import {
  getJobMatchingV2SystemPrompt,
  buildJobMatchingV2Prompt,
  parseJobMatchingV2Output,
  generateDefaultCVStrategy,
  type JobMatchingV2Output,
} from '@/lib/ai/prompts/features/job-matching-v2'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
    const supabase = await createClient()

    // 1. 验证用户
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 2. 检查AI配置
    if (!isAnyAIConfigured()) {
      return new Response(
        JSON.stringify({ error: 'No AI provider is configured' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 3. 解析请求参数
    const body = await request.json()
    const { provider, force, locale } = body as {
      provider?: AIProviderType
      force?: boolean
      locale?: string
    }

    // 获取语言设置
    const language = locale || 'zh'

    // 4. 检查缓存（除非force=true）
    if (!force) {
      const { data: existingSession } = await supabase
        .from('analysis_sessions')
        .select('*')
        .eq('job_id', jobId)
        .eq('user_id', user.id)
        .not('dimensions', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existingSession) {
        console.log('✅ Returning cached V2 analysis session')
        // 返回缓存结果（非流式）
        const encoder = new TextEncoder()
        const cached = JSON.stringify({
          done: true,
          cached: true,
          sessionId: existingSession.id,
          score: existingSession.score,
          recommendation: existingSession.recommendation,
          analysis: existingSession.analysis,
          dimensions: existingSession.dimensions,
          provider: existingSession.provider,
          model: existingSession.model,
        })
        return new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode(`data: ${cached}\n\n`))
              controller.close()
            },
          }),
          {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
            },
          }
        )
      }
    }

    // 5. 获取岗位信息
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 6. 获取Profile数据
    const fullProfile = await fetchFullProfile(supabase, user.id)
    if (!fullProfile || !fullProfile.profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found. Please complete your profile first.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 7. 构建分析参数
    const providerName = provider || getDefaultProvider()?.type || 'openai'
    const model = getBestModel(provider)

    console.log(`🤖 [V2 Stream] Starting 8-dimension analysis with ${providerName.toUpperCase()}`)
    console.log(`📊 Using model: ${model}`)

    // 8. 构建profile数据
    const profileData = {
      fullName: fullProfile.profile.full_name,
      location: fullProfile.profile.location,
      careerObjective: fullProfile.profile.professional_summary,
      skills: (fullProfile.skills || []).map((s) => ({
        name: s.name,
        level: s.level,
        category: s.category,
      })),
      workExperience: (fullProfile.work_experiences || []).map((w) => ({
        company: w.company,
        position: w.position,
        startDate: w.start_date,
        endDate: w.is_current ? undefined : w.end_date,
        isCurrent: w.is_current,
        description: w.description,
        achievements: w.achievements,
      })),
      education: (fullProfile.education_records || []).map((e) => ({
        institution: e.institution,
        degree: e.degree,
        major: e.major,
        startDate: e.start_date,
        endDate: e.is_current ? undefined : e.end_date,
        gpa: e.gpa,
      })),
      projects: (fullProfile.projects || []).map((p) => ({
        name: p.name,
        description: p.description,
        technologies: p.technologies,
        highlights: p.highlights,
      })),
      certifications: (fullProfile.certifications || []).map((c) => ({
        name: c.name,
        issuer: c.issuer,
        issueDate: c.issue_date,
      })),
    }

    // 9. 构建Prompt (传递语言参数)
    const userPrompt = buildJobMatchingV2Prompt({
      job: {
        title: job.title as string,
        company: job.company as string,
        location: job.location as string | undefined,
        job_type: job.job_type as string | undefined,
        salary_min: job.salary_min as number | undefined,
        salary_max: job.salary_max as number | undefined,
        salary_currency: job.salary_currency as string | undefined,
        description: job.description as string | undefined,
        requirements: job.requirements as string | undefined,
        benefits: job.benefits as string | undefined,
      },
      profile: profileData,
    }, language)

    // 10. 创建AI流式请求
    const aiProviderType = provider || getDefaultProvider()?.type || 'openai'
    const systemPrompt = getJobMatchingV2SystemPrompt(language)
    console.log(`🌐 Using language: ${language}`)

    let stream: any

    if (aiProviderType === 'claude') {
      const { createAnthropicClient } = await import('@/lib/ai-providers')
      const client = createAnthropicClient()

      stream = await client.messages.create({
        model: model,
        max_tokens: 4096, // Anthropic max tokens
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        stream: true,
      })
    } else {
      const aiClient = createAIClient(provider)

      stream = await aiClient.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: TEMPERATURE_PRESETS.BALANCED,
        max_tokens: 16384,
        stream: true,
      })
    }

    // 11. 创建流式响应
    const encoder = new TextEncoder()
    let fullResponse = ''

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            let content = ''

            // Handle different stream formats
            if (aiProviderType === 'claude') {
              if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                content = chunk.delta.text
              }
            } else {
              // OpenAI format
              content = chunk.choices?.[0]?.delta?.content || ''
            }

            if (content) {
              fullResponse += content

              // 实时发送每个内容块
              try {
                const progressData = JSON.stringify({
                  content,
                  fullContent: fullResponse,
                  progress: Math.min(95, Math.floor(fullResponse.length / 500)),
                  done: false,
                })
                controller.enqueue(encoder.encode(`data: ${progressData}\n\n`))
              } catch {
                console.log('Client disconnected during streaming')
                return
              }
            }
          }

          console.log('📝 Raw V2 AI response length:', fullResponse.length)

          // 12. 解析V2响应
          let parsed: JobMatchingV2Output | null = parseJobMatchingV2Output(fullResponse)

          if (!parsed) {
            console.warn('⚠️ V2 parsing failed, using fallback')
            // 使用降级解析
            const scoreMatch = fullResponse.match(/---SCORE---\s*(\d+)/i)
            const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 50

            const recMatch = fullResponse.match(
              /---RECOMMENDATION---\s*(strong_match|good_match|moderate_match|weak_match|not_recommended)/i
            )
            const recommendation = (recMatch?.[1] || 'moderate_match') as JobMatchingV2Output['recommendation']

            const analysisMatch = fullResponse.match(
              /---ANALYSIS---\s*([\s\S]*?)(?:---END---|$)/i
            )
            const analysis = analysisMatch?.[1]?.trim() || 'Analysis not available'

            const skillNames = profileData.skills?.map((s) => s.name) || []
            const defaultStrategy = generateDefaultCVStrategy(
              job.title as string,
              skillNames
            )

            parsed = {
              score,
              recommendation,
              dimensions: createDefaultDimensions(job, defaultStrategy, score, recommendation),
              analysis,
            }
          }

          // 13. 保存到数据库
          // 映射 recommendation 值以匹配数据库约束
          // AI返回: strong_match, good_match, moderate_match, weak_match, not_recommended
          // 数据库接受: strong, moderate, weak, not_recommended
          const dbRecommendation = mapRecommendationForDB(parsed.recommendation)

          const { data: savedSession, error: saveError } = await supabase
            .from('analysis_sessions')
            .insert({
              job_id: jobId,
              resume_id: null,
              user_id: user.id,
              status: 'active',
              score: parsed.score,
              recommendation: dbRecommendation,
              analysis: parsed.analysis,
              dimensions: parsed.dimensions,
              provider: providerName,
              model: model,
            })
            .select()
            .single()

          if (saveError) {
            console.error('Error saving V2 analysis session:', saveError)
            // 保存失败时发送错误
            try {
              const errorData = JSON.stringify({
                error: `Failed to save analysis: ${saveError.message}`,
                done: true,
              })
              controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
              controller.close()
            } catch {
              console.log('Controller already closed')
            }
            return
          }

          console.log('✅ V2 Streaming Analysis completed and saved:', savedSession.id)

          // 14. 发送最终结果
          try {
            const finalData = JSON.stringify({
              done: true,
              sessionId: savedSession.id,
              score: parsed.score,
              recommendation: parsed.recommendation,
              analysis: parsed.analysis,
              dimensions: parsed.dimensions,
              provider: providerName,
              model: model,
            })
            controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))
            controller.close()
          } catch {
            console.log('Client disconnected before receiving final message')
          }
        } catch (error) {
          console.error('Stream error:', error)
          try {
            const errorData = JSON.stringify({
              error: error instanceof Error ? error.message : 'Stream error',
              done: true,
            })
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
            controller.close()
          } catch {
            console.log('Controller already closed, cannot send error message')
          }
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error in POST /api/jobs/[id]/analyze-v2/stream:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
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

function createDefaultDimensions(
  job: Record<string, unknown>,
  defaultStrategy: ReturnType<typeof generateDefaultCVStrategy>,
  score: number,
  recommendation: JobMatchingV2Output['recommendation']
): AnalysisDimensions {
  return {
    rolePositioning: {
      summary: `${job.title} at ${job.company}`,
      level: 'mid',
      domain: 'Unknown',
      primaryFunction: 'Unknown',
      candidateFit: {
        currentLevel: 'Unknown',
        targetLevel: 'Unknown',
        gap: 'Unable to determine',
        readiness: 'gap',
      },
    },
    coreResponsibilities: {
      responsibilities: [],
      coverageScore: 0,
      summary: 'Analysis incomplete',
    },
    keywordMatching: {
      keywords: [],
      requiredMatchRate: 0,
      overallMatchRate: 0,
      atsFriendliness: 'fair',
      suggestedAdditions: [],
    },
    keyRequirements: {
      requirements: [],
      mandatoryFulfillmentRate: 0,
      overallFulfillmentRate: 0,
      majorGaps: [],
      majorStrengths: [],
    },
    swotAnalysis: {
      strengths: [],
      weaknesses: [],
      opportunities: [],
      threats: [],
      overallAssessment: 'Analysis incomplete',
    },
    cvStrategy: defaultStrategy,
    interviewPreparation: {
      likelyQuestions: [],
      questionsToAsk: [],
      technicalReview: [],
      projectStories: [],
      tips: [],
    },
    matchScore: {
      overall: score,
      breakdown: {
        skillsScore: 0,
        experienceScore: 0,
        educationScore: 0,
        cultureFitScore: 0,
        careerFitScore: 0,
      },
      confidence: 'low',
      recommendation: recommendation,
      summary: 'Detailed analysis not available',
    },
  }
}

/**
 * 将AI返回的recommendation值映射为数据库接受的格式
 * AI返回: strong_match, good_match, moderate_match, weak_match, not_recommended
 * 数据库接受: strong, moderate, weak, not_recommended
 */
function mapRecommendationForDB(aiRecommendation: string): string {
  const mapping: Record<string, string> = {
    'strong_match': 'strong',
    'good_match': 'moderate',      // good_match 映射为 moderate
    'moderate_match': 'moderate',
    'weak_match': 'weak',
    'not_recommended': 'not_recommended',
  }
  return mapping[aiRecommendation] || 'moderate'  // 默认返回 moderate
}
