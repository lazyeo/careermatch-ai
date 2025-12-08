-- Phase 3: 智能增强 - 添加8维度分析字段
-- 为analysis_sessions表添加dimensions字段，存储结构化的8维度分析数据

-- 添加dimensions字段
ALTER TABLE public.analysis_sessions
ADD COLUMN IF NOT EXISTS dimensions JSONB DEFAULT NULL;

-- 添加注释
COMMENT ON COLUMN public.analysis_sessions.dimensions IS '8维度分析结构化数据 (JSON): role_positioning, core_responsibilities, keyword_matching, key_requirements, swot_analysis, cv_strategy, interview_preparation, match_score';

-- 创建索引以支持对dimensions的查询
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_dimensions_cv_strategy
ON public.analysis_sessions
USING gin ((dimensions -> 'cvStrategy'));

-- 创建索引以支持按匹配分数排序
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_dimensions_score
ON public.analysis_sessions
USING btree (((dimensions -> 'matchScore' ->> 'overall')::int));

-- 添加template_id字段到resumes表（如果不存在）
ALTER TABLE public.resumes
ADD COLUMN IF NOT EXISTS template_id TEXT REFERENCES public.resume_templates(id) ON DELETE SET NULL;

-- 添加source字段到resumes表（如果不存在）
ALTER TABLE public.resumes
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

COMMENT ON COLUMN public.resumes.template_id IS '使用的模板ID';
COMMENT ON COLUMN public.resumes.source IS '简历来源: manual, ai_generated, ai_generated_v2, imported';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_resumes_template_id
ON public.resumes(template_id);

CREATE INDEX IF NOT EXISTS idx_resumes_source
ON public.resumes(source);
