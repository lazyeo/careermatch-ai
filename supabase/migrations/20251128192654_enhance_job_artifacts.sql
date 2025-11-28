-- Enhance Job Artifacts Migration
-- Add job associations to resumes and create cover letters table

-- =====================================================
-- ENHANCE RESUMES TABLE
-- Add job_id and analysis_session_id for job-specific resumes
-- =====================================================
ALTER TABLE public.resumes
ADD COLUMN job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
ADD COLUMN analysis_session_id UUID REFERENCES public.analysis_sessions(id) ON DELETE SET NULL,
ADD COLUMN source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'ai_generated', 'uploaded'));

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_resumes_job_id ON public.resumes(job_id);
CREATE INDEX IF NOT EXISTS idx_resumes_analysis_session_id ON public.resumes(analysis_session_id);
CREATE INDEX IF NOT EXISTS idx_resumes_source ON public.resumes(source);

-- Add comments
COMMENT ON COLUMN public.resumes.job_id IS 'Optional job association for job-specific resumes';
COMMENT ON COLUMN public.resumes.analysis_session_id IS 'Link to AI analysis session if generated from analysis';
COMMENT ON COLUMN public.resumes.source IS 'How the resume was created: manual/ai_generated/uploaded';

-- =====================================================
-- COVER LETTERS TABLE
-- Store cover letters for job applications
-- =====================================================
CREATE TABLE public.cover_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    analysis_session_id UUID REFERENCES public.analysis_sessions(id) ON DELETE SET NULL,

    -- Content
    title TEXT NOT NULL,
    content TEXT NOT NULL,  -- Markdown or plain text

    -- Metadata
    source TEXT DEFAULT 'ai_generated' CHECK (source IN ('manual', 'ai_generated')),
    provider TEXT,  -- AI provider used (openai/claude/gemini)
    model TEXT,     -- AI model used

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cover_letters_user_id ON public.cover_letters(user_id);
CREATE INDEX idx_cover_letters_job_id ON public.cover_letters(job_id);
CREATE INDEX idx_cover_letters_analysis_session_id ON public.cover_letters(analysis_session_id);

-- RLS Policies
ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cover letters"
    ON public.cover_letters FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create cover letters"
    ON public.cover_letters FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cover letters"
    ON public.cover_letters FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cover letters"
    ON public.cover_letters FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_cover_letter_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cover_letter_updated_at
    BEFORE UPDATE ON public.cover_letters
    FOR EACH ROW
    EXECUTE FUNCTION update_cover_letter_updated_at();

-- Comments
COMMENT ON TABLE public.cover_letters IS 'Cover letters for job applications';
COMMENT ON COLUMN public.cover_letters.analysis_session_id IS 'Link to AI analysis if generated from analysis';
COMMENT ON COLUMN public.cover_letters.content IS 'Cover letter content in Markdown or plain text';
COMMENT ON COLUMN public.cover_letters.source IS 'How the cover letter was created: manual/ai_generated';
