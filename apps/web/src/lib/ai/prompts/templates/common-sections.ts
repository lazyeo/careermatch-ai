/**
 * 可复用的 Prompt 部分
 *
 * 包含各种场景下可复用的 Prompt 片段
 */

// ============================================
// 九维度匹配分析框架
// ============================================

/**
 * 九维度匹配分析框架
 * 用于全面评估候选人与岗位的匹配程度
 */
export const NINE_DIMENSION_FRAMEWORK = `## 九维度匹配分析框架

请按以下9个维度进行详细分析：

### 1. 技术技能匹配 (Technical Skills)
- 核心技术栈的覆盖程度
- 技术深度与广度的评估
- 技术成长潜力

### 2. 工作经验匹配 (Work Experience)
- 行业经验相关性
- 岗位级别匹配度
- 项目复杂度对比

### 3. 教育背景匹配 (Education)
- 学历层次符合度
- 专业相关性
- 持续学习能力

### 4. 软技能评估 (Soft Skills)
- 沟通协作能力
- 领导力潜质
- 问题解决能力

### 5. 职业发展契合 (Career Alignment)
- 职业轨迹分析
- 成长空间评估
- 稳定性预测

### 6. 文化适配性 (Cultural Fit)
- 公司价值观匹配
- 工作风格适配
- 团队融入预测

### 7. 薪资期望匹配 (Compensation)
- 薪资范围评估
- 市场定位分析
- 谈判空间预测

### 8. 地理位置因素 (Location)
- 工作地点匹配
- 远程工作适应性
- 通勤/搬迁意愿

### 9. 入职准备度 (Readiness)
- 离职周期评估
- 入职时间匹配
- 过渡风险评估`

/**
 * 简化版五维度框架
 */
export const FIVE_DIMENSION_FRAMEWORK = `## 五维度快速评估

### 1. 技能匹配度
核心技术和能力要求的满足程度

### 2. 经验相关性
过往经历与岗位需求的相关程度

### 3. 教育背景
学历和专业背景的符合程度

### 4. 发展潜力
成长空间和学习能力评估

### 5. 整体契合度
综合文化、期望等因素的整体适配性`

// ============================================
// 分数计算规则
// ============================================

/**
 * 匹配分数计算规则
 */
export const SCORE_CALCULATION_RULES = `## 评分规则

### 分数范围：0-100分

**90-100分 - 强烈推荐**
- 几乎所有核心要求都满足
- 有明显的加分项
- 非常适合立即进入面试流程

**75-89分 - 推荐**
- 大部分核心要求满足
- 有一些可以忽略的小差距
- 值得深入了解

**60-74分 - 一般匹配**
- 满足基本要求
- 有明显的提升空间
- 需要权衡是否继续

**40-59分 - 弱匹配**
- 只满足部分要求
- 差距较大
- 需要大量提升

**0-39分 - 不推荐**
- 核心要求大部分不满足
- 不建议投递

### 权重分配建议
- 技术技能：30%
- 工作经验：25%
- 教育背景：15%
- 软技能：15%
- 其他因素：15%`

/**
 * 推荐等级定义
 */
export const RECOMMENDATION_LEVELS = `## 推荐等级

- **STRONG_MATCH** (强烈推荐): 85-100分
- **GOOD_MATCH** (推荐): 70-84分
- **MODERATE_MATCH** (一般匹配): 55-69分
- **WEAK_MATCH** (弱匹配): 40-54分
- **NOT_RECOMMENDED** (不推荐): 0-39分`

// ============================================
// 分析指导原则
// ============================================

/**
 * 客观分析原则
 */
export const OBJECTIVE_ANALYSIS_PRINCIPLES = `## 分析原则

### 客观性要求
1. 基于事实和数据进行评估
2. 避免主观臆断和偏见
3. 既要看到优势也要指出不足
4. 不过度美化或贬低候选人

### 建设性要求
1. 所有问题都要提供改进建议
2. 建议要具体、可操作
3. 考虑候选人的实际情况
4. 关注长期职业发展

### 完整性要求
1. 覆盖所有评估维度
2. 不遗漏重要信息
3. 提供总结性观点
4. 给出明确的行动建议`

/**
 * 写作质量要求
 */
export const WRITING_QUALITY_REQUIREMENTS = `## 写作要求

### 语言风格
- 专业但易于理解
- 简洁但信息完整
- 有条理的结构化表达
- 避免空洞的套话

### 内容要求
- 有具体的例子支撑
- 量化数据更有说服力
- 避免绝对化表述
- 保持一致的评价标准

### 格式要求
- 合理使用列表和分段
- 关键信息突出显示
- 保持适当的篇幅
- 注意排版的美观性`

// ============================================
// 上下文提示
// ============================================

/**
 * 中文语境提示
 */
export const CHINESE_CONTEXT_HINT = `## 语言提示

请使用中文进行回复，注意：
- 使用专业但通俗的表达
- 适当使用行业术语
- 保持语言的流畅自然
- 避免生硬的翻译腔`

/**
 * 英文语境提示
 */
export const ENGLISH_CONTEXT_HINT = `## Language Requirement (IMPORTANT)

**You MUST respond entirely in English, regardless of the input language.**
- Even if the job description or candidate profile is in Chinese/other languages, your analysis and output MUST be in English
- Use professional but accessible English
- Follow standard business writing conventions
- Be concise and direct
- Use appropriate industry terminology
- All JSON field values must be in English
- All Markdown content must be in English`

/**
 * 双语处理提示
 */
export const BILINGUAL_HINT = `## 语言处理说明

输入可能包含中英文混合内容：
- 技术术语保持原文
- 分析和建议使用中文
- 人名、公司名保持原文
- 学历、证书名称保持原文`

// ============================================
// 错误处理提示
// ============================================

/**
 * 信息不足处理
 */
export const INSUFFICIENT_INFO_HANDLING = `## 信息不足处理

如果提供的信息不足以完成分析：
1. 明确指出缺少哪些关键信息
2. 基于现有信息给出初步评估
3. 说明信息补充后可能的分析变化
4. 不要编造不存在的信息`

/**
 * 异常情况处理
 */
export const ERROR_HANDLING_HINT = `## 异常情况处理

- 如果无法理解输入内容，请求澄清
- 如果输入内容不相关，礼貌说明并引导
- 如果遇到敏感信息，提示用户注意隐私
- 始终保持专业和友好的态度`

// ============================================
// 导出
// ============================================

export const ANALYSIS_FRAMEWORKS = {
  NINE_DIMENSION: NINE_DIMENSION_FRAMEWORK,
  FIVE_DIMENSION: FIVE_DIMENSION_FRAMEWORK,
} as const

export const SCORING_RULES = {
  CALCULATION: SCORE_CALCULATION_RULES,
  LEVELS: RECOMMENDATION_LEVELS,
} as const

export const ANALYSIS_PRINCIPLES = {
  OBJECTIVE: OBJECTIVE_ANALYSIS_PRINCIPLES,
  WRITING: WRITING_QUALITY_REQUIREMENTS,
} as const

export const LANGUAGE_HINTS = {
  CHINESE: CHINESE_CONTEXT_HINT,
  ENGLISH: ENGLISH_CONTEXT_HINT,
  BILINGUAL: BILINGUAL_HINT,
} as const

export const ERROR_HANDLING = {
  INSUFFICIENT_INFO: INSUFFICIENT_INFO_HANDLING,
  GENERAL: ERROR_HANDLING_HINT,
} as const
