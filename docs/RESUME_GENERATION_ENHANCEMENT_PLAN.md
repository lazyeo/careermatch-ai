# CareerMatch AI 简历生成系统增强实施计划

> **文档版本**: v1.0
> **创建日期**: 2025-12-10
> **预计完成**: 2025-03-15 (10周)
> **状态**: 📋 Planning

---

## 📋 项目概述

**目标**: 构建一个智能、高质量、多模板的简历生成系统

**用户需求**:
1. ✅ AI生成的简历必须匹配度高、真实有效（不编造内容）
2. ✅ 支持多种CV模板样式和布局
3. ✅ 完整迁移project-resume-optimizer的8维度岗位分析系统
4. ✅ 增加HTML简历支持（保留PDF）
5. ✅ 支持样式主题切换、布局结构变化、内容选择策略、行业专用模板

**实施策略**: 分3个阶段，两者并重（质量 + 模板），10周完成

---

## 🏗️ 核心架构设计

### 数据库Schema增强

```sql
-- Phase 1: 质量控制和模板基础
ALTER TABLE public.resumes
  ADD COLUMN quality_score INTEGER,              -- 0-100质量评分
  ADD COLUMN validation_flags JSONB DEFAULT '{}', -- 验证标记
  ADD COLUMN source_mapping JSONB;               -- 数据来源追踪

-- 模板系统表
CREATE TABLE public.resume_templates (
    id TEXT PRIMARY KEY,                         -- 'modern-blue', 'classic-serif'
    name TEXT NOT NULL,
    category TEXT NOT NULL,                      -- 'modern', 'classic', 'creative', 'industry'
    config JSONB NOT NULL,                       -- 颜色、字体、布局配置
    preview_url TEXT
);

-- 用户自定义模板
CREATE TABLE public.user_custom_templates (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    base_template_id TEXT REFERENCES resume_templates(id),
    custom_config JSONB NOT NULL                 -- 用户的样式覆盖
);

-- Phase 3: 8维度分析
ALTER TABLE public.analysis_sessions
  ADD COLUMN dimensions JSONB;                   -- 8维度结构化数据

-- 增强生成日志
ALTER TABLE public.resume_generation_logs
  ADD COLUMN validation_result JSONB,
  ADD COLUMN quality_metrics JSONB;
```

### 模块结构

```
apps/web/src/
├── lib/
│   ├── ai/
│   │   ├── resume-quality-validator.ts         # NEW - 质量验证器
│   │   ├── resume-content-optimizer.ts         # NEW - CV策略内容优化
│   │   ├── template-recommender.ts             # NEW - 智能模板推荐
│   │   └── templates/
│   │       ├── resume-generation-v2.ts         # NEW - 增强Prompt
│   │       └── job-matching-v2.ts              # NEW - 8维度分析Prompt
│   │
│   └── resume-renderers/                       # NEW - 统一渲染系统
│       ├── base-renderer.ts                    # 抽象基类
│       ├── pdf-renderer.tsx                    # 动态PDF生成
│       ├── html-renderer.ts                    # HTML导出
│       └── layouts/
│           ├── single-column.tsx
│           └── two-column.tsx
│
├── components/
│   └── templates/                              # NEW - 模板UI
│       ├── TemplateGallery.tsx
│       ├── TemplatePreviewModal.tsx
│       └── TemplateCustomizer.tsx
│
└── app/api/
    ├── resumes/
    │   ├── generate-from-analysis/route.ts     # MODIFY - 集成质量验证和CV策略
    │   └── [id]/export/route.ts                # NEW - 统一导出API (PDF/HTML)
    ├── templates/
    │   ├── route.ts                            # NEW - 模板列表
    │   ├── [id]/preview/route.ts               # NEW - 模板预览
    │   └── custom/route.ts                     # NEW - 用户自定义模板
    └── jobs/[id]/analyze/route.ts              # MODIFY - 8维度输出
```

---

## 📅 Phase 1: 基础架构（2-3周）

### 目标
建立质量控制机制和模板系统基础设施

### 1.1 AI生成质量改进（Week 1: 3-4天）

#### 核心文件

**`/apps/web/src/lib/ai/resume-quality-validator.ts`** (NEW)
```typescript
/**
 * 质量验证器 - 确保生成内容真实可靠
 *
 * 核心功能:
 * 1. validateResumeContent(generated, profileData): QualityReport
 *    - 验证生成内容与Profile数据的一致性
 *
 * 2. checkFactualAccuracy(workExp, profileWorkExp): ValidationResult
 *    - 逐字段对比，检测篡改或编造
 *
 * 3. detectHallucinations(content, sourceData): HallucinationReport
 *    - 识别AI添加的不存在信息（如虚构的成就数字）
 *
 * 4. calculateQualityScore(validations): number
 *    - 综合评分（0-100），基于准确性、完整性、相关性
 *
 * 5. generateSourceMapping(resume, profile): SourceMap
 *    - 建立简历字段到Profile表的映射关系
 *    - 例: resume.workExperience[0] → work_experiences(uuid-xxx)
 */

interface QualityReport {
  qualityScore: number;              // 0-100
  accuracy: number;                  // 事实准确性 (0-100)
  completeness: number;              // 信息完整度 (0-100)
  relevance: number;                 // 与岗位相关性 (0-100)
  hallucinations: Hallucination[];   // 检测到的编造内容
  flags: ValidationFlag[];           // 验证标记
  sourceMapping: SourceMap;          // 数据来源映射
}

interface SourceMap {
  'personal_info': { table: 'user_profiles', id: string },
  'work_experience': [
    { index: 0, table: 'work_experiences', id: string, field_mapping: {...} },
    ...
  ],
  ...
}
```

**验证逻辑**:
1. **字段级对比**: 对比AI生成的每个字段与Profile源数据
2. **数值检查**: 确保数字（如GPA、工作年限）与源数据匹配
3. **时间线验证**: 检查日期范围是否合理
4. **成就审查**: 检测是否添加了Profile中不存在的成就

**集成点**: `/apps/web/src/app/api/resumes/generate-from-analysis/route.ts`
```typescript
// Line ~243: AI生成后立即验证
const validationResult = await validateResumeContent(resumeContent, profile);

if (validationResult.qualityScore < 60) {
  console.warn('⚠️ Low quality, applying corrections...');
  resumeContent = applyQualityCorrections(resumeContent, validationResult);
}

// Line ~310: 保存质量数据
await supabase.from('resumes').insert({
  ...existing,
  quality_score: validationResult.qualityScore,
  validation_flags: validationResult.flags,
  source_mapping: validationResult.sourceMapping,
});

// Line ~329: 增强日志
await supabase.from('resume_generation_logs').insert({
  ...existing,
  validation_result: validationResult,
  quality_metrics: {
    accuracy: validationResult.accuracy,
    hallucination_count: validationResult.hallucinations.length
  }
});
```

**预期成果**:
- ✅ 每份简历都有quality_score (0-100)
- ✅ 95%+简历质量评分>70
- ✅ 零虚构内容事件（hallucination_count=0）
- ✅ 完整的source_mapping追踪数据来源

---

### 1.2 模板系统基础设施（Week 1: 3-4天）

#### 核心文件

**`/apps/web/src/lib/resume-renderers/pdf-renderer.tsx`** (NEW)
```typescript
/**
 * 动态PDF渲染器 - 替代硬编码的ResumePDFTemplate
 *
 * 核心特性:
 * 1. 接受TemplateConfig动态生成样式
 * 2. 支持单栏/双栏布局切换
 * 3. 可配置颜色、字体、间距
 */

import { Document, Page, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';

export class PDFRenderer extends BaseResumeRenderer {
  async render(resume: ResumeContent, template: ResumeTemplate): Promise<Buffer> {
    // 1. 根据template.config生成动态样式
    const styles = this.generateStyles(template.config);

    // 2. 根据config.layout选择布局组件
    const LayoutComponent = template.config.layout === 'two-column'
      ? TwoColumnLayout
      : SingleColumnLayout;

    // 3. 生成PDF文档
    const doc = (
      <Document>
        <Page size="A4" style={styles.page}>
          <LayoutComponent
            resume={resume}
            config={template.config}
            styles={styles}
          />
        </Page>
      </Document>
    );

    return await renderToBuffer(doc);
  }

  private generateStyles(config: TemplateConfig): Styles {
    return StyleSheet.create({
      page: {
        padding: 40,
        fontFamily: config.fonts.body,
        backgroundColor: '#FFFFFF',
      },
      header: {
        borderBottomColor: config.colors.primary,
        borderBottomWidth: 2,
      },
      sectionTitle: {
        color: config.colors.primary,
        fontFamily: config.fonts.heading,
        fontSize: 14,
      },
      // ... 其他动态样式
    });
  }
}
```

**`/apps/web/src/lib/resume-renderers/html-renderer.ts`** (NEW)
```typescript
/**
 * HTML渲染器 - 生成打印优化的HTML简历
 *
 * 核心特性:
 * 1. 使用模板字符串生成HTML
 * 2. 内联CSS确保独立性
 * 3. A4打印优化（@media print）
 * 4. 语义化HTML标签
 */

export class HTMLRenderer extends BaseResumeRenderer {
  async render(resume: ResumeContent, template: ResumeTemplate): Promise<string> {
    const css = this.generateCSS(template.config);
    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${resume.personalInfo.fullName} - Resume</title>
          <style>
            ${css}

            /* A4打印优化 */
            @media print {
              @page { size: A4; margin: 15mm; }
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${this.renderContent(resume, template.config)}
          <button class="no-print" onclick="window.print()">Print / Save as PDF</button>
        </body>
      </html>
    `;
    return html;
  }
}
```

**`/apps/web/src/app/api/resumes/[id]/export/route.ts`** (NEW - 统一导出API)
```typescript
/**
 * 统一导出端点 - 替代旧的export-pdf
 *
 * GET /api/resumes/[id]/export?format=pdf|html&template=modern-blue
 */
export async function GET(req: NextRequest, { params }) {
  const format = req.nextUrl.searchParams.get('format') || 'pdf';
  const templateId = req.nextUrl.searchParams.get('template');

  const resume = await fetchResume(params.id);
  const template = await fetchTemplate(templateId || resume.template_id || 'modern-blue');

  const renderer = getResumeRenderer(format as OutputFormat);
  const output = await renderer.render(resume.content, template);

  if (format === 'pdf') {
    return new Response(output, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${resume.title}.pdf"`
      }
    });
  } else {
    return new Response(output, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}
```

**默认模板数据**:
```sql
INSERT INTO public.resume_templates (id, name, description, category, config) VALUES
('modern-blue', 'Modern Blue', 'Clean modern design with blue accents', 'modern', '{
  "colors": {
    "primary": "#2563EB",
    "text": "#1F2937",
    "accent": "#3B82F6"
  },
  "fonts": {
    "heading": "Helvetica-Bold",
    "body": "Helvetica"
  },
  "layout": "single-column",
  "sections_order": ["header", "summary", "skills", "experience", "projects", "education", "certifications"]
}'),
('classic-serif', 'Classic Serif', 'Traditional serif design', 'classic', '{
  "colors": {
    "primary": "#000000",
    "text": "#333333",
    "accent": "#666666"
  },
  "fonts": {
    "heading": "Times-Bold",
    "body": "Times-Roman"
  },
  "layout": "single-column",
  "sections_order": ["header", "summary", "experience", "education", "skills", "certifications"]
}');
```

**向后兼容**:
- 将 `/components/ResumePDFTemplate.tsx` 重命名为 `.legacy.tsx`
- 旧的 `/api/resumes/[id]/export-pdf` 路由内部调用新的渲染器
- 所有现有简历默认使用 `modern-blue` 模板

---

## 📅 Phase 2: 多模板系统（3-4周）

### 目标
扩展模板库、添加UI选择器、支持样式定制

### 2.1 新增模板（Week 1: 5-6天）

**新模板**:
1. **creative-gradient** - 双栏布局，渐变色，适合创意职位
2. **executive-minimal** - 极简设计，大量留白，适合高管
3. **technical-dark** - 深色主题，代码字体，适合工程师

**技术实现**:
```typescript
// /lib/resume-renderers/layouts/two-column.tsx
export function TwoColumnLayout({ resume, config, styles }: Props) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {/* 35% Sidebar */}
      <View style={{ width: '35%', ...styles.sidebar }}>
        <PersonalPhoto />
        <ContactInfo data={resume.personalInfo} />
        <SkillsList skills={resume.skills} />
      </View>

      {/* 65% Main Content */}
      <View style={{ width: '65%', ...styles.mainContent }}>
        <Summary text={resume.careerObjective} />
        <WorkExperience items={resume.workExperience} />
        <Projects items={resume.projects} />
        <Education items={resume.education} />
      </View>
    </View>
  );
}
```

### 2.2 模板选择UI（Week 2: 4-5天）

**`/components/templates/TemplateGallery.tsx`** (NEW)
```tsx
'use client';

export function TemplateGallery({ onSelect, selectedId }: Props) {
  const { data: templates } = useTemplates();

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {templates?.map(template => (
        <TemplateCard
          key={template.id}
          template={template}
          selected={selectedId === template.id}
          onSelect={() => onSelect(template.id)}
        >
          {/* 预览缩略图 */}
          <img src={template.preview_url} alt={template.name} />
          <h3>{template.name}</h3>
          <p>{template.description}</p>
          {selectedId === template.id && <CheckIcon />}
        </TemplateCard>
      ))}
    </div>
  );
}
```

**集成到生成流程**:
```tsx
// /app/[locale]/jobs/[id]/analysis/page.tsx
const [selectedTemplate, setSelectedTemplate] = useState('modern-blue');

// 在"生成简历"按钮前显示模板选择器
<TemplateGallery
  onSelect={setSelectedTemplate}
  selectedId={selectedTemplate}
/>

<Button onClick={async () => {
  const res = await fetch('/api/resumes/generate-from-analysis', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      provider,
      templateId: selectedTemplate, // 传递选择的模板
    })
  });
}}>
  Generate Resume with {templates.find(t => t.id === selectedTemplate)?.name}
</Button>
```

### 2.3 样式定制系统（Week 3: 3-4天）

**`/components/templates/TemplateCustomizer.tsx`** (NEW)
```tsx
export function TemplateCustomizer({ baseTemplateId, onSave }: Props) {
  const [config, setConfig] = useState<TemplateConfig>(defaultConfig);

  return (
    <div className="grid grid-cols-2 gap-8">
      {/* 左侧：配置面板 */}
      <div>
        <ColorPicker
          label="Primary Color"
          value={config.colors.primary}
          onChange={(c) => setConfig({...config, colors: {...config.colors, primary: c}})}
        />

        <FontSelector
          label="Heading Font"
          value={config.fonts.heading}
          options={['Helvetica', 'Times-Roman', 'Courier']}
          onChange={(f) => setConfig({...config, fonts: {...config.fonts, heading: f}})}
        />

        <SectionOrderEditor
          sections={config.sections_order}
          onReorder={(newOrder) => setConfig({...config, sections_order: newOrder})}
        />

        <Button onClick={async () => {
          const res = await fetch('/api/templates/custom', {
            method: 'POST',
            body: JSON.stringify({
              baseTemplateId,
              name: 'My Custom Template',
              customConfig: config
            })
          });
          onSave(await res.json());
        }}>
          Save Custom Template
        </Button>
      </div>

      {/* 右侧：实时预览 */}
      <div>
        <iframe
          src={`/api/templates/preview?config=${encodeURIComponent(JSON.stringify(config))}`}
          className="w-full h-[600px]"
        />
      </div>
    </div>
  );
}
```

---

## 📅 Phase 3: 智能增强（2-3周）

### 目标
集成8维度分析，实现CV策略驱动的内容优化

### 3.1 8维度分析迁移（Week 1: 4-5天）

**`/packages/shared/src/types/analysis-dimensions.ts`** (NEW)
```typescript
export interface AnalysisDimensions {
  role_positioning: RolePositioning;           // 角色定位
  core_responsibilities: CoreResponsibilities; // 核心职责
  keyword_matching: KeywordMatching;           // 关键词匹配
  key_requirements: KeyRequirements;           // 关键要求
  swot_analysis: SWOTAnalysis;                 // SWOT分析
  cv_strategy: CVStrategy;                     // ⭐ CV策略（核心）
  interview_preparation: InterviewPreparation; // 面试准备
  match_score: MatchScore;                     // 匹配度评分
}

export interface CVStrategy {
  priority_order: string[];              // 章节推荐顺序
  // 示例: ["header", "summary", "skills", "experience", "projects", "education"]

  emphasis: Record<string, number>;      // 章节强调权重 (0-100)
  // 示例: { "skills": 90, "experience": 85, "projects": 70, "education": 40 }

  project_focus: string[];               // 应突出的项目
  // 示例: ["E-commerce Platform", "Data Pipeline"]

  skills_highlight: string[];            // 应强调的技能
  // 示例: ["React", "TypeScript", "PostgreSQL"]

  experience_framing: Record<string, string>; // 经历描述指导
  // 示例: { "work_1": "强调领导力和团队管理", "work_2": "关注技术架构决策" }

  avoid: string[];                       // 应淡化的内容
  // 示例: ["过时的PHP项目", "非相关的零售经验"]

  tone: 'formal' | 'conversational' | 'technical'; // 推荐语气
}
```

**`/lib/ai/templates/job-matching-v2.ts`** (NEW - 增强Prompt)
```typescript
export function buildEnhancedJobMatchingPrompt(job, resume, profile): string {
  return `
你是专业职业教练。请对这份岗位-候选人匹配进行8维度分析。

## 输出格式（使用分隔符）

---SCORE---
75
---RECOMMENDATION---
moderate
---DIMENSIONS---
{
  "role_positioning": {...},
  "core_responsibilities": {...},
  "keyword_matching": {...},
  "key_requirements": {...},
  "swot_analysis": {...},
  "cv_strategy": {
    "priority_order": ["header", "summary", "skills", "experience", "projects", "education"],
    "emphasis": {
      "skills": 90,
      "experience": 85,
      "projects": 70,
      "education": 40
    },
    "project_focus": ["Project A", "Project B"],
    "skills_highlight": ["React", "Node.js", "AWS"],
    "experience_framing": {
      "work_1": "强调可扩展性改进",
      "work_2": "关注团队协作"
    },
    "avoid": ["过时技术"],
    "tone": "technical"
  },
  "interview_preparation": {...},
  "match_score": {...}
}
---ANALYSIS---
# 详细Markdown分析报告
...
---END---
  `;
}
```

**集成点**: `/app/api/jobs/[id]/analyze/route.ts`
```typescript
// 使用新的prompt
const prompt = buildEnhancedJobMatchingPrompt(job, resume, profile);

// 解析AI响应
const parsed = parseEnhancedAIResponse(responseText);
// parsed = { score, recommendation, dimensions, analysis }

// 保存到数据库
await supabase.from('analysis_sessions').insert({
  ...existing,
  dimensions: parsed.dimensions, // NEW: 结构化8维度数据
});
```

### 3.2 CV策略驱动的内容优化（Week 2: 5-6天）

**`/lib/ai/resume-content-optimizer.ts`** (NEW)
```typescript
/**
 * 简历内容优化器 - 应用CV策略到Profile数据
 */
export class ResumeContentOptimizer {
  /**
   * 主入口
   */
  optimizeContent(
    profile: UserProfile,
    cvStrategy: CVStrategy,
    job: Job
  ): OptimizedResumeContent {
    return {
      personalInfo: profile.personal_info,

      // 根据tone生成定制化职业目标
      careerObjective: this.buildTargetedObjective(profile, job, cvStrategy),

      // 只选择cvStrategy.skills_highlight中的技能
      skills: this.selectSkills(profile.skills, cvStrategy.skills_highlight),

      // 根据experience_framing重新排序成就
      workExperience: this.optimizeWorkExp(profile.work_experiences, cvStrategy),

      // 只包含project_focus中的项目（最多3个）
      projects: this.selectProjects(profile.projects, cvStrategy.project_focus),

      // 根据emphasis调整教育内容详细程度
      education: this.formatEducation(profile.education_records, cvStrategy.emphasis.education),

      certifications: profile.certifications,
    };
  }

  private selectProjects(allProjects, focusProjects): Project[] {
    // 过滤出CV策略建议的项目
    return allProjects
      .filter(p => focusProjects.some(fp =>
        p.project_name.toLowerCase().includes(fp.toLowerCase())
      ))
      .slice(0, 3); // 限制最多3个
  }

  private optimizeWorkExp(experiences, cvStrategy): WorkExperience[] {
    return experiences.map((exp, index) => {
      const framing = cvStrategy.experience_framing[`work_${index}`];
      if (framing) {
        // 根据framing指导重新排序成就
        // 例如：如果framing说"强调领导力"，则将包含"领导"关键词的成就排在前面
        exp.achievements = this.reorderByRelevance(exp.achievements, framing);
      }
      return exp;
    });
  }

  private buildTargetedObjective(profile, job, cvStrategy): string {
    const keySkills = cvStrategy.skills_highlight.slice(0, 3).join(', ');

    if (cvStrategy.tone === 'formal') {
      return `Experienced professional seeking ${job.title} position to leverage expertise in ${keySkills}.`;
    } else if (cvStrategy.tone === 'technical') {
      return `Software engineer specializing in ${keySkills}, seeking ${job.title} role at ${job.company}.`;
    } else {
      return `Passionate about ${keySkills}. Excited to join ${job.company} as ${job.title}.`;
    }
  }
}
```

**集成到生成流程**: `/app/api/resumes/generate-from-analysis/route.ts` (MAJOR REFACTOR)
```typescript
// Line ~80: 获取分析会话（包含dimensions）
const { data: session } = await supabase
  .from('analysis_sessions')
  .select('*, dimensions')
  .eq('id', sessionId)
  .single();

// Line ~122: 检查是否有CV策略
if (!session.dimensions?.cv_strategy) {
  return NextResponse.json(
    { error: 'Analysis missing CV strategy. Please re-run analysis.' },
    { status: 400 }
  );
}

// Line ~140: 应用CV策略优化Profile数据
const optimizer = new ResumeContentOptimizer();
const optimizedProfile = optimizer.optimizeContent(
  profile,
  session.dimensions.cv_strategy,
  job
);

// Line ~148: 使用优化后的Profile生成prompt
const prompt = buildResumeGenerationPrompt(job, optimizedProfile, session.analysis);

// 或者：在prompt中明确包含CV策略
const enhancedPrompt = `
${prompt}

## CV策略指导（来自分析）
${JSON.stringify(session.dimensions.cv_strategy, null, 2)}

**生成指令**:
- 严格按照priority_order的顺序排列章节
- 根据emphasis权重分配内容详细程度
- 只包含project_focus列表中的项目
- 突出skills_highlight中的技能
- 按experience_framing指导来描述工作经历
- 淡化或省略avoid列表中的内容
- 使用推荐的语气: ${session.dimensions.cv_strategy.tone}
`;
```

### 3.3 智能模板推荐（Week 3: 2-3天）

**`/lib/ai/template-recommender.ts`** (NEW)
```typescript
/**
 * 基于岗位和CV策略自动推荐最佳模板
 */
export function recommendTemplate(
  job: Job,
  cvStrategy: CVStrategy
): string {
  // 规则1: 职位类型匹配
  const jobTitle = job.title.toLowerCase();

  if (jobTitle.includes('engineer') || jobTitle.includes('developer')) {
    return 'tech-engineer';
  }

  if (jobTitle.includes('finance') || jobTitle.includes('analyst')) {
    return 'finance-analyst';
  }

  if (jobTitle.includes('design') || cvStrategy.tone === 'creative') {
    return 'creative-designer';
  }

  // 规则2: 基于emphasis权重
  const maxEmphasis = Object.entries(cvStrategy.emphasis)
    .sort((a, b) => b[1] - a[1])[0];

  if (maxEmphasis[0] === 'projects' && maxEmphasis[1] > 80) {
    return 'creative-gradient'; // 项目驱动的布局
  }

  if (maxEmphasis[0] === 'experience' && maxEmphasis[1] > 90) {
    return 'executive-minimal'; // 经验为重
  }

  // 规则3: 语气匹配
  if (cvStrategy.tone === 'formal') {
    return 'classic-serif';
  }

  // 默认
  return 'modern-blue';
}
```

**自动模板选择集成**:
```typescript
// 在 /api/resumes/generate-from-analysis/route.ts

// Line ~42: templateId变为可选
const { sessionId, provider, templateId } = body;

// Line ~145: 如果用户没选择，自动推荐
const finalTemplateId = templateId ||
  recommendTemplate(job, session.dimensions.cv_strategy);

console.log(`📋 Template: ${finalTemplateId} (${templateId ? 'user-selected' : 'auto-recommended'})`);

// Line ~310: 保存时标记来源
await supabase.from('resumes').insert({
  ...existing,
  template_id: finalTemplateId,
  source: templateId ? 'ai_generated' : 'ai_generated_auto_template',
});
```

**行业专用模板**:
```sql
-- 添加3个行业模板
INSERT INTO public.resume_templates (id, name, description, category, config) VALUES
('tech-engineer', 'Software Engineer', 'Optimized for software roles', 'industry', '{
  "colors": {"primary": "#10B981"},
  "layout": "single-column",
  "sections_order": ["header", "summary", "skills", "experience", "projects", "education"],
  "default_emphasis": {"skills": 95, "projects": 90, "experience": 85}
}'),
('finance-analyst', 'Financial Analyst', 'Formal for finance industry', 'industry', '{
  "colors": {"primary": "#1E40AF"},
  "fonts": {"heading": "Times-Bold", "body": "Times-Roman"},
  "sections_order": ["header", "summary", "experience", "education", "certifications", "skills"]
}'),
('creative-designer', 'Creative Designer', 'Visual-first for designers', 'industry', '{
  "colors": {"primary": "#EC4899", "secondary": "#8B5CF6"},
  "layout": "two-column",
  "sections_order": ["header", "portfolio", "skills", "experience", "education"]
}');
```

---

## 🎯 关键文件清单

### Phase 1 核心文件

| 文件 | 类型 | 作用 |
|------|------|------|
| `/supabase/migrations/20251210000000_resume_quality_enhancement.sql` | NEW | 数据库schema变更 |
| `/apps/web/src/lib/ai/resume-quality-validator.ts` | NEW | 质量验证核心逻辑 |
| `/apps/web/src/lib/resume-renderers/pdf-renderer.tsx` | NEW | 动态PDF生成 |
| `/apps/web/src/lib/resume-renderers/html-renderer.ts` | NEW | HTML导出 |
| `/apps/web/src/lib/resume-renderers/base-renderer.ts` | NEW | 渲染器抽象基类 |
| `/apps/web/src/app/api/resumes/[id]/export/route.ts` | NEW | 统一导出API |
| `/apps/web/src/app/api/resumes/generate-from-analysis/route.ts` | MODIFY | 集成质量验证 |
| `/packages/shared/src/types/template.ts` | NEW | 模板类型定义 |
| `/packages/shared/src/types/resume-quality.ts` | NEW | 质量类型定义 |

### Phase 2 核心文件

| 文件 | 类型 | 作用 |
|------|------|------|
| `/apps/web/src/components/templates/TemplateGallery.tsx` | NEW | 模板选择UI |
| `/apps/web/src/components/templates/TemplateCustomizer.tsx` | NEW | 样式定制器 |
| `/apps/web/src/lib/resume-renderers/layouts/two-column.tsx` | NEW | 双栏布局 |
| `/apps/web/src/app/api/templates/route.ts` | NEW | 模板列表API |
| `/apps/web/src/app/api/templates/custom/route.ts` | NEW | 自定义模板API |

### Phase 3 核心文件

| 文件 | 类型 | 作用 |
|------|------|------|
| `/packages/shared/src/types/analysis-dimensions.ts` | NEW | 8维度类型定义 |
| `/apps/web/src/lib/ai/templates/job-matching-v2.ts` | NEW | 8维度分析Prompt |
| `/apps/web/src/lib/ai/resume-content-optimizer.ts` | NEW | CV策略内容优化器 |
| `/apps/web/src/lib/ai/template-recommender.ts` | NEW | 智能模板推荐 |
| `/apps/web/src/app/api/jobs/[id]/analyze/route.ts` | MODIFY | 8维度输出 |

---

## ⚠️ 风险与缓解

### 技术风险

| 风险 | 概率 | 影响 | 缓解方案 |
|------|------|------|---------|
| 质量验证器误报 | 中 | 中 | 可调节阈值；大量真实数据测试 |
| 8维度解析失败 | 中 | 高 | 使用分隔符格式（比JSON更可靠）；fallback解析 |
| HTML导出兼容性 | 中 | 低 | 跨浏览器测试；内联CSS；标准HTML5 |
| 模板渲染性能 | 低 | 中 | 缓存；懒加载；优化bundle大小 |

### 向后兼容策略

1. **渐进式增强**: 所有新字段使用 `ADD COLUMN IF NOT EXISTS`
2. **默认值**: 现有简历自动使用 `modern-blue` 模板
3. **Legacy支持**: 保留 `ResumePDFTemplate.legacy.tsx` 到Phase 2完成
4. **优雅降级**: 如果分析缺少CV策略，使用标准生成流程

---

## 📊 成功指标

### Phase 1
- [ ] 95%+ 简历质量评分 > 70
- [ ] 零虚构内容事件
- [ ] HTML导出与PDF视觉一致性 > 95%
- [ ] 无现有功能回归

### Phase 2
- [ ] 用户平均尝试 2+ 模板
- [ ] 模板预览加载时间 < 3秒
- [ ] 30%+ 用户使用样式定制
- [ ] 模板多样性（modern-blue使用率 < 60%）

### Phase 3
- [ ] CV策略准确性 > 85%（专家验证）
- [ ] 项目选择正确率 > 90%
- [ ] 自动推荐模板匹配用户偏好 > 75%
- [ ] 使用CV策略的简历感知质量提升 20%+（A/B测试）

---

## 📅 时间表

| 阶段 | 周数 | 完成标志 |
|------|------|---------|
| **Phase 1: 基础架构** | 2-3周 | ✅ 质量评分、2个模板、HTML导出 |
| **Phase 2: 多模板系统** | 3-4周 | ✅ 5个模板、选择UI、样式定制 |
| **Phase 3: 智能增强** | 2-3周 | ✅ 8维度分析、CV策略、智能推荐 |
| **总计** | **10周** | **全面增强完成** |

**预计开始**: 2025-12-15
**预计完成**: 2025-03-15

---

## 🚀 下一步行动

### 立即开始（本周）
1. ✅ 创建数据库迁移文件 `20251210000000_resume_quality_enhancement.sql`
2. ✅ 创建类型定义文件 `types/resume-quality.ts` 和 `types/template.ts`
3. ✅ 搭建 `lib/resume-renderers/` 目录结构

### Week 1 Day 1-2
- 实现 `resume-quality-validator.ts` 核心逻辑
- 编写单元测试

### Week 1 Day 3-4
- 实现 `pdf-renderer.tsx` 和 `html-renderer.ts`
- 创建 `base-renderer.ts` 抽象基类
- 实现 `single-column.tsx` 布局组件

### Week 1 Day 5
- 集成到 `generate-from-analysis/route.ts`
- 创建统一导出API `/api/resumes/[id]/export/route.ts`

### Week 2
- 全面测试Phase 1功能
- 修复bug
- 准备Phase 2开发

---

## 📝 相关文档

- [当前简历生成分析](./RESUME_GENERATION_ANALYSIS.md) - 现有系统深度分析
- [project-resume-optimizer分析](./PROJECT_RESUME_OPTIMIZER_ANALYSIS.md) - 8维度系统参考
- [技术决策记录](./DECISIONS.md) - 架构决策
- [API文档](./API.md) - API规范

---

## 👥 团队分工建议

如果有多人协作，建议如下分工：

**Backend Developer**:
- Phase 1: 质量验证器 + 数据库迁移
- Phase 3: 8维度分析集成 + CV策略优化器

**Frontend Developer**:
- Phase 2: 模板UI组件 (Gallery, Customizer, Preview)
- Phase 2: 集成到用户流程

**Full-stack Developer**:
- Phase 1: 渲染引擎 (PDF/HTML)
- Phase 3: 智能推荐系统

**QA/Tester**:
- 所有Phase: 端到端测试
- Phase 1: 质量验证准确性测试
- Phase 3: CV策略效果验证

---

**实施原则**:
- ✅ 每个Phase独立可交付
- ✅ 向后兼容优先
- ✅ 质量优于速度
- ✅ 充分测试后再推进
- ✅ 持续文档更新

---

*最后更新: 2025-12-10*
*维护者: Claude Code*
*版本: v1.0*
