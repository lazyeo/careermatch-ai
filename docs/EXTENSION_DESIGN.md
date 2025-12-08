# Browser Extension Design & Implementation Plan

## 1. Product Vision
The CareerMatch AI Extension acts as a "Smart Bridge" between job boards (Seek, LinkedIn) and the CareerMatch platform. It solves the "Data Acquisition" problem by leveraging the user's own browser session to capture job details without triggering anti-bot defenses.

## 2. Core Features (MVP)

### 2.1. Smart Injection (Context-Aware UI)
*   **Strategy**: The extension will **not** show a global floating ball. It will only activate on specific domains (Seek, LinkedIn) and specific pages (Job Details).
*   **UI Placement**:
    *   **Primary**: Attempt to inject a "Save to CareerMatch" button directly into the page DOM (e.g., next to the "Apply" button or Job Title).
    *   **Fallback**: If DOM injection fails (due to site updates), display a subtle, contextual floating action button (FAB) in the bottom-right corner, *only* when a job is detected.
*   **Visuals**: The button will use the native site's aesthetic where possible, or a clean CareerMatch branded pill button.
*   **Stealth Mode**: Uses the user's existing cookies/session. No headless browser involved.

### 2.2. Side Panel Assistant
*   **Instant Analysis**: Instead of just saving, the Side Panel opens to show:
    *   **Match Score**: "85% Match with your Senior Dev Resume".
    *   **Key Gaps**: "Missing skill: Docker".
    *   **Quick Actions**: "Generate Cover Letter", "Save to Dashboard".

### 2.3. Authentication Bridge
*   **Shared Session**: If the user is logged into `careermatch.ai` in another tab, the extension automatically inherits the session (via Supabase Cookies or LocalStorage sync). No separate login required.

## 3. Technical Architecture

### 3.1. Tech Stack
*   **Framework**: **Plasmo** (The "Next.js for Extensions"). It provides first-class React support, HMR, and easy cross-browser build targets.
*   **UI Library**: Reuse `packages/ui` (Tailwind + Radix UI).
*   **State Management**: React Context / Zustand (synced with Chrome Storage).

### 3.2. Data Flow
1.  **Content Script**: Injected into `seek.co.nz`. Reads DOM.
2.  **Background Service Worker**: Handles API calls to `api.careermatch.ai`.
3.  **Side Panel**: Displays React UI.

### 3.3. Monorepo Integration
*   **Location**: `apps/extension`
*   **Dependencies**:
    *   `@careermatch/ui`: For consistent look & feel.
    *   `@careermatch/job-scraper`: For parsing logic (we reuse the *parsing* logic, but run it inside the extension).
    *   `@careermatch/shared`: For types.

## 4. Implementation Steps

### Phase 1: Scaffold & Auth (Day 1)
1.  Initialize Plasmo project in `apps/extension`.
2.  Configure Tailwind CSS to match Web App.
3.  Implement "Auth Bridge" to read Supabase session from `careermatch.ai` cookies.

### Phase 2: Content Injection (Day 2)
1.  Create Content Scripts for:
    *   `seek.co.nz/job/*`
    *   `linkedin.com/jobs/view/*`
2.  Implement DOM extraction (getting the raw HTML).

### Phase 3: Side Panel & API (Day 3)
1.  Build the Side Panel UI.
2.  Connect "Analyze" button to `POST /api/jobs/analyze` (or reuse existing route).
3.  Display results.

## 5. Security & Privacy
*   **Permissions**: Minimal permissions (`activeTab`, `storage`, `cookies`).
*   **Data**: Only extract data when user explicitly clicks "Analyze" or "Save".

---
**Question for User**:
Do you prefer a **Floating Action Button (FAB)** on the job page (like Grammarly), or just using the **Browser Toolbar Icon** to open the panel?
