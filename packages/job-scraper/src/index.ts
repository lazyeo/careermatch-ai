/**
 * 岗位解析器
 *
 * 使用AI从URL或文本内容中智能提取岗位信息
 */

import OpenAI from 'openai'
import TurndownService from 'turndown'
import {
  ParsedJobData,
  cleanJsonResponse,
  parseJsonFromAI,
  tryFixJson
} from '@careermatch/shared'

export type { ParsedJobData }

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  hr: '---',
  bulletListMarker: '-',
  emDelimiter: '*'
})

interface WorkableJobData {
  title?: string
  location?: {
    city?: string
    country?: string
  }
  employment_type?: string
  department?: string
  description?: string
  requirements?: string
  benefits?: string
}

// Add rule to ensure spacing around headings
turndownService.addRule('headingSpacing', {
  filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  replacement: function (content, node, options) {
    const hLevel = Number(node.nodeName.charAt(1))
    const hashes = '#'.repeat(hLevel)
    return '\n\n' + hashes + ' ' + content + '\n\n'
  }
})

// Add rule to improve paragraph spacing
turndownService.addRule('paragraphSpacing', {
  filter: 'p',
  replacement: function (content) {
    return '\n\n' + content + '\n\n'
  }
})

// AI解析Prompt构建函数
function getJobParserPrompt(language: string = 'zh'): string {
  const isEn = language === 'en'

  if (isEn) {
    return `You are a professional recruitment data extraction expert. Your task is to extract structured data from job postings.

## Extraction Instructions
1. **Basic Info**: Job Title, Company Name, Location
2. **Job Type**: Full-time/Part-time/Contract/Internship/Casual
3. **Salary**: Salary Range, Currency (Identify NZD/AUD/USD/CNY etc.)
4. **Description**: Extract the FULL job description. Do not summarize unless it's extremely long (>2000 words), in which case keep the most important details.
5. **Requirements**: Extract the FULL requirements list.
6. **Dates**: Posted Date, Application Deadline
7. **Skills**: Extract specific skills list
8. **Company Info**: Company overview (if provided)

## Job Content:
{CONTENT}

## Output Format
Return strict JSON (no markdown blocks):
{
  "title": "Job Title",
  "company": "Company Name",
  "location": "Location",
  "job_type": "full-time|part-time|contract|internship|casual",
  "salary_min": 80000,
  "salary_max": 120000,
  "salary_currency": "NZD|AUD|USD|CNY",
  "description": "Full description...",
  "requirements": "Full requirements...",
  "benefits": "Benefits...",
  "posted_date": "YYYY-MM-DD",
  "deadline": "YYYY-MM-DD",
  "skills_required": ["Skill1", "Skill2"],
  "experience_years": "3-5 years",
  "education_requirement": "Bachelor's etc.",
  "company_info": "Company overview",
  "application_url": "Application URL"
}

Notes:
1. Use null if a field is missing.
2. Return RAW JSON only.
3. Salary must be numbers.
4. description and requirements should be Markdown formatted text.
`
  }

  // Chinese Version (Default)
  return `你是专业的招聘信息解析专家。你的任务是从招聘信息中提取关键结构化数据。

## 提取指令
1. **基本信息**：岗位标题、公司名称、工作地点
2. **岗位类型**：全职/兼职/合同/实习/临时
3. **薪资信息**：薪资范围、货币类型（智能识别NZD/AUD/USD/CNY等）
4. **岗位详情**：请尽可能提取**完整**的岗位职责描述（description）。不要过度摘要，保留原文的细节和语气。
5. **核心要求**：请尽可能提取**完整**的核心要求（requirements）。
6. **时间信息**：发布日期、申请截止日期
7. **技能清单**：提取所需的具体技能列表
8. **公司信息**：公司简介（如有提供）

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
  "description": "完整的职责描述...",
  "requirements": "完整的要求描述...",
  "benefits": "福利待遇...",
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
3. 薪资字段必须是数字
4. description 和 requirements 建议使用Markdown格式，保留列表结构
`
}

/**
 * Fetch data specifically from Workable API
 */
async function fetchWorkableData(url: string): Promise<string> {
  // Match URL pattern: https://apply.workable.com/<account>/j/<shortcode>/
  const match = url.match(/apply\.workable\.com\/([^/]+)\/j\/([^/]+)/)
  if (!match) return ''

  const [, account, shortcode] = match
  const apiUrl = `https://apply.workable.com/api/v1/accounts/${account}/jobs/${shortcode}`

  try {
    const response = await fetch(apiUrl)
    if (!response.ok) throw new Error(`Workable API returned ${response.status}`)

    const data = await response.json() as WorkableJobData

    // Construct a rich text representation for the AI
    return `
      Title: ${data.title}
      Company: Orion Health (inferred from URL/Context)
      Location: ${data.location?.city}, ${data.location?.country}
      Type: ${data.employment_type}
      Department: ${data.department}
      
      Description:
      ${data.description}
      
      Requirements:
      ${data.requirements}
      
      Benefits:
      ${data.benefits}
      
      Application URL: ${url}
    `
  } catch (error) {
    console.warn('Failed to fetch from Workable API, falling back to standard fetch', error)
    return ''
  }
}

/**
 * 从网页URL抓取内容
 */
export async function fetchJobPageContent(url: string): Promise<string> {
  try {
    // 1. Special handling for Workable
    if (url.includes('apply.workable.com')) {
      const workableContent = await fetchWorkableData(url)
      if (workableContent) {
        console.log('✅ Successfully fetched data from Workable API')
        return workableContent
      }
    }

    // 2. Standard Fetch
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
  model?: string
  scraperUrl?: string
  language?: string
  aiComplete?: (prompt: string) => Promise<string>
}

/**
 * 使用AI解析岗位内容
 */
export async function parseJobContent(
  content: string,
  config?: JobParserConfig
): Promise<ParsedJobData> {
  const language = config?.language || 'zh'
  const fallbackModel =
    config?.model ||
    process.env.OPENAI_MODEL_BEST ||
    process.env.OPENAI_MODEL ||
    'gpt-4o'

  // Clean HTML aggressively to avoid token limits
  console.log(`📝 Original content length: ${content.length} characters`)

  let cleanedContent = content
    // Remove script tags and their content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Remove style tags and their content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Remove comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove SVG tags (can be huge)
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
    // Remove all attributes from HTML tags (keeps structure but removes noise)
    .replace(/<(\w+)[^>]*>/g, '<$1>')
    // Remove HTML tags but keep content
    .replace(/<[^>]+>/g, ' ')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim()

  // Limit to ~80k characters to stay well under 200k token limit (increased for better preservation)
  const MAX_CHARS = 80000
  if (cleanedContent.length > MAX_CHARS) {
    console.warn(`⚠️ Content length ${cleanedContent.length} exceeds ${MAX_CHARS}, truncating...`)
    cleanedContent = cleanedContent.substring(0, MAX_CHARS) + '...[内容已截断]'
  }

  console.log(`✅ Cleaned content length: ${cleanedContent.length} characters`)

  // Convert HTML to Markdown using Turndown for the original_content field
  // We use the original 'content' (or slightly cleaned version) for this, not the aggressive strip-tags version
  // Actually, 'content' passed here might already be HTML.
  // Let's try to convert the raw content first.
  let markdownContent = ''
  try {
    // Basic cleanup for turndown
    const preClean = content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    markdownContent = turndownService.turndown(preClean)
  } catch (e) {
    console.warn('Turndown conversion failed, using raw content', e)
    markdownContent = content
  }

  const promptTemplate = getJobParserPrompt(language)
  const prompt = promptTemplate.replace('{CONTENT}', cleanedContent)

  console.log('🔍 Parsing job posting with AI...')
  console.log(`📊 Language: ${language}`)

  let responseText = ''
  if (config?.aiComplete) {
    responseText = await config.aiComplete(prompt)
  } else {
    const apiKey = config?.apiKey || process.env.OPENAI_API_KEY

    if (!apiKey) {
      throw new Error('No AI provider is configured for job parsing')
    }

    const client = new OpenAI({
      apiKey,
      baseURL: config?.baseUrl || process.env.OPENAI_BASE_URL,
    })
    console.log(`📊 Using OpenAI-compatible fallback model: ${fallbackModel}`)

    const response = await client.chat.completions.create({
      model: fallbackModel,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 16000,
    })

    responseText = response.choices[0]?.message?.content || ''
  }
  console.log(`📝 AI response length: ${responseText.length}`)

  // 解析JSON
  try {
    const parsed = parseJsonFromAI<ParsedJobData>(responseText)
    console.log('✅ Successfully parsed job data')

    return sanitizeJobData({
      ...parsed,
      original_content: markdownContent,
      formatted_original_content: markdownContent
    })
  } catch (error) {
    console.error('❌ Failed to parse AI response:', error)
    console.error('Response text preview:', responseText.substring(0, 500))

    // 尝试修复JSON
    try {
      const fixedJson = tryFixJson(responseText)
      const parsed = JSON.parse(fixedJson) as ParsedJobData
      console.log('✅ Successfully parsed job data after fix')
      return sanitizeJobData({
        ...parsed,
        original_content: markdownContent,
        formatted_original_content: markdownContent
      })
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
      if (config.language) {
        workerUrl.searchParams.set('language', config.language)
      }

      const response = await fetch(workerUrl.toString(), {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Worker returned ${response.status}: ${await response.text()}`)
      }

      const data = await response.json() as ParsedJobData

      // Validate the data - if essential fields are missing, consider it a failure
      if (!data.title || !data.company) {
        throw new Error('Worker returned incomplete data (missing title or company)')
      }

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
    original_content: data.original_content || undefined,
    formatted_original_content: data.formatted_original_content || undefined,
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
