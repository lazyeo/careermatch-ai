-- CareerMatch AI Database Schema
-- Initial migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- Extends Supabase auth.users with additional profile data
-- =====================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies: Users can only read/update their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- =====================================================
-- USER PREFERENCES TABLE
-- Job search preferences and settings
-- =====================================================
CREATE TABLE public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    target_roles TEXT[] DEFAULT '{}',
    desired_locations TEXT[] DEFAULT '{}',
    job_types TEXT[] DEFAULT '{}',
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency TEXT DEFAULT 'NZD',
    remote_preference TEXT CHECK (remote_preference IN ('remote', 'hybrid', 'onsite', 'flexible')),
    willing_to_relocate BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
    ON public.user_preferences FOR ALL
    USING (auth.uid() = user_id);

-- =====================================================
-- RESUMES TABLE
-- Stores resume versions and content
-- =====================================================
CREATE TABLE public.resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content JSONB NOT NULL,
    template_id TEXT,
    version INTEGER DEFAULT 1,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX idx_resumes_is_primary ON public.resumes(user_id, is_primary);

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own resumes"
    ON public.resumes FOR ALL
    USING (auth.uid() = user_id);

-- =====================================================
-- JOBS TABLE
-- Job postings saved by users
-- =====================================================
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    job_type TEXT CHECK (job_type IN ('full-time', 'part-time', 'contract', 'internship', 'casual')),
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency TEXT DEFAULT 'NZD',
    description TEXT,
    requirements TEXT,
    benefits TEXT,
    source_url TEXT,
    posted_date TIMESTAMP WITH TIME ZONE,
    deadline TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'saved' CHECK (status IN ('saved', 'applied', 'interview', 'rejected', 'offer', 'withdrawn')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX idx_jobs_status ON public.jobs(user_id, status);
CREATE INDEX idx_jobs_created_at ON public.jobs(created_at DESC);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own jobs"
    ON public.jobs FOR ALL
    USING (auth.uid() = user_id);

-- =====================================================
-- JOB ANALYSES TABLE
-- AI-powered job match analysis results (cached)
-- =====================================================
CREATE TABLE public.job_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE NOT NULL,
    match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
    dimensions JSONB, -- Array of {name, score, description}
    strengths TEXT[],
    gaps TEXT[],
    swot JSONB, -- {strengths, weaknesses, opportunities, threats}
    keywords JSONB, -- Array of {keyword, inResume, importance, context}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, resume_id)
);

CREATE INDEX idx_job_analyses_job_id ON public.job_analyses(job_id);
CREATE INDEX idx_job_analyses_resume_id ON public.job_analyses(resume_id);
CREATE INDEX idx_job_analyses_match_score ON public.job_analyses(match_score DESC);

ALTER TABLE public.job_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analyses for own jobs and resumes"
    ON public.job_analyses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.jobs j
            WHERE j.id = job_id AND j.user_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM public.resumes r
            WHERE r.id = resume_id AND r.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create analyses for own jobs and resumes"
    ON public.job_analyses FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.jobs j
            WHERE j.id = job_id AND j.user_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM public.resumes r
            WHERE r.id = resume_id AND r.user_id = auth.uid()
        )
    );

-- =====================================================
-- APPLICATIONS TABLE
-- Track job applications and their progress
-- =====================================================
CREATE TABLE public.applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'draft' CHECK (
        status IN ('draft', 'submitted', 'under_review', 'interview_scheduled',
                   'offer_received', 'rejected', 'withdrawn', 'accepted')
    ),
    timeline JSONB DEFAULT '[]', -- Array of timeline events
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

CREATE INDEX idx_applications_user_id ON public.applications(user_id);
CREATE INDEX idx_applications_status ON public.applications(user_id, status);
CREATE INDEX idx_applications_updated_at ON public.applications(updated_at DESC);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own applications"
    ON public.applications FOR ALL
    USING (auth.uid() = user_id);

-- =====================================================
-- INTERVIEWS TABLE
-- Track interview schedules and details
-- =====================================================
CREATE TABLE public.interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('phone_screen', 'video', 'in_person', 'technical', 'behavioral', 'panel', 'final')),
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER, -- in minutes
    location TEXT,
    interviewers TEXT[],
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
    notes TEXT,
    preparation_materials TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_interviews_application_id ON public.interviews(application_id);
CREATE INDEX idx_interviews_scheduled_date ON public.interviews(scheduled_date);

ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage interviews for own applications"
    ON public.interviews FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.applications a
            WHERE a.id = application_id AND a.user_id = auth.uid()
        )
    );

-- =====================================================
-- TRIGGERS
-- Automatically update updated_at timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON public.resumes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON public.interviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS
-- Helper functions for common operations
-- =====================================================

-- Function to create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get user's application statistics
CREATE OR REPLACE FUNCTION public.get_application_stats(user_uuid UUID)
RETURNS TABLE (
    total_applications BIGINT,
    submitted_count BIGINT,
    interview_count BIGINT,
    offer_count BIGINT,
    rejected_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_applications,
        COUNT(*) FILTER (WHERE status IN ('submitted', 'under_review'))::BIGINT as submitted_count,
        COUNT(*) FILTER (WHERE status IN ('interview_scheduled'))::BIGINT as interview_count,
        COUNT(*) FILTER (WHERE status IN ('offer_received', 'accepted'))::BIGINT as offer_count,
        COUNT(*) FILTER (WHERE status = 'rejected')::BIGINT as rejected_count
    FROM public.applications
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
