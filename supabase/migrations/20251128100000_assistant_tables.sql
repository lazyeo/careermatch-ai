-- CareerMatch AI - AI Assistant Tables Migration
-- AI助手会话和消息表
-- 支持对话持久化、上下文存储和历史记录

-- =====================================================
-- STEP 1: 创建 AI 助手会话表
-- =====================================================

CREATE TABLE public.assistant_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- 会话基本信息
    title TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),

    -- 上下文存储 (JSONB)
    initial_context JSONB DEFAULT '{}',
    current_context JSONB DEFAULT '{}',

    -- 关联资源（可选）
    related_job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    related_resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,

    -- 会话元数据
    message_count INTEGER DEFAULT 0,
    last_intent TEXT,

    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_assistant_sessions_user_id ON public.assistant_sessions(user_id);
CREATE INDEX idx_assistant_sessions_status ON public.assistant_sessions(user_id, status);
CREATE INDEX idx_assistant_sessions_created_at ON public.assistant_sessions(created_at DESC);
CREATE INDEX idx_assistant_sessions_last_message ON public.assistant_sessions(user_id, last_message_at DESC);

-- =====================================================
-- STEP 2: 创建 AI 助手消息表
-- =====================================================

CREATE TABLE public.assistant_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.assistant_sessions(id) ON DELETE CASCADE NOT NULL,

    -- 消息内容
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,

    -- 消息元数据 (JSONB)
    -- 包含: intent, actions, suggestions, processing_time, model 等
    metadata JSONB DEFAULT '{}',

    -- 关联资源（可选，用于消息级别的关联）
    related_job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    related_resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,

    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_assistant_messages_session_id ON public.assistant_messages(session_id);
CREATE INDEX idx_assistant_messages_session_created ON public.assistant_messages(session_id, created_at);
CREATE INDEX idx_assistant_messages_role ON public.assistant_messages(session_id, role);

-- =====================================================
-- STEP 3: Row Level Security (RLS) 策略
-- =====================================================

-- assistant_sessions RLS
ALTER TABLE public.assistant_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assistant sessions"
    ON public.assistant_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own assistant sessions"
    ON public.assistant_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assistant sessions"
    ON public.assistant_sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assistant sessions"
    ON public.assistant_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- assistant_messages RLS
ALTER TABLE public.assistant_messages ENABLE ROW LEVEL SECURITY;

-- 消息通过会话关联用户，需要子查询检查
CREATE POLICY "Users can view messages in own sessions"
    ON public.assistant_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.assistant_sessions s
            WHERE s.id = session_id AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in own sessions"
    ON public.assistant_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.assistant_sessions s
            WHERE s.id = session_id AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update messages in own sessions"
    ON public.assistant_messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.assistant_sessions s
            WHERE s.id = session_id AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete messages in own sessions"
    ON public.assistant_messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.assistant_sessions s
            WHERE s.id = session_id AND s.user_id = auth.uid()
        )
    );

-- =====================================================
-- STEP 4: Triggers
-- =====================================================

-- 更新会话的 updated_at
CREATE TRIGGER update_assistant_sessions_updated_at
    BEFORE UPDATE ON public.assistant_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 新消息时更新会话统计
CREATE OR REPLACE FUNCTION update_session_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.assistant_sessions
    SET
        message_count = message_count + 1,
        last_message_at = NEW.created_at,
        last_intent = COALESCE(NEW.metadata->>'intent', last_intent),
        updated_at = NOW()
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_assistant_message
    AFTER INSERT ON public.assistant_messages
    FOR EACH ROW EXECUTE FUNCTION update_session_on_new_message();

-- =====================================================
-- STEP 5: Helper Functions
-- =====================================================

-- 获取用户最近的会话列表
CREATE OR REPLACE FUNCTION public.get_recent_assistant_sessions(
    user_uuid UUID,
    limit_count INTEGER DEFAULT 10
)
RETURNS SETOF public.assistant_sessions AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.assistant_sessions
    WHERE user_id = user_uuid AND status = 'active'
    ORDER BY last_message_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取会话的消息历史
CREATE OR REPLACE FUNCTION public.get_session_messages(
    session_uuid UUID,
    limit_count INTEGER DEFAULT 50,
    before_time TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS SETOF public.assistant_messages AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.assistant_messages
    WHERE session_id = session_uuid
        AND (before_time IS NULL OR created_at < before_time)
    ORDER BY created_at ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 自动生成会话标题（基于第一条用户消息）
CREATE OR REPLACE FUNCTION generate_session_title()
RETURNS TRIGGER AS $$
DECLARE
    session_title TEXT;
BEGIN
    -- 只在第一条用户消息时生成标题
    IF NEW.role = 'user' THEN
        -- 检查会话是否已有标题
        SELECT title INTO session_title
        FROM public.assistant_sessions
        WHERE id = NEW.session_id;

        IF session_title IS NULL OR session_title = '' THEN
            -- 使用消息的前50个字符作为标题
            UPDATE public.assistant_sessions
            SET title = LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END
            WHERE id = NEW.session_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_session_title_trigger
    AFTER INSERT ON public.assistant_messages
    FOR EACH ROW EXECUTE FUNCTION generate_session_title();

-- 清理旧的归档会话（可选的维护功能）
CREATE OR REPLACE FUNCTION public.cleanup_old_sessions(
    days_threshold INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM public.assistant_sessions
        WHERE status = 'archived'
            AND updated_at < NOW() - (days_threshold || ' days')::INTERVAL
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 6: 创建会话上下文视图（方便查询）
-- =====================================================

CREATE OR REPLACE VIEW public.assistant_sessions_with_context AS
SELECT
    s.id,
    s.user_id,
    s.title,
    s.status,
    s.message_count,
    s.last_intent,
    s.created_at,
    s.updated_at,
    s.last_message_at,
    -- 展开关联的岗位信息
    j.title AS job_title,
    j.company AS job_company,
    -- 展开关联的简历信息
    r.title AS resume_title,
    -- 最近的消息预览
    (
        SELECT content
        FROM public.assistant_messages m
        WHERE m.session_id = s.id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) AS last_message_preview
FROM public.assistant_sessions s
LEFT JOIN public.jobs j ON s.related_job_id = j.id
LEFT JOIN public.resumes r ON s.related_resume_id = r.id;
