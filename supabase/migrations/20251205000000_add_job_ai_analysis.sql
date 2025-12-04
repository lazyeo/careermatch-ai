-- Add ai_analysis column to jobs table to store AI generated job summary
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS ai_analysis TEXT;

COMMENT ON COLUMN public.jobs.ai_analysis IS 'AI generated job summary and analysis';
