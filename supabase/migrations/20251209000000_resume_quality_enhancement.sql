-- Phase 1: Resume Quality Enhancement and Template System
-- 简历质量增强和模板系统基础设施

-- ============================================================================
-- 1. 增强 resumes 表 - 添加质量控制字段
-- ============================================================================

-- 添加质量评分字段
ALTER TABLE public.resumes
  ADD COLUMN IF NOT EXISTS quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100);

-- 添加验证标记字段（存储验证问题和警告）
ALTER TABLE public.resumes
  ADD COLUMN IF NOT EXISTS validation_flags JSONB DEFAULT '{}';

-- 添加数据来源映射字段（追踪简历字段到Profile表的映射关系）
ALTER TABLE public.resumes
  ADD COLUMN IF NOT EXISTS source_mapping JSONB;

-- 添加索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_resumes_quality_score ON public.resumes(quality_score);
CREATE INDEX IF NOT EXISTS idx_resumes_template_id ON public.resumes(template_id);

-- 添加注释
COMMENT ON COLUMN public.resumes.quality_score IS '质量评分 (0-100)：基于准确性、完整性、相关性的综合评分';
COMMENT ON COLUMN public.resumes.validation_flags IS '验证标记：记录质量检查发现的问题、警告和建议';
COMMENT ON COLUMN public.resumes.source_mapping IS '数据来源映射：追踪简历每个字段对应的Profile表记录ID';

-- ============================================================================
-- 2. 创建 resume_templates 表 - 模板系统
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.resume_templates (
    id TEXT PRIMARY KEY,                         -- 模板ID，如 'modern-blue', 'classic-serif'
    name TEXT NOT NULL,                          -- 模板显示名称
    description TEXT,                            -- 模板描述
    category TEXT NOT NULL,                      -- 分类: 'modern', 'classic', 'creative', 'industry'
    config JSONB NOT NULL,                       -- 模板配置（颜色、字体、布局等）
    preview_url TEXT,                            -- 预览图URL
    supports_pdf BOOLEAN DEFAULT true,           -- 是否支持PDF导出
    supports_html BOOLEAN DEFAULT true,          -- 是否支持HTML导出
    is_active BOOLEAN DEFAULT true,              -- 是否启用
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_resume_templates_category ON public.resume_templates(category);
CREATE INDEX IF NOT EXISTS idx_resume_templates_active ON public.resume_templates(is_active);

-- 添加注释
COMMENT ON TABLE public.resume_templates IS '简历模板库：存储预定义的简历样式模板';
COMMENT ON COLUMN public.resume_templates.config IS '模板配置JSON：包含colors, fonts, layout, sections_order等';

-- ============================================================================
-- 3. 创建 user_custom_templates 表 - 用户自定义模板
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_custom_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    base_template_id TEXT REFERENCES public.resume_templates(id),
    name TEXT NOT NULL,                          -- 用户自定义名称
    custom_config JSONB NOT NULL,                -- 用户修改的配置（覆盖base_template的config）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_user_custom_templates_user_id ON public.user_custom_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_custom_templates_base_template ON public.user_custom_templates(base_template_id);

-- 添加注释
COMMENT ON TABLE public.user_custom_templates IS '用户自定义模板：基于预定义模板的个性化定制';
COMMENT ON COLUMN public.user_custom_templates.custom_config IS '自定义配置：覆盖基础模板的样式设置';

-- ============================================================================
-- 4. 增强 resume_generation_logs 表 - 添加质量指标
-- ============================================================================

ALTER TABLE public.resume_generation_logs
  ADD COLUMN IF NOT EXISTS validation_result JSONB;

ALTER TABLE public.resume_generation_logs
  ADD COLUMN IF NOT EXISTS quality_metrics JSONB;

-- 添加注释
COMMENT ON COLUMN public.resume_generation_logs.validation_result IS '验证结果：质量检查的详细结果';
COMMENT ON COLUMN public.resume_generation_logs.quality_metrics IS '质量指标：准确性、幻觉检测等统计数据';

-- ============================================================================
-- 5. 插入默认模板数据
-- ============================================================================

-- 模板1: Modern Blue - 现代蓝色主题
INSERT INTO public.resume_templates (id, name, description, category, config)
VALUES (
    'modern-blue',
    'Modern Blue',
    'Clean and professional design with blue accent colors. Best for tech and corporate roles.',
    'modern',
    '{
        "colors": {
            "primary": "#2563EB",
            "secondary": "#3B82F6",
            "text": "#1F2937",
            "textLight": "#6B7280",
            "background": "#FFFFFF",
            "accent": "#DBEAFE"
        },
        "fonts": {
            "heading": "Helvetica-Bold",
            "body": "Helvetica",
            "headingSize": 14,
            "bodySize": 10
        },
        "layout": "single-column",
        "sections_order": [
            "header",
            "summary",
            "skills",
            "experience",
            "projects",
            "education",
            "certifications"
        ],
        "spacing": {
            "sectionGap": 15,
            "itemGap": 10,
            "lineHeight": 1.4
        }
    }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    config = EXCLUDED.config,
    updated_at = NOW();

-- 模板2: Classic Serif - 经典衬线字体
INSERT INTO public.resume_templates (id, name, description, category, config)
VALUES (
    'classic-serif',
    'Classic Serif',
    'Traditional serif design with formal styling. Ideal for finance, legal, and academic positions.',
    'classic',
    '{
        "colors": {
            "primary": "#000000",
            "secondary": "#333333",
            "text": "#1A1A1A",
            "textLight": "#666666",
            "background": "#FFFFFF",
            "accent": "#E5E5E5"
        },
        "fonts": {
            "heading": "Times-Bold",
            "body": "Times-Roman",
            "headingSize": 14,
            "bodySize": 10
        },
        "layout": "single-column",
        "sections_order": [
            "header",
            "summary",
            "experience",
            "education",
            "skills",
            "certifications",
            "projects"
        ],
        "spacing": {
            "sectionGap": 12,
            "itemGap": 8,
            "lineHeight": 1.5
        }
    }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    config = EXCLUDED.config,
    updated_at = NOW();

-- ============================================================================
-- 6. Row Level Security (RLS) 策略
-- ============================================================================

-- resume_templates 表的RLS（公开可读）
ALTER TABLE public.resume_templates ENABLE ROW LEVEL SECURITY;

-- 所有人可以查看已启用的模板
CREATE POLICY "Anyone can view active templates"
    ON public.resume_templates
    FOR SELECT
    USING (is_active = true);

-- 只有管理员可以修改模板（未来可扩展）
-- CREATE POLICY "Only admins can modify templates"
--     ON public.resume_templates
--     FOR ALL
--     USING (auth.jwt() ->> 'role' = 'admin');

-- user_custom_templates 表的RLS
ALTER TABLE public.user_custom_templates ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的自定义模板
CREATE POLICY "Users can view own custom templates"
    ON public.user_custom_templates
    FOR SELECT
    USING (auth.uid() = user_id);

-- 用户可以创建自己的自定义模板
CREATE POLICY "Users can create own custom templates"
    ON public.user_custom_templates
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 用户可以更新自己的自定义模板
CREATE POLICY "Users can update own custom templates"
    ON public.user_custom_templates
    FOR UPDATE
    USING (auth.uid() = user_id);

-- 用户可以删除自己的自定义模板
CREATE POLICY "Users can delete own custom templates"
    ON public.user_custom_templates
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 7. 更新触发器（自动更新 updated_at）
-- ============================================================================

-- 为 resume_templates 添加更新触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_resume_templates_updated_at
    BEFORE UPDATE ON public.resume_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_custom_templates_updated_at
    BEFORE UPDATE ON public.user_custom_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Migration完成
-- ============================================================================
