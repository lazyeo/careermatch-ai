# 🚀 CareerMatch AI Future Roadmap

Based on our discussion, here is the refined architectural plan for upcoming features.

## 1. 🏢 Centralized Company Insights (Web Platform)
**Strategy**: "Assess Once, View by All"
Instead of individual users querying company data repeatedly, we build a shared knowledge base.

*   **Implementation**:
    *   **Backend**: When a job is saved, check if the Company exists in our DB.
    *   **Worker**: If new or outdated, trigger a background job to scrape/analyze company data (Crunchbase, Glassdoor, News).
    *   **Frontend**: On the Job Detail page, show a "Company Profile" tab with this shared data.
*   **Value**:
    *   **Efficiency**: Saves API costs and processing time.
    *   **Network Effect**: As more users save jobs, the platform's value grows.

## 2. 🤖 Side Panel Assistant (Extension)
**Strategy**: "Context-Aware Chat & Sync"
Direct interaction with AI while browsing, with seamless data persistence.

*   **Implementation**:
    *   **UI**: Chrome Side Panel API.
    *   **Context**: Automatically reads the current job description.
    *   **Features**:
        *   "Am I a good fit?" (Resume matching)
        *   "Summarize key risks"
        *   "Draft cold email to recruiter"
*   **Data Sync (Your Question)**:
    *   **Decision**: **YES**, analysis should be saved.
    *   **Mechanism**:
        *   When you click "Save Job", we also bundle the **Chat History** or **Generated Analysis** (e.g., "Fit Score: 85/100").
        *   This data appears in the "AI Notes" section of the job on the Dashboard.
    *   **Why?**: You don't want to lose that "Aha!" moment or the cold email draft you generated while browsing.

    *   **Workflow: "Analyze = Smart Save"**:
        *   If you ask the AI to analyze a job *before* manually clicking save:
        *   **Action**: System automatically saves the job with status **"Analyzed"** (distinct from "Saved/Shortlisted").
        *   **Benefit**: Ensures your analysis is never lost, but keeps your main "To Apply" list uncluttered.
        *   **UI**: Dashboard can filter: "All Jobs" vs "Shortlisted".

## 3. 📄 Resume Tailoring (Web & Extension)
*   **Web**: "Generate Tailored Resume" button on the Job Detail page.
*   **Extension**: Quick preview of "Missing Keywords" in the Side Panel.

---

## 📅 Proposed Phase 2 Priorities

1.  **Side Panel Assistant** (High Impact, High Visibility)
2.  **Data Sync Pipeline** (Essential for the Assistant)
3.  **Company Insights Backend** (Long-term value)
