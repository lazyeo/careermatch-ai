-- CareerMatch AI Database Schema
-- Profile-Centric Architecture Migration
-- 个人资料中心化架构重构

-- =====================================================
-- STEP 0: 启用必要的扩展
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- =====================================================
-- STEP 1: 归档旧表（重命名，保留数据参考）
-- =====================================================
ALTER TABLE IF EXISTS public.profiles RENAME TO profiles_v1_archived;
ALTER TABLE IF EXISTS public.resumes RENAME TO resumes_v1_archived;
-- jobs表保留，后续逐步迁移到jobs_v2

-- =====================================================
-- STEP 2: 创建新的Profile中心化表结构
-- =====================================================

-- 1. user_profiles (个人基本信息)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

    -- 固定字段
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    location TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    website_url TEXT,
    avatar_url TEXT,
    professional_summary TEXT,
    target_roles TEXT[] DEFAULT '{}',

    -- 扩展字段 (JSONB)
    extended_data JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);

-- 2. work_experiences (工作经历)
CREATE TABLE public.work_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    company TEXT NOT NULL,
    position TEXT NOT NULL,
    location TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    achievements TEXT[] DEFAULT '{}',
    technologies TEXT[] DEFAULT '{}',
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_work_experiences_user_id ON public.work_experiences(user_id);
CREATE INDEX idx_work_experiences_order ON public.work_experiences(user_id, display_order);

-- 3. education_records (教育背景)
CREATE TABLE public.education_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    institution TEXT NOT NULL,
    degree TEXT NOT NULL,
    major TEXT NOT NULL,
    location TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    gpa DECIMAL(3,2),
    achievements TEXT[] DEFAULT '{}',
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_education_records_user_id ON public.education_records(user_id);
CREATE INDEX idx_education_records_order ON public.education_records(user_id, display_order);

-- 4. user_skills (技能)
CREATE TABLE public.user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    years_experience INTEGER,
    category TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

CREATE INDEX idx_user_skills_user_id ON public.user_skills(user_id);
CREATE INDEX idx_user_skills_category ON public.user_skills(user_id, category);

-- 5. user_projects (项目经历)
CREATE TABLE public.user_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    role TEXT,
    start_date DATE,
    end_date DATE,
    technologies TEXT[] DEFAULT '{}',
    highlights TEXT[] DEFAULT '{}',
    url TEXT,
    github_url TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_projects_user_id ON public.user_projects(user_id);
CREATE INDEX idx_user_projects_order ON public.user_projects(user_id, display_order);

-- 6. user_certifications (证书)
CREATE TABLE public.user_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    issuer TEXT NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    credential_id TEXT,
    credential_url TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_certifications_user_id ON public.user_certifications(user_id);

-- 7. resume_uploads (简历上传记录)
CREATE TABLE public.resume_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'docx', 'doc', 'txt')),
    file_size INTEGER,
    storage_path TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    parsed_data JSONB,
    error_message TEXT,
    ai_provider TEXT,
    ai_model TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_resume_uploads_user_id ON public.resume_uploads(user_id);
CREATE INDEX idx_resume_uploads_status ON public.resume_uploads(user_id, status);

-- 8. jobs_v2 (岗位信息 - 灵活结构)
CREATE TABLE public.jobs_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- 固定字段（必需）
    title TEXT NOT NULL,
    company TEXT NOT NULL,

    -- 固定字段（可选）
    location TEXT,
    salary_range TEXT,
    job_type TEXT,
    remote_policy TEXT,
    source_url TEXT,
    source_platform TEXT,

    -- 灵活字段（AI解析的完整描述）
    description TEXT,

    -- AI解析的结构化内容（JSONB灵活存储）
    parsed_content JSONB DEFAULT '{}',

    -- 元数据
    status TEXT DEFAULT 'saved' CHECK (status IN ('saved', 'applied', 'interviewing', 'offered', 'rejected', 'withdrawn')),
    import_method TEXT CHECK (import_method IN ('url', 'screenshot', 'paste', 'manual')),
    ai_provider TEXT,
    ai_model TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_jobs_v2_user_id ON public.jobs_v2(user_id);
CREATE INDEX idx_jobs_v2_status ON public.jobs_v2(user_id, status);
CREATE INDEX idx_jobs_v2_created_at ON public.jobs_v2(created_at DESC);

-- 9. job_imports (岗位导入记录)
CREATE TABLE public.job_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    job_id UUID REFERENCES public.jobs_v2(id) ON DELETE SET NULL,

    -- 导入来源
    import_type TEXT NOT NULL CHECK (import_type IN ('url', 'screenshot', 'paste')),
    source_url TEXT,
    source_content TEXT,
    screenshot_path TEXT,

    -- 处理状态
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    parsed_data JSONB,
    error_message TEXT,

    ai_provider TEXT,
    ai_model TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_job_imports_user_id ON public.job_imports(user_id);
CREATE INDEX idx_job_imports_status ON public.job_imports(user_id, status);

-- 10. documents (统一文档表 - 支持版本管理)
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- 文档类型
    doc_type TEXT NOT NULL CHECK (doc_type IN ('resume', 'cover_letter', 'other')),
    title TEXT NOT NULL,

    -- 关联岗位（可选）
    target_job_id UUID REFERENCES public.jobs_v2(id) ON DELETE SET NULL,

    -- 内容
    content_markdown TEXT NOT NULL,

    -- 版本管理
    version INTEGER DEFAULT 1,
    parent_version_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    is_latest BOOLEAN DEFAULT TRUE,

    -- AI生成元数据
    generation_prompt TEXT,
    ai_provider TEXT,
    ai_model TEXT,

    -- 样式配置
    template_id TEXT,
    style_config JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_type ON public.documents(user_id, doc_type);
CREATE INDEX idx_documents_job ON public.documents(target_job_id);
CREATE INDEX idx_documents_latest ON public.documents(user_id, doc_type, target_job_id, is_latest) WHERE is_latest = TRUE;

-- 11. document_comparisons (文档对比记录)
CREATE TABLE public.document_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    doc_a_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
    doc_b_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,

    -- AI生成的对比分析
    comparison_result JSONB,

    ai_provider TEXT,
    ai_model TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_document_comparisons_user_id ON public.document_comparisons(user_id);

-- =====================================================
-- STEP 3: Row Level Security (RLS) 策略
-- =====================================================

-- user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
    ON public.user_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
    ON public.user_profiles FOR DELETE
    USING (auth.uid() = user_id);

-- work_experiences
ALTER TABLE public.work_experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own work experiences"
    ON public.work_experiences FOR ALL
    USING (auth.uid() = user_id);

-- education_records
ALTER TABLE public.education_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own education records"
    ON public.education_records FOR ALL
    USING (auth.uid() = user_id);

-- user_skills
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own skills"
    ON public.user_skills FOR ALL
    USING (auth.uid() = user_id);

-- user_projects
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own projects"
    ON public.user_projects FOR ALL
    USING (auth.uid() = user_id);

-- user_certifications
ALTER TABLE public.user_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own certifications"
    ON public.user_certifications FOR ALL
    USING (auth.uid() = user_id);

-- resume_uploads
ALTER TABLE public.resume_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own resume uploads"
    ON public.resume_uploads FOR ALL
    USING (auth.uid() = user_id);

-- jobs_v2
ALTER TABLE public.jobs_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own jobs"
    ON public.jobs_v2 FOR ALL
    USING (auth.uid() = user_id);

-- job_imports
ALTER TABLE public.job_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own job imports"
    ON public.job_imports FOR ALL
    USING (auth.uid() = user_id);

-- documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own documents"
    ON public.documents FOR ALL
    USING (auth.uid() = user_id);

-- document_comparisons
ALTER TABLE public.document_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own document comparisons"
    ON public.document_comparisons FOR ALL
    USING (auth.uid() = user_id);

-- =====================================================
-- STEP 4: Triggers (自动更新 updated_at)
-- =====================================================

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_experiences_updated_at BEFORE UPDATE ON public.work_experiences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_education_records_updated_at BEFORE UPDATE ON public.education_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_projects_updated_at BEFORE UPDATE ON public.user_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_v2_updated_at BEFORE UPDATE ON public.jobs_v2
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 5: 更新用户创建触发器
-- =====================================================

-- 删除旧的用户创建触发器（指向旧表）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 创建新的用户创建处理函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, full_name, email, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建新的触发器
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STEP 6: Helper Functions
-- =====================================================

-- 获取用户完整资料（包含所有子资源）
CREATE OR REPLACE FUNCTION public.get_full_profile(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'profile', (
            SELECT row_to_json(p)
            FROM public.user_profiles p
            WHERE p.user_id = user_uuid
        ),
        'work_experiences', (
            SELECT json_agg(row_to_json(w) ORDER BY w.display_order, w.start_date DESC)
            FROM public.work_experiences w
            WHERE w.user_id = user_uuid
        ),
        'education_records', (
            SELECT json_agg(row_to_json(e) ORDER BY e.display_order, e.start_date DESC)
            FROM public.education_records e
            WHERE e.user_id = user_uuid
        ),
        'skills', (
            SELECT json_agg(row_to_json(s) ORDER BY s.display_order, s.category)
            FROM public.user_skills s
            WHERE s.user_id = user_uuid
        ),
        'projects', (
            SELECT json_agg(row_to_json(pr) ORDER BY pr.display_order, pr.start_date DESC)
            FROM public.user_projects pr
            WHERE pr.user_id = user_uuid
        ),
        'certifications', (
            SELECT json_agg(row_to_json(c) ORDER BY c.display_order, c.issue_date DESC)
            FROM public.user_certifications c
            WHERE c.user_id = user_uuid
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 计算Profile完成度
CREATE OR REPLACE FUNCTION public.get_profile_completeness(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    total_score INTEGER := 0;
    max_score INTEGER := 100;
    has_profile BOOLEAN := FALSE;
    has_work BOOLEAN := FALSE;
    has_education BOOLEAN := FALSE;
    has_skills BOOLEAN := FALSE;
    has_projects BOOLEAN := FALSE;
    has_summary BOOLEAN := FALSE;
BEGIN
    -- 检查基本资料 (20分)
    SELECT EXISTS(
        SELECT 1 FROM public.user_profiles
        WHERE user_id = user_uuid AND full_name IS NOT NULL AND full_name != ''
    ) INTO has_profile;
    IF has_profile THEN total_score := total_score + 20; END IF;

    -- 检查专业摘要 (15分)
    SELECT EXISTS(
        SELECT 1 FROM public.user_profiles
        WHERE user_id = user_uuid AND professional_summary IS NOT NULL AND professional_summary != ''
    ) INTO has_summary;
    IF has_summary THEN total_score := total_score + 15; END IF;

    -- 检查工作经历 (25分)
    SELECT EXISTS(
        SELECT 1 FROM public.work_experiences WHERE user_id = user_uuid
    ) INTO has_work;
    IF has_work THEN total_score := total_score + 25; END IF;

    -- 检查教育背景 (15分)
    SELECT EXISTS(
        SELECT 1 FROM public.education_records WHERE user_id = user_uuid
    ) INTO has_education;
    IF has_education THEN total_score := total_score + 15; END IF;

    -- 检查技能 (15分)
    SELECT EXISTS(
        SELECT 1 FROM public.user_skills WHERE user_id = user_uuid
    ) INTO has_skills;
    IF has_skills THEN total_score := total_score + 15; END IF;

    -- 检查项目经历 (10分)
    SELECT EXISTS(
        SELECT 1 FROM public.user_projects WHERE user_id = user_uuid
    ) INTO has_projects;
    IF has_projects THEN total_score := total_score + 10; END IF;

    RETURN json_build_object(
        'score', total_score,
        'max_score', max_score,
        'percentage', ROUND((total_score::DECIMAL / max_score) * 100),
        'sections', json_build_object(
            'profile', has_profile,
            'summary', has_summary,
            'work', has_work,
            'education', has_education,
            'skills', has_skills,
            'projects', has_projects
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取文档版本历史
CREATE OR REPLACE FUNCTION public.get_document_versions(doc_id UUID)
RETURNS TABLE (
    id UUID,
    version INTEGER,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    is_latest BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE version_chain AS (
        -- 从指定文档开始
        SELECT d.id, d.version, d.title, d.created_at, d.is_latest, d.parent_version_id
        FROM public.documents d
        WHERE d.id = doc_id

        UNION ALL

        -- 向前追溯父版本
        SELECT d.id, d.version, d.title, d.created_at, d.is_latest, d.parent_version_id
        FROM public.documents d
        INNER JOIN version_chain vc ON d.id = vc.parent_version_id
    )
    SELECT vc.id, vc.version, vc.title, vc.created_at, vc.is_latest
    FROM version_chain vc
    ORDER BY vc.version DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 7: Storage配置（用于文件上传）
-- =====================================================

-- 创建简历上传bucket（如果不存在）
INSERT INTO storage.buckets (id, name, public)
VALUES ('resume-uploads', 'resume-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- 创建岗位截图bucket（如果不存在）
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-screenshots', 'job-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS策略
CREATE POLICY "Users can upload own resumes"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'resume-uploads' AND
        auth.uid()::TEXT = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own resumes"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'resume-uploads' AND
        auth.uid()::TEXT = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own resumes"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'resume-uploads' AND
        auth.uid()::TEXT = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can upload own job screenshots"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'job-screenshots' AND
        auth.uid()::TEXT = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own job screenshots"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'job-screenshots' AND
        auth.uid()::TEXT = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own job screenshots"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'job-screenshots' AND
        auth.uid()::TEXT = (storage.foldername(name))[1]
    );
