-- Fix: Allow resume_id to be NULL for profile-based analysis
-- Profile-based analysis doesn't have a resume, so resume_id should be nullable

ALTER TABLE public.analysis_sessions
    ALTER COLUMN resume_id DROP NOT NULL;

-- Add a comment to explain
COMMENT ON COLUMN public.analysis_sessions.resume_id IS 'Resume ID for resume-based analysis. NULL indicates profile-based analysis.';
