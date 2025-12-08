# Implementation Plan: Content Extraction & Quality Improvements

## Goal
Improve the quality of job data captured by the extension and processed by the AI. Specifically address content extraction precision, AI summary formatting, original content cleaning, and missing metadata.

## User Review Required
- **Content Cleaning Strategy**: We will use a "Dual Output" strategy where the AI returns both a structured summary AND a cleaned, Markdown-formatted version of the original content. This increases token usage but provides the best reading experience.

## Proposed Changes

### 1. Extension: Smart Content Extraction (`apps/extension`)
**Problem**: Extension often falls back to full page HTML, which is noisy and token-heavy. On search pages, it might capture wrong job titles.
**Solution**: Implement "Context-Aware Extraction" in `SaveJobButton.tsx`.
- **Logic**:
    1. **Scoping**: Start from the `SaveJobButton`'s injection point (or the "Apply" button it found).
    2. **Traversal**: Traverse up to find the nearest "Job Detail" container (e.g., `article`, `[data-automation="job-detail"]`, or a container with high text density).
    3. **Isolation**: Extract ONLY the HTML within this container. This ensures we don't capture other jobs on a search page.
    4. **URL Discovery**:
        - Instead of relying solely on `window.location.href` (which might be a search page), look for a **Canonical Link** or **Job Title Link** *within the scoped container*.
        - Check for `link[rel="canonical"]` (if on detail page) or `a[href]` on the `h1` job title.
- **Files**:
    - `apps/extension/src/components/SaveJobButton.tsx`: Update `getJobContent` and add `getJobUrl`.

### 2. API: Fix Missing Job URL (`apps/web`)
**Problem**: Jobs saved via extension are missing the source URL.
**Solution**: Ensure the `url` passed from the extension is correctly mapped to `source_url` and `application_url` in the database.
- **Files**:
    - `apps/web/src/app/api/jobs/import/route.ts`: Explicitly map `url` from request body to `parsedData.application_url` if missing.

### 3. Job Scraper: AI Formatting & Cleaning (`packages/job-scraper`)
**Problem**: AI summary is a wall of text; Original content is raw HTML.
**Solution**: Update the System Prompt to enforce strict formatting and request a "Cleaned Original" version.
- **Prompt Updates**:
    - **Summary**: Request Markdown with headers, bullet points, and short paragraphs.
    - **Cleaned Content**: Request a new field `formatted_original_content` which preserves the original structure/info but removes ads, navs, and converts to clean Markdown.
- **Files**:
    - `packages/job-scraper/src/index.ts`: Update `PARSE_JOB_PROMPT` and `ParsedJobData` interface.

## Verification Plan
### Automated Tests
- None (Visual/AI output verification required).

### Manual Verification
1. **Extraction**: Visit Seek/LinkedIn/Generic job page. Verify extension captures the *main content column* only, not the full `<body>`.
2. **URL**: Save a job. Check Supabase/Dashboard to see if "Apply" button links to the correct URL.
3. **Formatting**: Check the "Job Details" page in the web app. Verify the summary is readable (bullet points) and the "Original" tab (if we implement it) shows clean Markdown.
