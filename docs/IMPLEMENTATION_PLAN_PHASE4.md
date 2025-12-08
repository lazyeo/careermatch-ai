# Phase 4 Implementation Plan: UX & Data Integration

## Goal
Create a hybrid experience that combines **Conversational Intelligence** (Agent) with **Structured Data Management** (Web App). The Agent acts as a "Co-pilot" that helps populate and manage the structured data (Jobs, Resumes, Profile).

## Part 1: Data Integration (Profile Sync)
**Objective**: Ensure data flows seamlessly from "Unstructured Inputs" (Resume Files) to "Structured Records" (User Profile, Facts).

### 1. `ResumeSyncService` (`packages/ai-agent`)
*   **Input**: `ParsedResumeData`
*   **Actions**:
    *   **Upsert Profile**: Populate `user_profiles` (Name, Email, Summary).
    *   **Sync Collections**: Replace/Update `work_experiences`, `education`, `skills`, `projects`.
    *   **Extract Facts**: Convert key attributes (Skills, Job Titles) into `user_facts` for the Agent's memory.
*   **Trigger**: Called automatically after successful `resume-upload` parsing.

## Part 2: The "Co-pilot" UX
**Objective**: Make the Chat persistent and context-aware, co-existing with the structured views.

### 1. Global Layout Refactor (`apps/web`)
*   **New Layout Structure**:
    *   **Left**: Navigation Sidebar (Dashboard, Jobs, Resumes).
    *   **Center**: Main Workspace (The "Structured" View).
    *   **Right**: Persistent Agent Panel (The "Conversation" View).
*   **Responsive**: On mobile, the Agent Panel becomes a drawer/overlay.

### 2. Context-Aware Chat
*   **Global State**: `useAgentContext` hook.
*   **Context Switching**:
    *   When user views a Job Detail page -> Chat Context updates to `jobId: xyz`.
    *   When user edits a Resume -> Chat Context updates to `resumeId: abc`.
*   **UI Actions**:
    *   **"Ask Agent" Button**: On every Job Card / Resume Section. Clicking it opens the Right Panel with a pre-filled prompt (e.g., "How can I improve this description?").

### 3. Interactive Components (Agent UI)
*   **Action Cards**: Instead of just text, the Agent returns UI components in the chat stream:
    *   `JobPreviewCard`: "I found this job. [Save] [Discard]"
    *   `ProfileUpdateCard`: "I extracted these skills. [Confirm & Save]"

## Implementation Steps
1.  **Backend**: Implement `ResumeSyncService` and integrate into `upload` route.
2.  **Frontend**: Create `AgentSidebar` component.
3.  **Frontend**: Refactor `layout.tsx` to include the persistent sidebar.
4.  **Frontend**: Connect `AgentService` to the new Sidebar UI.
