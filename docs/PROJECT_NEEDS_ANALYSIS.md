# Comprehensive Project Needs Analysis

## 1. Executive Summary
CareerMatch AI aims to be the premier AI job assistant for the New Zealand market. While the MVP foundation is strong (98% Web App completion), a significant gap exists between the current "Tool" status and the "Platform" vision. The critical missing piece is **Data Acquisition** (Scraping/Extension) and **User Retention** (Agentic features).

## 2. Product Needs (The "What")

### 2.1. Data Acquisition (The Lifeblood)
*   **Need**: Reliable, high-volume job data from Seek, LinkedIn, and TradeMe.
*   **Gap**: Current Cloudflare Worker scraper is blocked by anti-bot measures on major sites.
*   **Solution**: **Browser Extension (Phase 1 Priority)**. This is non-negotiable for a viable product.

### 2.2. User Experience (The Hook)
*   **Need**: A reason for users to return daily.
*   **Gap**: Currently a static "Job Board" + "Resume Editor".
*   **Solution**: **Proactive Agent**. The Agent needs to:
    *   *Push* notifications: "New job found for you."
    *   *Auto-optimize*: "I tailored your resume for this job, click to apply."
    *   *Track*: "Did you hear back from X Company?"

### 2.3. Market Specifics (NZ Context)
*   **Need**: Compliance with NZ Privacy Act 2020.
*   **Gap**: Data retention policies and user consent flows need review.
*   **Need**: Integration with local platforms (Seek is dominant).
*   **Gap**: No direct integration or "Apply with CareerMatch" button.

## 3. Technical Needs (The "How")

### 3.1. Architecture & Infrastructure
*   **Database**:
    *   ✅ **Vector Support**: Confirmed (pgvector).
    *   ⚠️ **Scalability**: Need to monitor `memories` table growth.
*   **AI Services**:
    *   ✅ **Flexibility**: Confirmed support for OpenAI/Claude/Custom URLs.
    *   ⚠️ **Cost Control**: Need rate limiting and token usage tracking per user.

### 3.2. Testing & Quality
*   **E2E Testing**:
    *   ⚠️ **Critical**: Need stable E2E tests for the core "Import -> Analyze" flow (Mocking strategy approved).
*   **Scraper Monitoring**:
    *   ⚠️ **Missing**: Automated daily checks to verify if selectors (CSS classes) on Seek/LinkedIn have changed.

## 4. Operational Needs (The "Launch")

### 4.1. Analytics & Feedback
*   **Need**: Understand where users drop off.
*   **Gap**: No product analytics (PostHog/Mixpanel) installed.

### 4.2. Monetization (Future)
*   **Need**: Freemium model limits.
*   **Gap**: No subscription infrastructure (Stripe) or usage quotas implemented.

## 5. Strategic Roadmap Recommendation

Based on this analysis, the immediate priorities should be:

1.  **Fix Data Ingestion (The Extension)**: Without data, the AI has nothing to analyze.
2.  **Stabilize Core Flows (E2E Tests)**: Ensure the "Happy Path" never breaks.
3.  **Enhance Agent Memory**: Make the AI "smart" enough to retain users.

---
**Decision Point**:
Do we proceed with **Phase 1 (Extension)** as the primary data solution, or do we first solidify the **Testing Infrastructure** to ensure we don't regress?
