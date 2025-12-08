# Phase 3.5 Implementation Plan: Agent Skills (MCP)

## Goal
Empower the Agent to *do* things, not just *say* things. We will wrap our existing packages (`resume-parser`, `job-scraper`) as tools that the `AgentService` can invoke.

## Proposed Changes

### 1. Define Tool Interface (`packages/ai-agent`)
Create a standard interface for tools in `packages/ai-agent/src/core/Tool.ts`:
```typescript
export interface Tool {
  name: string
  description: string
  parameters: Record<string, any> // JSON Schema
  execute: (args: any) => Promise<any>
}
```

### 2. Implement Tools
Create tool wrappers in their respective packages or within `ai-agent` importing them.
*   **`ResumeAnalysisTool`**: Wraps `@careermatch/resume-parser`.
    *   Input: `resumeId` (or content)
    *   Output: Structured analysis
*   **`JobScraperTool`**: Wraps `@careermatch/job-scraper`.
    *   Input: `url`
    *   Output: Job details

### 3. Update `AgentService`
*   Add a `tools` registry to `AgentService`.
*   Update `chat` method to:
    1.  Pass tool definitions to OpenAI/Claude (`tools` parameter).
    2.  Handle `tool_calls` in the response.
    3.  Execute the corresponding tool.
    4.  Feed the tool output back to the LLM for the final response.

## Verification Plan
1.  **Unit Test**: Mock tool execution and verify `AgentService` calls it.
2.  **Manual Test**:
    *   User: "Analyze this job: [URL]"
    *   Agent: (Calls Scraper) -> (Calls Resume Parser) -> "This job matches your profile because..."
