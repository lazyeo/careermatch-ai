-- Materialize the latest background analysis state on jobs for automation and UI queries.
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS latest_analysis_session_id UUID REFERENCES public.analysis_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS latest_score INTEGER CHECK (latest_score IS NULL OR (latest_score >= 0 AND latest_score <= 100)),
  ADD COLUMN IF NOT EXISTS latest_recommendation TEXT,
  ADD COLUMN IF NOT EXISTS recommended_next_action TEXT CHECK (
    recommended_next_action IS NULL OR recommended_next_action IN (
      'generate_resume',
      'review',
      'review_later',
      'skip'
    )
  ),
  ADD COLUMN IF NOT EXISTS autoprocess_status TEXT CHECK (
    autoprocess_status IS NULL OR autoprocess_status IN (
      'queued',
      'processing',
      'analysis_completed',
      'artifacts_completed',
      'failed'
    )
  ),
  ADD COLUMN IF NOT EXISTS last_analyzed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_jobs_latest_score
  ON public.jobs(latest_score DESC)
  WHERE latest_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_recommended_next_action
  ON public.jobs(user_id, recommended_next_action)
  WHERE recommended_next_action IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_autoprocess_status
  ON public.jobs(user_id, autoprocess_status)
  WHERE autoprocess_status IS NOT NULL;
