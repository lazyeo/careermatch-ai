-- AI Analysis Sessions Migration
-- 将AI分析从固定9维度升级为框架内自主 + 对话式交互

-- =====================================================
-- ANALYSIS_SESSIONS TABLE
-- 存储AI分析会话和结果
-- =====================================================
CREATE TABLE public.analysis_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- 会话状态
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),

    -- AI分析结果
    score INTEGER CHECK (score >= 0 AND score <= 100),
    recommendation TEXT CHECK (recommendation IN ('strong', 'moderate', 'weak', 'not_recommended')),
    analysis TEXT,                        -- Markdown格式的详细分析

    -- AI提供商信息
    provider TEXT,                        -- 使用的AI提供商 (openai/claude/gemini)
    model TEXT,                           -- 使用的模型

    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_analysis_sessions_job_id ON public.analysis_sessions(job_id);
CREATE INDEX idx_analysis_sessions_resume_id ON public.analysis_sessions(resume_id);
CREATE INDEX idx_analysis_sessions_user_id ON public.analysis_sessions(user_id);
CREATE INDEX idx_analysis_sessions_status ON public.analysis_sessions(status);
CREATE INDEX idx_analysis_sessions_score ON public.analysis_sessions(score DESC);

-- RLS
ALTER TABLE public.analysis_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analysis sessions"
    ON public.analysis_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create analysis sessions"
    ON public.analysis_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analysis sessions"
    ON public.analysis_sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analysis sessions"
    ON public.analysis_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- ANALYSIS_MESSAGES TABLE
-- 存储对话历史
-- =====================================================
CREATE TABLE public.analysis_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.analysis_sessions(id) ON DELETE CASCADE NOT NULL,

    -- 消息内容
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,                -- Markdown格式

    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_analysis_messages_session_id ON public.analysis_messages(session_id);
CREATE INDEX idx_analysis_messages_created_at ON public.analysis_messages(session_id, created_at);

-- RLS
ALTER TABLE public.analysis_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in own sessions"
    ON public.analysis_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.analysis_sessions s
            WHERE s.id = session_id AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in own sessions"
    ON public.analysis_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.analysis_sessions s
            WHERE s.id = session_id AND s.user_id = auth.uid()
        )
    );

-- =====================================================
-- TRIGGERS
-- 自动更新 updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_analysis_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_analysis_session_updated_at
    BEFORE UPDATE ON public.analysis_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_analysis_session_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.analysis_sessions IS 'AI分析会话，支持框架内自主分析和对话式交互';
COMMENT ON TABLE public.analysis_messages IS 'AI分析对话历史';
COMMENT ON COLUMN public.analysis_sessions.analysis IS 'Markdown格式的AI分析报告，AI有自主权决定分析内容';
COMMENT ON COLUMN public.analysis_sessions.score IS '0-100匹配度评分';
COMMENT ON COLUMN public.analysis_sessions.recommendation IS '推荐等级: strong/moderate/weak/not_recommended';
