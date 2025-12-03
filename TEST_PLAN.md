# E2E Test Plan & Strategy

## 1. Overview

This document outlines the End-to-End (E2E) testing strategy for CareerMatch AI. The goal is to verify critical user flows from a user's perspective, ensuring that the Web App, Scraper, and AI Agent work seamlessly together.

## 2. Test Scope

We will focus on the "Happy Path" for the core value proposition: **Job Discovery -> Analysis -> Application**.

### Critical Flows
1.  **User Onboarding**: Sign up, Profile Creation, Resume Upload.
2.  **Job Discovery**: Import Job via URL, View Job Details.
3.  **AI Analysis**: Job Matching Score, Resume Optimization Suggestions.
4.  **Application Tracking**: Move job to "Applied", Generate Cover Letter.

## 3. Test Scenarios

### Scenario A: The "New User" Flow
*   **Actor**: New User (No account)
*   **Steps**:
    1.  Navigate to Landing Page.
    2.  Click "Get Started" -> Sign Up (Mock Auth).
    3.  Complete Onboarding (Name, Role).
    4.  **Verify**: Dashboard is accessible and empty.

### Scenario B: The "Job Hunter" Flow (Core)
*   **Actor**: Authenticated User with Resume
*   **Pre-condition**: User has uploaded `resume_software_engineer.pdf`.
*   **Steps**:
    1.  User clicks "Add Job" -> "Import from URL".
    2.  Input URL: `https://www.seek.co.nz/job/123456` (Mocked/Real).
    3.  **Verify**: Job details (Title, Company, Description) are correctly parsed.
    4.  **Verify**: "Match Score" is calculated (e.g., > 70%).
    5.  User clicks "Generate Cover Letter".
    6.  **Verify**: Cover letter content is generated and relevant to the job.

### Scenario C: The "Extension" Flow (Future)
*   **Actor**: User on external site (LinkedIn)
*   **Steps**:
    1.  Click Extension Icon.
    2.  **Verify**: Extension detects job details on page.
    3.  Click "Save to CareerMatch".
    4.  **Verify**: Job appears in Web App Dashboard.

## 4. Test Data Strategy

To ensure reliable testing, we will use a mix of **Static Fixtures** and **Live/Mocked URLs**.

### 4.1. Static Fixtures (Stored in `apps/web/e2e/fixtures`)
*   **Resumes**:
    *   `resume_senior_dev.pdf`: A strong senior developer resume.
    *   `resume_junior_dev.pdf`: A junior developer resume.
    *   `resume_designer.pdf`: A designer resume (for negative matching tests).
*   **Job Descriptions (Raw Text)**:
    *   `job_frontend_dev.txt`: Standard React job.
    *   `job_product_manager.txt`: Non-tech job.

### 4.2. Mocked URLs (for Scraper Tests)
Instead of hitting real Seek/LinkedIn URLs (which flake/block), we will host static HTML pages locally or use a Mock Service Worker (MSW).
*   `http://localhost:3000/test/jobs/seek-sample.html`
*   `http://localhost:3000/test/jobs/linkedin-sample.html`

## 5. Automation Tools

*   **Framework**: Playwright (Industry standard for E2E).
*   **Runner**: `pnpm test:e2e`
*   **CI Integration**: GitHub Actions (Run on PR).

## 6. Implementation Plan

1.  **Setup**: Install Playwright in `apps/web`.
2.  **Fixtures**: Create `apps/web/e2e/fixtures` and add sample resumes/jobs.
3.  **Mock Pages**: Create a simple route in Next.js (`app/test/mock-jobs`) to serve static job HTMLs for testing.
4.  **Write Tests**: Implement `onboarding.spec.ts` and `job-flow.spec.ts`.
