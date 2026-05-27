/**
 * 简历解析器
 *
 * 使用AI从PDF/Word/Text文件中主动挖掘所有有价值的信息
 */

import OpenAI from 'openai'
import type { ParsedResumeData, SkillLevel } from '@careermatch/shared'

// 改进的解析Prompt - 主动挖掘所有有价值信息
const PARSE_PROMPT = `你是专业的简历解析专家和职业顾问。你的任务是从简历中**主动挖掘**所有有价值的信息。

## 核心原则
1. **主动挖掘**：不要被动等待信息出现，要主动识别简历中的每一个有价值的细节
2. **信息完整性**：即使是隐含的、不明显的信息也要尝试提取
3. **灵活扩展**：对于标准字段之外的信息，使用 extended_data 字段保存

## 提取指令
1. **基本信息**：姓名、联系方式、社交链接、所在地等
2. **职业经历**：完整提取每份工作的公司、职位、时间、职责、成就、使用的技术
3. **教育背景**：学校、学位、专业、时间、GPA、荣誉奖项
4. **技能清单**：主动识别技术技能、软技能、语言能力、工具熟练度
5. **项目经历**：项目名称、描述、角色、技术栈、成果亮点
6. **证书资质**：证书名称、颁发机构、有效期
7. **其他有价值信息**：
   - 志愿者经历、社区贡献
   - 发表的文章、演讲、专利
   - 兴趣爱好（如果与求职相关）
   - 推荐人信息
   - 期望薪资、工作偏好
   - 任何其他独特的、有价值的信息

## 格式化规则
- 日期格式化为 YYYY-MM-DD（仅有年份时用 YYYY-01-01）
- "至今"/"Present"/"Current" → is_current=true, end_date=null
- 技能分类：编程语言、框架、工具、软技能、语言等
- 保留原始措辞，尤其是成就描述

## 简历内容：
{CONTENT}

## 输出格式
返回严格的JSON（不要用markdown代码块包裹），包含标准字段和扩展字段：
{
  "personal_info": {
    "full_name": "姓名",
    "email": "邮箱",
    "phone": "电话",
    "location": "所在地",
    "linkedin_url": "LinkedIn链接",
    "github_url": "GitHub链接",
    "website_url": "个人网站",
    "professional_summary": "职业摘要/个人简介"
  },
  "work_experiences": [
    {
      "company": "公司名称",
      "position": "职位",
      "location": "工作地点",
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD或null",
      "is_current": false,
      "description": "工作描述",
      "achievements": ["成就1", "成就2"],
      "technologies": ["技术1", "技术2"]
    }
  ],
  "education": [
    {
      "institution": "学校名称",
      "degree": "学位",
      "major": "专业",
      "location": "地点",
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD或null",
      "is_current": false,
      "gpa": 3.8,
      "achievements": ["荣誉/奖项"]
    }
  ],
  "skills": [
    {
      "name": "技能名称",
      "level": "beginner|intermediate|advanced|expert",
      "category": "分类（如：编程语言、框架、工具、软技能、语言等）"
    }
  ],
  "projects": [
    {
      "name": "项目名称",
      "description": "项目描述",
      "role": "角色",
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD",
      "technologies": ["技术1"],
      "highlights": ["亮点1"],
      "url": "项目链接",
      "github_url": "GitHub链接"
    }
  ],
  "certifications": [
    {
      "name": "证书名称",
      "issuer": "颁发机构",
      "issue_date": "YYYY-MM-DD",
      "expiry_date": "YYYY-MM-DD或null",
      "credential_id": "证书编号",
      "credential_url": "验证链接"
    }
  ],
  "extended_data": {
    "volunteer_experience": [
      {
        "organization": "组织名称",
        "role": "角色",
        "period": "时间段",
        "description": "描述"
      }
    ],
    "publications": [
      {
        "title": "标题",
        "type": "文章|演讲|专利",
        "date": "日期",
        "url": "链接"
      }
    ],
    "languages": [
      {
        "language": "语言",
        "proficiency": "熟练程度"
      }
    ],
    "references": [
      {
        "name": "姓名",
        "relationship": "关系",
        "contact": "联系方式"
      }
    ],
    "preferences": {
      "expected_salary": "期望薪资",
      "preferred_locations": ["偏好地点"],
      "job_types": ["工作类型偏好"],
      "availability": "可到岗时间"
    },
    "additional_sections": [
      {
        "title": "部分标题",
        "content": "格式化的内容（可以是字符串或对象）"
      }
    ]
  }
}

注意：
1. extended_data 中的字段是可选的，只有在简历中存在相关信息时才需要填写
2. 如果某个字段找不到信息，使用空字符串、空数组或null
3. 不要返回markdown代码块，直接返回JSON`

/**
 * 从文本内容解析简历
 */
export async function parseResumeContent(
  content: string,
  options?: {
    aiComplete?: (prompt: string) => Promise<string>
    apiKey?: string
    baseUrl?: string
    model?: string
  }
): Promise<ParsedResumeData> {
  const model =
    options?.model ||
    process.env.OPENAI_MODEL_BEST ||
    process.env.OPENAI_MODEL ||
    'gpt-4o'

  // 限制内容长度，避免超过API token限制
  // 估算：200k chars ≈ 100-130k tokens (取决于语言混合比例)
  // 加上prompt本身约5-10k tokens，总共不会超过150k tokens
  const MAX_CONTENT_LENGTH = 200000 // characters
  let processedContent = content

  if (content.length > MAX_CONTENT_LENGTH) {
    console.warn(`⚠️  Resume content too long (${content.length} chars), truncating to ${MAX_CONTENT_LENGTH} chars`)
    processedContent = content.substring(0, MAX_CONTENT_LENGTH) + '\n\n[Content truncated due to length limit]'
  }

  const prompt = PARSE_PROMPT.replace('{CONTENT}', processedContent)

  console.log('🔍 Parsing resume with AI...')
  console.log(`📊 Using model: ${model}`)
  console.log(`📏 Content length: ${processedContent.length} chars`)

  let responseText = ''
  if (options?.aiComplete) {
    responseText = await options.aiComplete(prompt)
  } else {
    const apiKey = options?.apiKey || process.env.OPENAI_API_KEY

    if (!apiKey) {
      throw new Error('No AI provider is configured for resume parsing')
    }

    const client = new OpenAI({
      apiKey,
      baseURL: options?.baseUrl || process.env.OPENAI_BASE_URL,
    })

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 8000,
    })

    responseText = response.choices[0]?.message?.content || ''
  }
  console.log(`📝 AI response length: ${responseText.length}`)

  // 尝试解析JSON
  try {
    const { parseJsonFromAI, tryFixJson } = await import('@careermatch/shared')
    const parsed = parseJsonFromAI<ParsedResumeData>(responseText)
    console.log('✅ Successfully parsed resume data')

    // 验证和清理数据
    return sanitizeParsedData(parsed)
  } catch (error) {
    console.error('❌ Failed to parse AI response:', error)
    console.error('Response text preview:', responseText.substring(0, 500))

    // 尝试修复常见JSON问题
    try {
      const { tryFixJson } = await import('@careermatch/shared')
      const fixedJson = tryFixJson(responseText)
      const parsed = JSON.parse(fixedJson) as ParsedResumeData
      console.log('✅ Successfully parsed resume data after fix')
      return sanitizeParsedData(parsed)
    } catch {
      console.error('❌ Failed to fix JSON')
      // 返回空结构
      return getEmptyParsedData()
    }
  }
}

/**
 * 尝试修复常见的JSON格式问题
 */
// Local fixer removed; using shared tryFixJson from json-utils

/**
 * 清理和验证解析的数据
 */
function sanitizeParsedData(data: ParsedResumeData): ParsedResumeData {
  // 确保所有必需的字段存在
  return {
    personal_info: {
      full_name: data.personal_info?.full_name || '',
      email: data.personal_info?.email || '',
      phone: data.personal_info?.phone,
      location: data.personal_info?.location,
      linkedin_url: data.personal_info?.linkedin_url,
      github_url: data.personal_info?.github_url,
      website_url: data.personal_info?.website_url,
      professional_summary: data.personal_info?.professional_summary,
    },
    work_experiences: (data.work_experiences || []).map((w) => ({
      company: w.company || '',
      position: w.position || '',
      location: w.location,
      start_date: formatDate(w.start_date) || '',
      end_date: w.end_date ? formatDate(w.end_date) : undefined,
      is_current: w.is_current || false,
      description: w.description,
      achievements: ensureArray(w.achievements),
      technologies: ensureArray(w.technologies),
    })),
    education: (data.education || []).map((e) => ({
      institution: e.institution || '',
      degree: e.degree || '',
      major: e.major || '',
      location: e.location,
      start_date: formatDate(e.start_date) || '',
      end_date: e.end_date ? formatDate(e.end_date) : undefined,
      is_current: e.is_current || false,
      gpa: e.gpa,
      achievements: ensureArray(e.achievements),
    })),
    skills: (data.skills || []).map((s) => ({
      name: s.name || '',
      level: validateSkillLevel(s.level),
      category: s.category,
    })),
    projects: (data.projects || []).map((p) => ({
      name: p.name || '',
      description: p.description || '',
      role: p.role,
      start_date: p.start_date ? formatDate(p.start_date) : undefined,
      end_date: p.end_date ? formatDate(p.end_date) : undefined,
      technologies: ensureArray(p.technologies),
      highlights: ensureArray(p.highlights),
      url: p.url,
      github_url: p.github_url,
    })),
    certifications: (data.certifications || []).map((c) => ({
      name: c.name || '',
      issuer: c.issuer || '',
      issue_date: formatDate(c.issue_date) || '',
      expiry_date: c.expiry_date ? formatDate(c.expiry_date) : undefined,
      credential_id: c.credential_id,
      credential_url: c.credential_url,
    })),
  }
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date?: string): string | undefined {
  if (!date) return undefined

  // 如果已经是YYYY-MM-DD格式
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date
  }

  // 如果只有年份
  if (/^\d{4}$/.test(date)) {
    return `${date}-01-01`
  }

  // 尝试解析其他格式
  try {
    const parsed = new Date(date)
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0]
    }
  } catch {
    // 忽略解析错误
  }

  return date
}

/**
 * 确保值是数组
 */
function ensureArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v) => typeof v === 'string')
  }
  if (typeof value === 'string' && value) {
    return [value]
  }
  return []
}

/**
 * 验证技能等级
 */
function validateSkillLevel(level?: string): SkillLevel | undefined {
  const validLevels: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'expert']
  if (level && validLevels.includes(level as SkillLevel)) {
    return level as SkillLevel
  }
  return undefined
}

/**
 * 获取空的解析数据结构
 */
function getEmptyParsedData(): ParsedResumeData {
  return {
    personal_info: {
      full_name: '',
      email: '',
    },
    work_experiences: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
  }
}

/**
 * 清理PDF提取的文本
 * - 去除重复行
 * - 去除过短的行（<3字符）
 * - 去除多余空白
 * - 合并连续空行
 */
function cleanPDFText(text: string): string {
  const lines = text.split('\n')
  const seenLines = new Set<string>()
  const cleanedLines: string[] = []

  for (const rawLine of lines) {
    // 清理空白字符
    const line = rawLine.trim()

    // 跳过空行、过短的行（可能是格式字符）
    if (line.length < 3) continue

    // 跳过纯数字行（可能是页码）
    if (/^\d+$/.test(line)) continue

    // 去除重复行（常见于PDF格式问题）
    const normalizedLine = line.toLowerCase()
    if (seenLines.has(normalizedLine)) continue

    seenLines.add(normalizedLine)
    cleanedLines.push(line)
  }

  // 合并成文本，保留段落结构
  return cleanedLines.join('\n')
}

/**
 * 从PDF Buffer提取文本
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // 动态导入pdf-parse以避免打包问题
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParseModule = await import('pdf-parse') as any
    const pdfParse = pdfParseModule.default || pdfParseModule
    const data = await pdfParse(buffer)

    console.log(`📄 Raw PDF text length: ${data.text.length} chars`)

    // 清理提取的文本
    const cleanedText = cleanPDFText(data.text)

    console.log(`🧹 Cleaned PDF text length: ${cleanedText.length} chars (reduced ${((1 - cleanedText.length / data.text.length) * 100).toFixed(1)}%)`)

    return cleanedText
  } catch (error) {
    console.error('PDF parsing error:', error)
    // 回退方案：尝试提取可读文本
    const text = buffer.toString('utf-8')
    const cleanText = text.replace(/[^\x20-\x7E\n\r\t\u4e00-\u9fff]/g, ' ')
    return cleanText.trim()
  }
}

/**
 * 提取文件内容为文本
 */
export async function extractFileContent(
  file: Buffer,
  fileType: 'pdf' | 'docx' | 'doc' | 'txt'
): Promise<string> {
  switch (fileType) {
    case 'txt':
      return file.toString('utf-8')
    case 'pdf':
      return extractTextFromPDF(file)
    case 'docx':
    case 'doc':
      // Word文档可以使用mammoth库，这里简化处理
      try {
        const mammoth = (await import('mammoth')).default
        const result = await mammoth.extractRawText({ buffer: file })
        return result.value
      } catch (error) {
        console.error('Word parsing error:', error)
        return file.toString('utf-8')
      }
    default:
      throw new Error(`Unsupported file type: ${fileType}`)
  }
}
