# 项目现状 vs 文档规划：深度对比分析报告

本报告对比了基于代码库的**实际分析结果** (`PROJECT_ANALYSIS.md`) 与项目目录中的**现有文档**（`README.md`, `PROGRESS.md`, `CHANGELOG.md` 等）。

## 1. 核心差异总结 (Executive Summary)

| 维度 | 文档描述 (Documentation) | 实际代码现状 (Codebase Reality) | 差异评估 |
| :--- | :--- | :--- | :--- |
| **整体进度** | **98% 完成** (Phase 1-6 + Sprint 7-8) | **Web端 MVP 完成**，但架构迁移未开始 | 文档主要追踪 Web App 进度，忽略了架构重构的滞后。 |
| **架构模式** | **理想化 Monorepo**：核心功能拆分为独立 Packages (`resume-parser`, `job-scraper`) | **实际 Monolith**：核心逻辑全部堆砌在 `apps/web/src/lib` 中 | 存在严重的架构债，文档中的 Packages 目前仅为空壳。 |
| **抓取技术** | 提及 "Playwright-based scraping" (Planned) | 使用简单的 `fetch` + 正则/AI 清洗 | 抓取能力远弱于规划，无法应对复杂反爬场景。 |
| **开源组件** | 声称 `ui`, `resume-parser` 等为 "Open Source Components" | 仅 `ui` 和 `shared` 有内容，其他均为占位符 | 文档超前于实现，"开源组件"目前名不副实。 |

## 2. 详细对比分析

### 2.1 架构与代码组织

*   **文档说法**: `README.md` 的 "Project Structure" 章节清晰地列出了 `packages/resume-parser` (Smart Resume Parser) 和 `packages/job-scraper` (Job Scraper Framework) 作为独立组件。
*   **实际发现**:
    *   `packages/resume-parser`: **空目录**。
    *   `packages/job-scraper`: **空目录**。
    *   **真实逻辑位置**:
        *   简历解析: `apps/web/src/lib/resume-parser.ts`
        *   职位解析: `apps/web/src/lib/job-parser.ts`
        *   求职信生成: `apps/web/src/lib/cover-letter-generator.ts`
*   **结论**: 项目目前处于 "Monolith inside Monorepo" 状态。虽然使用了 TurboRepo，但未能利用其模块化优势。文档描述的是**目标架构**，而非**当前架构**。

### 2.2 功能实现深度

*   **文档说法**: `PROGRESS.md` 声称 "Phase 1-6 完成"，包括 "AI岗位智能导入" 和 "AI求职信生成"。
*   **实际发现**: 功能确实已在 Web 端实现并可用（代码存在且逻辑完整）。
    *   **优点**: `CHANGELOG.md` 忠实记录了这些功能在 `apps/web` 中的实现细节（如 Sprint 6 Part 3 流式分析）。
    *   **隐患**: `job-parser.ts` 仅使用了基础的 `fetch` 请求来获取网页内容。对于 LinkedIn、Seek 等高度依赖动态渲染和反爬的网站，这种实现方式在生产环境中极易失效。文档中规划的 "Playwright-based" 方案尚未落地。

### 2.3 浏览器插件 (Browser Extension)

*   **文档说法**:
    *   `README.md`: "Coming Soon (Phase 2+)"。
    *   `PROGRESS.md`: 列为 "长期规划 Option B"。
*   **实际发现**: `apps/extension` 目录存在但为空。
*   **结论**: 一致。文档和代码都表明这部分尚未开始。但考虑到这是求职工具的核心场景，目前的 Web-only 形态限制了产品的竞争力。

### 2.4 AI 服务集成

*   **文档说法**: 支持 OpenAI, Claude, Gemini (via relay)。
*   **实际发现**: 代码 (`ai-providers.ts`) 确实实现了多 Provider 的抽象层，支持流式输出 (SSE)。
*   **一致性**: 高。这部分代码实现与文档描述（Sprint 6 Part 3）高度一致，是项目中完成度较高的部分。

## 3. 风险与建议

基于上述对比，项目目前最大的风险在于**文档描绘的成熟度与实际代码的耦合度之间的错位**。

1.  **架构欺骗性**: 新加入的开发者可能会被 `README` 误导，认为有独立的解析包可用，实际上必须从 Web App 中剥离代码。
2.  **维护成本**: 随着功能增加，`apps/web/src/lib` 正在变得臃肿。如果现在不进行拆分，未来开发浏览器插件时将面临大量的代码重复或痛苦的重构。
3.  **技术债**: 抓取功能的简陋实现是 MVP 阶段的妥协，但文档中将其描述为 "Open Source Scraper Template" (Planned) 可能会误导对该模块能力的预期。

## 4. 修正后的行动计划 (Revised Action Plan)

结合文档中的规划（Sprint 6+）和实际代码分析，建议调整后续计划：

1.  **立即执行 (Immediate)**:
    *   **架构对齐**: 按照 `README` 的设计，将 `apps/web/src/lib/resume-parser.ts` 等逻辑**物理迁移**到 `packages/resume-parser` 中。让代码库的实际结构符合文档描述。
2.  **短期 (Short-term)**:
    *   **实现承诺的抓取器**: 在 `packages/job-scraper` 中真正引入 Playwright/Puppeteer，替换 Web App 中脆弱的 `fetch` 实现。
3.  **中期 (Mid-term)**:
    *   **启动插件开发**: 利用拆分出的 Shared Packages，快速启动 `apps/extension`，实现文档中规划的 "One-click job capture"。

---
**总结**: 项目文档记录详实，开发流程规范（Todo-driven），Web 端功能完成度高。主要差距在于**模块化架构的落地滞后于文档规划**。
