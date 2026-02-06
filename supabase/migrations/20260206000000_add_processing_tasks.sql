-- Create processing_tasks table for async job processing
CREATE TABLE processing_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  resume_id uuid REFERENCES resumes(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  current_step text,
  steps_completed jsonb DEFAULT '[]',
  result jsonb,
  error text,
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

-- Indexes for performance
CREATE INDEX idx_processing_tasks_user ON processing_tasks(user_id);
CREATE INDEX idx_processing_tasks_status ON processing_tasks(status);
CREATE INDEX idx_processing_tasks_job ON processing_tasks(job_id);

-- Enable Row Level Security
ALTER TABLE processing_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own tasks" 
  ON processing_tasks 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks" 
  ON processing_tasks 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" 
  ON processing_tasks 
  FOR UPDATE 
  USING (auth.uid() = user_id);
