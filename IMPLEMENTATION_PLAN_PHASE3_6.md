# Phase 3.6 Implementation Plan: Interactive Job Management

## Goal
Enable the Agent to save jobs to the database after analysis and user confirmation. Improve the "Import" workflow to be more interactive.

## Proposed Changes

### 1. Update `Tool` Interface (`packages/ai-agent`)
Update `execute` method signature to accept context.
```typescript
export interface Tool {
  // ...
  execute: (args: any, context: { userId: string; [key: string]: any }) => Promise<any>
}
```

### 2. Implement `SaveJobTool` (`packages/ai-agent`)
Create `src/tools/SaveJobTool.ts`.
*   **Dependencies**: `SupabaseClient`.
*   **Parameters**: `ParsedJobData` (title, company, description, etc.).
*   **Logic**:
    *   Insert into `jobs` table.
    *   Return success message with `jobId`.

### 3. Update `AgentService` (`packages/ai-agent`)
*   **Constructor**: Accept `SupabaseClient` (in addition to `MemoryManager`).
*   **Tool Initialization**: Initialize `SaveJobTool` with the supabase client.
*   **Chat Loop**: Pass `userId` and other context to `tool.execute`.
*   **System Prompt**: Update instructions to:
    *   "If the user asks to analyze a job, scrape it first."
    *   "After analysis, ask the user if they want to save it."
    *   "If the user says yes, use the `save_job` tool."

### 4. Update Web App (`apps/web`)
*   Update `api/assistant/chat/route.ts` to pass `supabase` client to `AgentService` constructor.

## Verification Plan
1.  **Manual Test**:
    *   User: "Analyze [URL]"
    *   Agent: "Here is the analysis... Should I save it?"
    *   User: "Yes"
    *   Agent: "Saved!" (Check `jobs` table in Supabase Dashboard)
2.  **Direct Import**:
    *   User: "Import [URL]"
    *   Agent: (Scrapes) -> (Saves) -> "Job imported successfully."
