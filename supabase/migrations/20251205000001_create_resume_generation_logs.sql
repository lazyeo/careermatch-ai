-- Create resume_generation_logs table
CREATE TABLE IF NOT EXISTS public.resume_generation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
    job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt TEXT NOT NULL,
    context_snapshot JSONB, -- Stores the profile and job data used at generation time
    generated_content TEXT, -- The raw output from AI
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_resume_logs_user_id ON public.resume_generation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_logs_job_id ON public.resume_generation_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_resume_logs_created_at ON public.resume_generation_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.resume_generation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own generation logs"
    ON public.resume_generation_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generation logs"
    ON public.resume_generation_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);
