# Phase 3 Implementation Plan: Agentic Core & Memory

## Goal
Transform the AI from a stateless chatbot into a stateful Agent that "remembers" user preferences and past interactions to provide proactive assistance.

## User Review Required
> [!IMPORTANT]
> This phase introduces **Vector Database** usage (pgvector). Ensure your Supabase instance has the `vector` extension enabled.

## Proposed Changes

### 1. Database Schema (Supabase)
Create a new migration `supabase/migrations/20251201000000_agent_memory.sql`:

#### [NEW] `user_facts` Table
Stores structured facts about the user (Explicit Memory).
- `category`: 'preference', 'skill', 'career_goal', 'constraint'
- `content`: "Wants remote work only", "Expert in React"
- `confidence`: 0.0 - 1.0
- `is_verified`: boolean (User confirmed)

#### [NEW] `memories` Table
Stores semantic embeddings of interactions (Episodic Memory).
- `content`: Text summary of the interaction.
- `embedding`: `vector(1536)` (OpenAI text-embedding-3-small).
- `importance`: 1-10 scale.

### 2. Backend Logic (`packages/ai-agent`)

#### [NEW] `MemoryManager` Class
- `addFact(userId, fact)`
- `getFacts(userId, query)`
- `addMemory(userId, content, embedding)`
- `searchMemories(userId, query)`

#### [NEW] `AgentService` Class
- `chat(userId, message, context)`:
    1.  **Retrieve**: Fetch relevant facts and memories.
    2.  **Plan**: Decide on actions (using MCP tools).
    3.  **Execute**: Call tools (e.g., `scrape_job`, `parse_resume`).
    4.  **Reflect**: Extract new facts from the interaction and save to memory.

### 3. Web App Integration
- Update `apps/web/src/app/api/assistant/chat/route.ts` to use `AgentService`.

## Verification Plan

### Automated Tests
1.  **Memory CRUD**: Test adding/retrieving facts and memories.
2.  **Vector Search**: Verify that similar queries retrieve relevant memories (mocking the embedding API).

### Manual Verification
1.  **Fact Extraction**:
    - User: "I only want remote jobs."
    - Check DB: `user_facts` should contain `{"content": "Prefers remote work", "category": "preference"}`.
2.  **Contextual Recall**:
    - User: "Find me a job."
    - Agent should ask: "Do you still want remote-only jobs?" (recalling the fact).
