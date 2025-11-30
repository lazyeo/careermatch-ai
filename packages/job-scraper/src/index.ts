/**
 * 岗位解析器
 *
 * 使用AI从URL或文本内容中智能提取岗位信息
 */

import OpenAI from 'openai'

// 解析后的岗位数据结构
export interface ParsedJobData {
  title: string
  company: string
  location?: string
  job_type?: 'full-time' | 'part-time' | 'contract' | 'internship' | 'casual'
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  description?: string
  requirements?: string
  benefits?: string
  posted_date?: string
  deadline?: string
  // 扩展信息
  skills_required?: string[]
  experience_years?: string
  education_requirement?: string
  company_info?: string
  application_url?: string
}

// AI解析Prompt
const PARSE_JOB_PROMPT = `你是专业的招聘信息解析专家。你的任务是从招聘信息中**主动挖掘**所有有价值的信息。

## 核心原则
1. **准确提取**：精确识别岗位的核心信息
2. **结构化输出**：将非结构化的招聘文本转换为结构化数据
3. **智能推断**：对于隐含信息，基于上下文进行合理推断

## 提取指令
1. **基本信息**：岗位标题、公司名称、工作地点
2. **岗位类型**：全职/兼职/合同/实习/临时
3. **薪资信息**：薪资范围、货币类型（智能识别NZD/AUD/USD/CNY等）
4. **岗位描述**：工作职责、日常任务
5. **岗位要求**：技能要求、经验要求、学历要求
6. **福利待遇**：公司福利、额外benefits
7. **时间信息**：发布日期、申请截止日期
8. **技能清单**：提取所需的具体技能列表
9. **公司信息**：公司简介（如有提供）

## 格式化规则
- 日期格式化为 YYYY-MM-DD
- 薪资转换为数字（去除货币符号和逗号）
- 岗位类型映射：full-time/part-time/contract/internship/casual
- 如果薪资是按小时/周/月计算，尝试换算为年薪

## 招聘信息内容：
{CONTENT}

## 输出格式
返回严格的JSON（不要用markdown代码块包裹）：
{
  "title": "岗位标题",
  "company": "公司名称",
  "location": "工作地点",
  "job_type": "full-time|part-time|contract|internship|casual",
  "salary_min": 80000,
  "salary_max": 120000,
  "salary_currency": "NZD|AUD|USD|CNY",
  "description": "岗位描述和职责",
  "requirements": "岗位要求（技能、经验、学历等）",
  "benefits": "福利待遇",
  "posted_date": "YYYY-MM-DD",
  "deadline": "YYYY-MM-DD",
  "skills_required": ["技能1", "技能2"],
  "experience_years": "3-5年",
  "education_requirement": "本科及以上",
  "company_info": "公司简介",
  "application_url": "申请链接"
}

注意：
1. 如果某个字段找不到信息，使用null或省略该字段
2. 不要返回markdown代码块，直接返回JSON
3. 薪资字段必须是数字，不是字符串`

/**
 * 从网页URL抓取内容
 */
export async function fetchJobPageContent(url: string): Promise<string> {
  try {
    // 使用无头浏览器或简单fetch获取页面内容
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`)
    }

    const html = await response.text()

    // 简单的HTML清理 - 移除脚本和样式
    let text = html
      // 移除script标签
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      // 移除style标签
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      // 移除注释
      .replace(/<!--[\s\S]*?-->/g, '')
      // 移除HTML标签但保留内容
      .replace(/<[^>]+>/g, ' ')
      // 解码HTML实体
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // 清理多余空白
      .replace(/\s+/g, ' ')
      .trim()

    // 限制长度，避免token过长
    if (text.length > 15000) {
      text = text.substring(0, 15000) + '...[内容已截断]'
    }

    return text
  } catch (error) {
    console.error('Error fetching job page:', error)
    throw new Error(`无法获取页面内容: ${(error as Error).message}`)
  }
}

/**
 * 使用AI解析岗位内容
 */
export interface JobParserConfig {
  apiKey?: string
  baseUrl?: string
  scraperUrl?: string
}

/**
 * 使用AI解析岗位内容
 */
export async function parseJobContent(
  content: string,
  config?: JobParserConfig
): Promise<ParsedJobData> {
  const apiKey = config?.apiKey || process.env.CLAUDE_API_KEY
  const baseUrl =
    config?.baseUrl ||
    process.env.CLAUDE_BASE_URL ||
    'https://relay.a-dobe.club/api/v1'

  if (!apiKey) {
    throw new Error('CLAUDE_API_KEY is not configured')
  }

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseUrl,
  })

  const model = 'claude-sonnet-4-5-20250929'
  const prompt = PARSE_JOB_PROMPT.replace('{CONTENT}', content)

  console.log('🔍 Parsing job posting with AI...')
  console.log(`📊 Using model: ${model}`)
  console.log(`📝 Content length: ${content.length} characters`)

  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.1,
    max_tokens: 4000,
  })

  const responseText = response.choices[0]?.message?.content || ''
  console.log(`📝 AI response length: ${responseText.length}`)

  // 解析JSON
  try {
    const { parseJsonFromAI } = await import('@careermatch/shared')
    const parsed = parseJsonFromAI<ParsedJobData>(responseText)
    console.log('✅ Successfully parsed job data')

    return sanitizeJobData(parsed)
  } catch (error) {
    console.error('❌ Failed to parse AI response:', error)
    console.error('Response text preview:', responseText.substring(0, 500))

    // 尝试修复JSON
    try {
      const { tryFixJson } = await import('@careermatch/shared')
      const fixedJson = tryFixJson(responseText)
      const parsed = JSON.parse(fixedJson) as ParsedJobData
      console.log('✅ Successfully parsed job data after fix')
      return sanitizeJobData(parsed)
    } catch {
      console.error('❌ Failed to fix JSON')
      throw new Error('AI返回的数据格式无效')
    }
  }
}

/**
 * 从URL解析岗位信息
 */
export async function parseJobFromUrl(
  url: string,
  config?: JobParserConfig
): Promise<ParsedJobData> {
  console.log(`🌐 Fetching job page: ${url}`)

  // If a scraper worker URL is configured, delegate the task to it
  if (config?.scraperUrl) {
    console.log(`🚀 Delegating to Cloudflare Worker: ${config.scraperUrl}`)
    try {
      const workerUrl = new URL(config.scraperUrl)
      workerUrl.searchParams.set('url', url)

      const response = await fetch(workerUrl.toString(), {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Worker returned ${response.status}: ${await response.text()}`)
      }

      const data = await response.json() as ParsedJobData
      console.log('✅ Worker successfully parsed job data')
      return sanitizeJobData(data)
    } catch (error) {
      console.error('❌ Worker delegation failed, falling back to local fetch:', error)
      // Fallback to local execution if worker fails
    }
  }

  const content = await fetchJobPageContent(url)
  console.log(`📄 Fetched ${content.length} characters`)

  return parseJobContent(content, config)
}

/**
 * 尝试修复常见的JSON格式问题
 */
// Keeping local name removed; use shared tryFixJson from json-utils when needed

/**
 * 清理和验证解析的岗位数据
 */
function sanitizeJobData(data: ParsedJobData): ParsedJobData {
  const validJobTypes = [
    'full-time',
    'part-time',
    'contract',
    'internship',
    'casual',
  ]
  const validCurrencies = ['NZD', 'AUD', 'USD', 'CNY', 'EUR', 'GBP']

  return {
    title: data.title || '',
    company: data.company || '',
    location: data.location || undefined,
    job_type: validJobTypes.includes(data.job_type as string)
      ? (data.job_type as ParsedJobData['job_type'])
      : undefined,
    salary_min:
      typeof data.salary_min === 'number' && data.salary_min > 0
        ? data.salary_min
        : undefined,
    salary_max:
      typeof data.salary_max === 'number' && data.salary_max > 0
        ? data.salary_max
        : undefined,
    salary_currency: validCurrencies.includes(data.salary_currency as string)
      ? data.salary_currency
      : 'NZD',
    description: data.description || undefined,
    requirements: data.requirements || undefined,
    benefits: data.benefits || undefined,
    posted_date: formatDate(data.posted_date),
    deadline: formatDate(data.deadline),
    skills_required: ensureStringArray(data.skills_required),
    experience_years: data.experience_years || undefined,
    education_requirement: data.education_requirement || undefined,
    company_info: data.company_info || undefined,
    application_url: data.application_url || undefined,
  }
}

/**
 * 格式化日期
 */
function formatDate(date?: string): string | undefined {
  if (!date) return undefined

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date
  }

  try {
    const parsed = new Date(date)
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0]
    }
  } catch {
    // 忽略解析错误
  }

  return undefined
}

/**
 * 确保是字符串数组
 */
function ensureStringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const filtered = value.filter((v) => typeof v === 'string' && v.trim())
    return filtered.length > 0 ? filtered : undefined
  }
  return undefined
}
