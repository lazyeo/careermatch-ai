# Task: CareerMatch AI Refactoring & Enhancement

## Phase 1: Architecture & Modularization (The "Micro-Kernel" Approach)
- [ ] **Extract Core Logic to Packages** <!-- id: 0 -->
    - [ ] Move `resume-parser` logic from web app to `packages/resume-parser`
    - [ ] Move `job-parser` logic from web app to `packages/job-scraper`
    - [ ] Move `cover-letter-generator` to `packages/ai-agent` (new package)
- [ ] **Define Standard Interfaces** <!-- id: 1 -->
    - [ ] Create strict TypeScript interfaces for all module inputs/outputs in `packages/shared`
    - [ ] Ensure modules are "stateless" functions where possible

## Phase 2: Infrastructure Migration (Cloudflare & Edge)
- [ ] **Setup Cloudflare Workers** <!-- id: 2 -->
    - [ ] Create `workers/parser-api` for resume/job parsing (heavy compute/network)
    - [ ] Create `workers/scraper-api` for headless browser scraping (Playwright)
- [ ] **Integrate with Next.js** <!-- id: 3 -->
    - [ ] Refactor Next.js API routes to proxy requests to Cloudflare Workers
    - [ ] Configure R2 for file storage (optional, vs Supabase Storage)

## Phase 3: Agentic Core & Memory (The "Brain")
- [ ] **Design Memory System** <!-- id: 4 -->
    - [ ] Design `user_facts` table (Structured preferences)
    - [ ] Design `interaction_logs` (Vector/Semantic search for context)
- [ ] **Implement Agent "Skills" (MCP)** <!-- id: 5 -->
    - [ ] Wrap core packages as MCP-compatible tools
    - [ ] Implement the "Proactive Agent" loop

## Phase 4: UX & Conversation Management
- [ ] **Refactor Chat UI** <!-- id: 6 -->
    - [ ] Implement "Object-Centric" chat (Chat per Job / Chat per Resume)
    - [ ] Implement "Global Assistant" overlay
