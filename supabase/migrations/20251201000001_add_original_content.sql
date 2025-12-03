-- Add original_content column to jobs table
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS original_content TEXT;
