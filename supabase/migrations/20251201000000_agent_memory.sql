-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- =====================================================
-- 1. User Facts Table (Explicit Memory)
-- Stores structured facts about the user (preferences, skills, goals)
-- =====================================================
create table public.user_facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category text check (category in ('preference', 'skill', 'career_goal', 'constraint', 'other')),
  content text not null,
  confidence float4 default 1.0 check (confidence >= 0 and confidence <= 1.0),
  is_verified boolean default false,
  source text, -- e.g., 'chat_session_id', 'resume_analysis'
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes for user_facts
create index idx_user_facts_user_id on public.user_facts(user_id);
create index idx_user_facts_category on public.user_facts(user_id, category);

-- RLS for user_facts
alter table public.user_facts enable row level security;

create policy "Users can view own facts"
  on public.user_facts for select
  using (auth.uid() = user_id);

create policy "Users can insert own facts"
  on public.user_facts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own facts"
  on public.user_facts for update
  using (auth.uid() = user_id);

create policy "Users can delete own facts"
  on public.user_facts for delete
  using (auth.uid() = user_id);

-- =====================================================
-- 2. Memories Table (Episodic Memory)
-- Stores semantic embeddings of interactions for retrieval
-- =====================================================
create table public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  importance integer default 1 check (importance >= 1 and importance <= 10),
  metadata jsonb default '{}', -- Store related context (session_id, job_id, etc.)
  created_at timestamp with time zone default now()
);

-- Indexes for memories
create index idx_memories_user_id on public.memories(user_id);
create index idx_memories_created_at on public.memories(created_at desc);

-- HNSW index for vector similarity search
-- Note: This requires the vector extension to be enabled
create index idx_memories_embedding on public.memories 
using hnsw (embedding vector_cosine_ops);

-- RLS for memories
alter table public.memories enable row level security;

create policy "Users can view own memories"
  on public.memories for select
  using (auth.uid() = user_id);

create policy "Users can insert own memories"
  on public.memories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own memories"
  on public.memories for update
  using (auth.uid() = user_id);

create policy "Users can delete own memories"
  on public.memories for delete
  using (auth.uid() = user_id);

-- =====================================================
-- 3. Helper Functions
-- =====================================================

-- Function to search memories by similarity
create or replace function match_memories (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
returns table (
  id uuid,
  content text,
  similarity float,
  importance int,
  created_at timestamp with time zone
)
language plpgsql
as $$
begin
  return query
  select
    m.id,
    m.content,
    1 - (m.embedding <=> query_embedding) as similarity,
    m.importance,
    m.created_at
  from public.memories m
  where m.user_id = p_user_id
  and 1 - (m.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;
