/**
 * Resume Quality Validator
 * 简历质量验证器 - 确保AI生成的简历真实、准确、完整
 */

import type {
  QualityReport,
  ValidationFlag,
  Hallucination,
  SourceMapping,
  FieldValidation,
  ValidationOptions,
  ResumeContent,
} from '@careermatch/shared'

/**
 * 扁平化的Profile类型，用于验证
 * 与数据库结构保持一致
 */
export interface FlattenedProfile {
  id: string
  fullName: string
  email: string
  phone?: string | null
  location?: string | null
  professionalSummary?: string | null
  linkedinUrl?: string | null
  githubUrl?: string | null
  portfolioUrl?: string | null
  targetRoles?: string[]
  workExperiences?: Array<{
    id: string
    company: string
    position: string
    location?: string | null
    startDate: Date
    endDate?: Date | null
    isCurrent?: boolean
    description?: string | null
    achievements?: string[]
  }>
  educationRecords?: Array<{
    id: string
    institution: string
    degree: string
    major: string
    location?: string | null
    startDate?: Date | null
    graduationDate?: Date | null
    gpa?: number | null
    achievements?: string[]
  }>
  skills?: Array<{
    id: string
    name: string
    category?: string | null
    level?: string | null
    yearsOfExperience?: number | null
  }>
  projects?: Array<{
    id: string
    projectName: string
    description?: string | null
    role?: string | null
    startDate?: Date | null
    endDate?: Date | null
    technologiesUsed?: string[]
    achievements?: string[]
    projectUrl?: string | null
  }>
  certifications?: Array<{
    id: string
    name: string
    issuingOrganization?: string | null
    issuedDate?: Date | null
    expirationDate?: Date | null
    credentialId?: string | null
    credentialUrl?: string | null
  }>
}

/**
 * 默认验证选项
 */
const DEFAULT_OPTIONS: ValidationOptions = {
  checkHallucinations: true,
  checkCompleteness: true,
  checkRelevance: false, // 需要job描述时才检查
  strictMode: false,
  minQualityScore: 60,
  maxHallucinationCount: 5,
  skipFields: [],
}

/**
 * 主验证函数
 * 验证AI生成的简历内容与Profile源数据的一致性
 */
export async function validateResumeContent(
  resumeContent: ResumeContent,
  profile: FlattenedProfile,
  options: Partial<ValidationOptions> = {}
): Promise<QualityReport> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // 1. 生成数据来源映射
  const sourceMapping = generateSourceMapping(resumeContent, profile)

  // 2. 字段级验证
  const fieldValidations = await validateFields(resumeContent, profile, opts)

  // 3. 检测幻觉
  const hallucinations = opts.checkHallucinations
    ? detectHallucinations(resumeContent, profile)
    : []

  // 4. 验证标记
  const flags = generateValidationFlags(fieldValidations, hallucinations)

  // 5. 计算质量评分
  const qualityMetrics = calculateQualityScore(
    fieldValidations,
    hallucinations,
    resumeContent,
    profile
  )

  // 6. 生成建议
  const suggestions = generateSuggestions(
    flags,
    hallucinations,
    qualityMetrics
  )

  // 7. 统计信息
  const stats = {
    totalFields: fieldValidations.length,
    validatedFields: fieldValidations.filter((v) => v.isValid).length,
    errorCount: flags.filter((f) => f.level === 'error').length,
    warningCount: flags.filter((f) => f.level === 'warning').length,
    hallucinationCount: hallucinations.length,
  }

  return {
    qualityScore: qualityMetrics.qualityScore,
    accuracy: qualityMetrics.accuracy,
    completeness: qualityMetrics.completeness,
    relevance: qualityMetrics.relevance,
    hallucinations,
    flags,
    sourceMapping,
    fieldValidations,
    stats,
    suggestions,
    validatedAt: new Date(),
    validator: 'v1.0.0',
  }
}

/**
 * 生成数据来源映射
 * 建立简历字段到Profile表的映射关系
 */
export function generateSourceMapping(
  resumeContent: ResumeContent,
  profile: FlattenedProfile
): SourceMapping {
  return {
    personal_info: {
      table: 'user_profiles',
      id: profile.id,
    },
    work_experience: resumeContent.workExperience.map((exp, index) => {
      // 尝试根据公司名和职位匹配
      const sourceExp = profile.workExperiences?.find(
        (we) =>
          we.company.toLowerCase() === exp.company.toLowerCase() &&
          we.position.toLowerCase().includes(exp.position.toLowerCase())
      )

      return {
        index,
        table: 'work_experiences',
        id: sourceExp?.id || '',
        field_mapping: {
          company: 'company',
          position: 'position',
          startDate: 'start_date',
          endDate: 'end_date',
          description: 'description',
        },
      }
    }),
    education: resumeContent.education.map((edu, index) => {
      const sourceEdu = profile.educationRecords?.find(
        (er) =>
          er.institution.toLowerCase() === edu.institution.toLowerCase() &&
          er.degree.toLowerCase() === edu.degree.toLowerCase()
      )

      return {
        index,
        table: 'education_records',
        id: sourceEdu?.id || '',
        field_mapping: {
          institution: 'institution',
          degree: 'degree',
          major: 'major',
          graduationDate: 'graduation_date',
          gpa: 'gpa',
        },
      }
    }),
    skills: resumeContent.skills.map((skill, index) => {
      const sourceSkill = profile.skills?.find(
        (s) => s.name.toLowerCase() === skill.name.toLowerCase()
      )

      return {
        index,
        table: 'user_skills',
        id: sourceSkill?.id || '',
      }
    }),
    projects: resumeContent.projects.map((project, index) => {
      const sourceProject = profile.projects?.find(
        (p) =>
          p.projectName.toLowerCase() === project.name.toLowerCase()
      )

      return {
        index,
        table: 'user_projects',
        id: sourceProject?.id || '',
        field_mapping: {
          name: 'project_name',
          description: 'description',
          technologies: 'technologies_used',
          role: 'role',
          startDate: 'start_date',
          endDate: 'end_date',
        },
      }
    }),
    certifications: resumeContent.certifications.map((cert, index) => {
      const sourceCert = profile.certifications?.find(
        (c) => c.name.toLowerCase() === cert.name.toLowerCase()
      )

      return {
        index,
        table: 'user_certifications',
        id: sourceCert?.id || '',
      }
    }),
  }
}

/**
 * 字段级验证
 */
async function validateFields(
  resumeContent: ResumeContent,
  profile: FlattenedProfile,
  options: ValidationOptions
): Promise<FieldValidation[]> {
  const validations: FieldValidation[] = []

  // 验证个人信息
  if (!options.skipFields?.includes('personalInfo')) {
    const personalInfoValidation = validatePersonalInfo(
      resumeContent.personalInfo,
      profile
    )
    validations.push(...personalInfoValidation)
  }

  // 验证工作经历
  if (!options.skipFields?.includes('workExperience')) {
    const workValidations = validateWorkExperiences(
      resumeContent.workExperience,
      profile.workExperiences || []
    )
    validations.push(...workValidations)
  }

  // 验证教育背景
  if (!options.skipFields?.includes('education')) {
    const eduValidations = validateEducation(
      resumeContent.education,
      profile.educationRecords || []
    )
    validations.push(...eduValidations)
  }

  // 验证技能
  if (!options.skipFields?.includes('skills')) {
    const skillValidations = validateSkills(
      resumeContent.skills,
      profile.skills || []
    )
    validations.push(...skillValidations)
  }

  return validations
}

/**
 * 验证个人信息
 */
function validatePersonalInfo(
  personalInfo: ResumeContent['personalInfo'],
  profile: FlattenedProfile
): FieldValidation[] {
  const validations: FieldValidation[] = []

  // 验证姓名
  const nameMatch = compareStrings(
    personalInfo.fullName,
    profile.fullName || ''
  )
  validations.push({
    field: 'personalInfo.fullName',
    isValid: nameMatch.similarity > 0.8,
    accuracy: nameMatch.similarity * 100,
    issues:
      nameMatch.similarity < 0.8
        ? [
            {
              level: 'error',
              category: 'accuracy',
              field: 'personalInfo.fullName',
              message: `姓名不匹配：生成"${personalInfo.fullName}"，源数据"${profile.fullName}"`,
            },
          ]
        : [],
  })

  // 验证邮箱
  if (profile.email) {
    const emailMatch = personalInfo.email === profile.email
    validations.push({
      field: 'personalInfo.email',
      isValid: emailMatch,
      accuracy: emailMatch ? 100 : 0,
      issues: emailMatch
        ? []
        : [
            {
              level: 'error',
              category: 'accuracy',
              field: 'personalInfo.email',
              message: `邮箱不匹配`,
            },
          ],
    })
  }

  // 验证电话
  if (profile.phone) {
    const phoneMatch = normalizePhone(personalInfo.phone || '') === normalizePhone(profile.phone)
    validations.push({
      field: 'personalInfo.phone',
      isValid: phoneMatch,
      accuracy: phoneMatch ? 100 : 0,
      issues: phoneMatch
        ? []
        : [
            {
              level: 'warning',
              category: 'accuracy',
              field: 'personalInfo.phone',
              message: `电话号码可能不匹配`,
            },
          ],
    })
  }

  return validations
}

/**
 * 验证工作经历
 */
function validateWorkExperiences(
  workExperiences: ResumeContent['workExperience'],
  sourceExperiences: FlattenedProfile['workExperiences']
): FieldValidation[] {
  const validations: FieldValidation[] = []

  workExperiences.forEach((exp, index) => {
    // 查找匹配的源数据
    const sourceExp = sourceExperiences.find(
      (se) =>
        se.company.toLowerCase() === exp.company.toLowerCase() &&
        se.position.toLowerCase().includes(exp.position.toLowerCase())
    )

    if (!sourceExp) {
      validations.push({
        field: `workExperience[${index}]`,
        isValid: false,
        accuracy: 0,
        issues: [
          {
            level: 'error',
            category: 'accuracy',
            field: `workExperience[${index}]`,
            message: `未找到匹配的工作经历：${exp.company} - ${exp.position}`,
            details: { generated: exp },
          },
        ],
      })
      return
    }

    // 验证公司名
    const companyMatch = compareStrings(exp.company, sourceExp.company)
    if (companyMatch.similarity < 0.9) {
      validations.push({
        field: `workExperience[${index}].company`,
        isValid: false,
        accuracy: companyMatch.similarity * 100,
        issues: [
          {
            level: 'error',
            category: 'accuracy',
            field: `workExperience[${index}].company`,
            message: `公司名称不匹配`,
          },
        ],
      })
    }

    // 验证职位
    const positionMatch = compareStrings(exp.position, sourceExp.position)
    if (positionMatch.similarity < 0.8) {
      validations.push({
        field: `workExperience[${index}].position`,
        isValid: false,
        accuracy: positionMatch.similarity * 100,
        issues: [
          {
            level: 'warning',
            category: 'accuracy',
            field: `workExperience[${index}].position`,
            message: `职位名称可能被修改`,
          },
        ],
      })
    }

    // 验证日期
    const startDateMatch = compareDates(exp.startDate, sourceExp.startDate)
    if (!startDateMatch) {
      validations.push({
        field: `workExperience[${index}].startDate`,
        isValid: false,
        accuracy: 0,
        issues: [
          {
            level: 'error',
            category: 'accuracy',
            field: `workExperience[${index}].startDate`,
            message: `入职日期不匹配`,
          },
        ],
      })
    }
  })

  return validations
}

/**
 * 验证教育背景
 */
function validateEducation(
  education: ResumeContent['education'],
  sourceEducation: FlattenedProfile['educationRecords']
): FieldValidation[] {
  const validations: FieldValidation[] = []

  education.forEach((edu, index) => {
    const sourceEdu = sourceEducation.find(
      (se) =>
        se.institution.toLowerCase() === edu.institution.toLowerCase() &&
        se.degree.toLowerCase() === edu.degree.toLowerCase()
    )

    if (!sourceEdu) {
      validations.push({
        field: `education[${index}]`,
        isValid: false,
        accuracy: 0,
        issues: [
          {
            level: 'error',
            category: 'accuracy',
            field: `education[${index}]`,
            message: `未找到匹配的教育记录：${edu.institution} - ${edu.degree}`,
          },
        ],
      })
      return
    }

    // 验证GPA（如果存在）
    if (edu.gpa && sourceEdu.gpa) {
      const gpaMatch = Math.abs((edu.gpa || 0) - (sourceEdu.gpa || 0)) < 0.1
      if (!gpaMatch) {
        validations.push({
          field: `education[${index}].gpa`,
          isValid: false,
          accuracy: 0,
          issues: [
            {
              level: 'error',
              category: 'accuracy',
              field: `education[${index}].gpa`,
              message: `GPA不匹配：生成${edu.gpa}，源数据${sourceEdu.gpa}`,
            },
          ],
        })
      }
    }
  })

  return validations
}

/**
 * 验证技能
 */
function validateSkills(
  skills: ResumeContent['skills'],
  sourceSkills: FlattenedProfile['skills']
): FieldValidation[] {
  const validations: FieldValidation[] = []
  const sourceSkillNames = sourceSkills.map((s) => s.name.toLowerCase())

  skills.forEach((skill, index) => {
    const exists = sourceSkillNames.includes(skill.name.toLowerCase())

    if (!exists) {
      validations.push({
        field: `skills[${index}]`,
        isValid: false,
        accuracy: 0,
        issues: [
          {
            level: 'warning',
            category: 'accuracy',
            field: `skills[${index}]`,
            message: `技能"${skill.name}"未在Profile中找到，可能是AI添加的`,
          },
        ],
      })
    }
  })

  return validations
}

/**
 * 检测幻觉
 * 识别AI可能编造或夸大的内容
 */
export function detectHallucinations(
  resumeContent: ResumeContent,
  profile: FlattenedProfile
): Hallucination[] {
  const hallucinations: Hallucination[] = []

  // 1. 检测虚构的成就数字
  resumeContent.workExperience.forEach((exp, expIndex) => {
    exp.achievements?.forEach((achievement, achIndex) => {
      // 检测包含数字的成就（如"提升50%性能"）
      const numbers = achievement.match(/\d+(\.\d+)?%?/g)
      if (numbers) {
        // 在源数据中查找对应的工作经历
        const sourceExp = profile.workExperiences?.find(
          (se) => se.company.toLowerCase() === exp.company.toLowerCase()
        )

        if (sourceExp) {
          // 检查源数据的描述中是否包含这些数字
          const sourceDescription = sourceExp.description || ''
          const hasMatchingNumbers = numbers.some((num) =>
            sourceDescription.includes(num)
          )

          if (!hasMatchingNumbers) {
            hallucinations.push({
              field: `workExperience[${expIndex}].achievements[${achIndex}]`,
              type: 'exaggerated_metric',
              severity: 'medium',
              description: `成就中的数字"${numbers.join(', ')}"未在源数据中找到，可能是AI编造的`,
              suggestedFix: `移除具体数字或使用"显著"、"大幅"等定性描述`,
            })
          }
        }
      }
    })
  })

  // 2. 检测添加的技能
  const sourceSkillNames = new Set(
    profile.skills?.map((s) => s.name.toLowerCase()) || []
  )

  resumeContent.skills.forEach((skill, index) => {
    if (!sourceSkillNames.has(skill.name.toLowerCase())) {
      hallucinations.push({
        field: `skills[${index}]`,
        type: 'invented_skill',
        severity: 'low',
        description: `技能"${skill.name}"未在Profile中找到`,
        suggestedFix: `确认该技能是否真实掌握，或从简历中移除`,
      })
    }
  })

  // 3. 检测虚假的证书
  const sourceCertNames = new Set(
    profile.certifications?.map((c) => c.name.toLowerCase()) || []
  )

  resumeContent.certifications.forEach((cert, index) => {
    if (!sourceCertNames.has(cert.name.toLowerCase())) {
      hallucinations.push({
        field: `certifications[${index}]`,
        type: 'false_certification',
        severity: 'high',
        description: `证书"${cert.name}"未在Profile中找到`,
        suggestedFix: `移除该证书或在Profile中添加`,
      })
    }
  })

  return hallucinations
}

/**
 * 生成验证标记
 */
function generateValidationFlags(
  fieldValidations: FieldValidation[],
  hallucinations: Hallucination[]
): ValidationFlag[] {
  const flags: ValidationFlag[] = []

  // 从字段验证生成标记
  fieldValidations.forEach((validation) => {
    flags.push(...validation.issues)
  })

  // 从幻觉检测生成标记
  hallucinations.forEach((hallucination) => {
    flags.push({
      level: hallucination.severity === 'high' ? 'error' : 'warning',
      category: 'accuracy',
      field: hallucination.field,
      message: hallucination.description,
      details: {
        type: hallucination.type,
        suggestedFix: hallucination.suggestedFix,
      },
    })
  })

  return flags
}

/**
 * 计算质量评分
 */
function calculateQualityScore(
  fieldValidations: FieldValidation[],
  hallucinations: Hallucination[],
  resumeContent: ResumeContent,
  profile: FlattenedProfile
): {
  qualityScore: number
  accuracy: number
  completeness: number
  relevance: number
} {
  // 计算准确性评分
  const totalFields = fieldValidations.length
  const validFields = fieldValidations.filter((v) => v.isValid).length
  const accuracy = totalFields > 0 ? (validFields / totalFields) * 100 : 100

  // 幻觉惩罚
  const hallucinationPenalty = Math.min(hallucinations.length * 5, 30)

  // 计算完整性评分
  const profileFieldCount =
    (profile.workExperiences?.length || 0) +
    (profile.educationRecords?.length || 0) +
    (profile.skills?.length || 0) +
    (profile.projects?.length || 0) +
    (profile.certifications?.length || 0)

  const resumeFieldCount =
    resumeContent.workExperience.length +
    resumeContent.education.length +
    resumeContent.skills.length +
    resumeContent.projects.length +
    resumeContent.certifications.length

  const completeness =
    profileFieldCount > 0
      ? Math.min((resumeFieldCount / profileFieldCount) * 100, 100)
      : 100

  // 计算综合质量评分
  const qualityScore = Math.max(
    0,
    Math.round(accuracy * 0.6 + completeness * 0.4 - hallucinationPenalty)
  )

  return {
    qualityScore,
    accuracy: Math.round(accuracy),
    completeness: Math.round(completeness),
    relevance: 0, // 需要job描述才能计算
  }
}

/**
 * 生成改进建议
 */
function generateSuggestions(
  flags: ValidationFlag[],
  hallucinations: Hallucination[],
  metrics: { qualityScore: number; accuracy: number; completeness: number }
): string[] {
  const suggestions: string[] = []

  if (metrics.qualityScore < 60) {
    suggestions.push(
      '质量评分较低，建议检查并修正所有标记的问题后重新生成'
    )
  }

  const errorCount = flags.filter((f) => f.level === 'error').length
  if (errorCount > 0) {
    suggestions.push(`发现${errorCount}个错误，必须修正后才能使用`)
  }

  if (hallucinations.length > 0) {
    const highSeverity = hallucinations.filter((h) => h.severity === 'high')
    if (highSeverity.length > 0) {
      suggestions.push(
        `检测到${highSeverity.length}个严重幻觉问题，建议移除相关内容`
      )
    }
  }

  if (metrics.completeness < 70) {
    suggestions.push('简历内容不够完整，建议补充更多Profile信息')
  }

  if (suggestions.length === 0) {
    suggestions.push('简历质量良好，可以使用')
  }

  return suggestions
}

/**
 * 辅助函数：字符串比较
 */
function compareStrings(
  str1: string,
  str2: string
): { similarity: number; isMatch: boolean } {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()

  if (s1 === s2) {
    return { similarity: 1, isMatch: true }
  }

  // 简单的Levenshtein距离计算
  const maxLength = Math.max(s1.length, s2.length)
  if (maxLength === 0) {
    return { similarity: 1, isMatch: true }
  }

  const distance = levenshteinDistance(s1, s2)
  const similarity = 1 - distance / maxLength

  return { similarity, isMatch: similarity > 0.8 }
}

/**
 * Levenshtein距离算法
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

/**
 * 辅助函数：日期比较
 */
function compareDates(date1: string, date2: string | Date | null): boolean {
  if (!date2) return false

  const d1 = new Date(date1)
  const d2 = new Date(date2)

  // 只比较年月，忽略日
  return (
    d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth()
  )
}

/**
 * 辅助函数：规范化电话号码
 */
function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, '')
}
