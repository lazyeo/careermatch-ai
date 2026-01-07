-- Fix security warning: "View defined with SECURITY DEFINER property"
-- Enable security_invoker to ensure RLS policies are respected
CREATE OR REPLACE VIEW public.assistant_sessions_with_context
WITH (security_invoker = true)
AS
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
