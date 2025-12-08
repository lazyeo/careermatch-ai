# Task: CareerMatch AI Refactoring & Enhancement

## Phase 1: Architecture & Modularization (The "Micro-Kernel" Approach)
- [x] **Extract Core Logic to Packages** <!-- id: 0 -->
    - [x] Move `resume-parser` logic from web app to `packages/resume-parser`
    - [x] Move `job-parser` logic from web app to `packages/job-scraper`
    - [x] Move `cover-letter-generator` to `packages/ai-agent` (new package)
- [x] **Define Standard Interfaces** <!-- id: 1 -->
    - [x] Create strict TypeScript interfaces for all module inputs/outputs in `packages/shared`
    - [x] Ensure modules are "stateless" functions where possible

## Phase 2: Infrastructure Migration (Cloudflare & Edge)
- [/] **Setup Cloudflare Workers** <!-- id: 2 -->
    - [ ] Create `workers/parser-api` for resume/job parsing (heavy compute/network)
    - [x] Create `workers/scraper-api` for headless browser scraping (Playwright)
- [x] **Integrate with Next.js** <!-- id: 3 -->
    - [x] Refactor Next.js API routes to proxy requests to Cloudflare Workers
    - [ ] Configure R2 for file storage (optional, vs Supabase Storage)

## Phase 3: Agentic Core & Memory (The "Brain")
- [x] **Design Memory System** <!-- id: 4 -->
    - [x] Design `user_facts` table (Structured preferences)
    - [x] Design `interaction_logs` (Vector/Semantic search for context)
- [/] **Implement Agent "Skills" (MCP)** <!-- id: 5 -->
    - [ ] Wrap core packages as MCP-compatible tools
    - [x] Implement the "Proactive Agent" loop

## Phase 3.6: Interactive Job Management
- [ ] **Implement Interactive Tools** <!-- id: 5.5 -->
    - [ ] Implement `SaveJobTool` (Database write access)
    - [ ] Update `AgentService` to support interactive flows


## Phase 4: Hybrid UX & Data Integration
    - [x] **Part 1: Profile Sync**
        - [x] Implement `ResumeSyncService` in `ai-agent`
        - [x] Update `resume-upload` API to trigger sync
        - [x] Verify data population in Supabase
    - [x] **Part 2: Co-pilot UX Refactor** (See `IMPLEMENTATION_PLAN_FRONTEND_REFACTOR.md`)
        - [x] Create `DashboardLayout` (3-column grid)
        - [x] Implement `SidebarNavigation` (Left)
        - [x] Implement `CopilotPanel` (Right, persistent)
        - [x] Refactor `AssistantChat` for side panel
        - [x] Add Context Awareness (`useCopilotContext`)
- [ ] **Phase 5: Job-Centric Architecture Refactor** (See `IMPLEMENTATION_PLAN_JOB_CENTRIC_REFACTOR.md`)
    - [ ] **Part 1: Navigation & Layout**
        - [ ] Simplify `SidebarNavigation` (Remove Resumes/Applications)
        - [ ] Update i18n for new navigation structure
    - [ ] **Part 2: Unified Job Board**
        - [ ] Refactor `/jobs` page to Unified Kanban/List view
        - [ ] Merge "Applications" data into Jobs view
    - [ ] **Part 3: Job Workspace**
        - [ ] Create Job Workspace layout (`/jobs/[id]`)
        - [ ] Implement Resume/Cover Letter generation tabs
    - [ ] **Part 4: Profile Enhancement**
        - [ ] Enhance Profile page as single source of truth
- [ ] **Phase 6: Batch Job Import** (See `IMPLEMENTATION_PLAN_BATCH_IMPORT.md`)
    - [ ] Update API to support multiple URLs
    - [ ] Update `JobImportForm` for batch input
    - [ ] Add "View Original" link to Job Card
- [ ] **Phase 7: Chat-based Job Import** (See `IMPLEMENTATION_PLAN_CHAT_IMPORT.md`)
    - [x] Create `BatchJobImportTool`
    - [x] Register tool in `AgentService`
    - [x] Update System Prompt
- [ ] **Phase 8: Improve Scraper Quality** (See `IMPLEMENTATION_PLAN_IMPROVE_SCRAPER.md`)
    - [x] Implement `fetchWorkableData` in `job-scraper`
    - [x] Integrate specialized handlers in `fetchJobPageContent`
- [/] **Phase 9: Job Re-scrape Feature** (See `IMPLEMENTATION_PLAN_RESCRAPE.md`)
    - [x] Create API `POST /api/jobs/[id]/rescrape`
    - [x] Add "Refresh" button to Job Detail Page
    - [ ] Refactor global layout to 3-column structure
    - [ ] Implement `useAgentContext` for context awareness
- [/] **Phase 10: Job Detail Refinement** (See `IMPLEMENTATION_PLAN_JOB_DETAIL_REFINE.md`)
    - [x] Create `JobDetailTabs` component
    - [x] Create `JobSummary` component
    - [x] Update Analysis API for `job_summary` mode
    - [x] Update Job Detail Page layout and Source URL fix
