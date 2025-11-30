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

## Phase 4: UX & Conversation Management
- [ ] **Refactor Chat UI** <!-- id: 6 -->
    - [ ] Implement "Object-Centric" chat (Chat per Job / Chat per Resume)
    - [ ] Implement "Global Assistant" overlay
