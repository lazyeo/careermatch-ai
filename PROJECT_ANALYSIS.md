# CareerMatch AI 项目深度分析报告

## 1. 项目概览 (Project Overview)

**CareerMatch AI** 旨在打造一款针对新西兰市场的 AI 驱动求职助手。该产品通过 AI 技术自动化处理求职过程中的繁琐环节，帮助求职者提高效率和成功率。

*   **核心目标**: 连接求职者与职位，通过 AI 优化简历、生成求职信，并提供智能匹配建议。
*   **技术栈**:
    *   **前端/应用**: Next.js (App Router), TypeScript, Tailwind CSS
    *   **后端/服务**: Supabase (PostgreSQL, Auth), Cloudflare Workers (推测)
    *   **AI 核心**: Claude (Sonnet 3.5/4.5) via OpenAI-compatible Relay
    *   **架构**: Monorepo (TurboRepo + pnpm)

## 2. 当前开发状态 (Current Status)

目前项目处于 **MVP (最小可行性产品) 的早期原型阶段**。虽然代码库采用了 Monorepo 结构，但实际实现高度集中在 Web 应用中，尚未实现模块化。

### 2.1 模块完成度概览

| 模块/目录 | 预期功能 | 当前状态 | 备注 |
| :--- | :--- | :--- | :--- |
| `apps/web` | 主 Web 应用 | 🚧 开发中 | 包含核心业务逻辑、UI 和 API 路由 |
| `apps/extension` | 浏览器插件 | ❌ 空置 | 尚未开始开发，关键缺失组件 |
| `packages/job-scraper` | 职位抓取引擎 | ❌ 空置 | 逻辑目前硬编码在 Web App 中 |
| `packages/resume-parser` | 简历解析引擎 | ❌ 空置 | 逻辑目前硬编码在 Web App 中 |
| `packages/ats-optimizer` | ATS 优化引擎 | ❌ 空置 | 尚未实现 |
| `packages/database` | 数据库 Schema | ❌ 空置 | 类型定义可能散落在 Web App 中 |
| `packages/shared` | 共享工具库 | ✅ 部分完成 | 包含基础类型定义 |

### 2.2 架构现状："Monolith in Monorepo"
虽然项目使用了 TurboRepo 进行包管理，但实际上所有的核心业务逻辑（简历解析、职位解析、求职信生成）都直接实现在了 `apps/web/src/lib` 目录下，而非预期的独立 `packages` 中。这是一种典型的架构债，虽然初期开发速度快，但不利于代码复用（特别是对于浏览器插件的开发）。

## 3. 核心业务逻辑与流程 (Business Logic)

当前已实现的三大核心业务流程如下：

### 3.1 简历解析 (Resume Parsing)
*   **输入**: PDF / Word / 文本文件。
*   **流程**:
    1.  提取文件文本 (使用 `pdf-parse` 或 `mammoth`)。
    2.  调用 AI (Claude) 进行结构化提取。
    3.  AI 根据 Prompt 主动挖掘：个人信息、工作经历、教育背景、技能、项目经历等。
    4.  输出标准化的 JSON 数据。
*   **代码位置**: `apps/web/src/lib/resume-parser.ts`

### 3.2 职位解析 (Job Parsing)
*   **输入**: 职位详情页 URL 或 文本。
*   **流程**:
    1.  简单 `fetch` 获取 HTML 内容（存在反爬虫风险）。
    2.  清洗 HTML 标签和脚本。
    3.  调用 AI (Claude) 提取结构化信息：职位名称、公司、薪资范围、职责、要求等。
*   **代码位置**: `apps/web/src/lib/job-parser.ts`

### 3.3 智能求职信生成 (Cover Letter Generation)
*   **输入**: 用户简历数据 + 目标职位信息 + 用户偏好 (语气/语言)。
*   **流程**:
    1.  将结构化的简历和职位信息组装成 Prompt。
    2.  调用 AI 生成针对性的求职信。
    3.  返回生成的内容、亮点摘要和字数统计。
*   **代码位置**: `apps/web/src/lib/cover-letter-generator.ts`

## 4. 问题挖掘与风险分析 (Problem Analysis)

### 4.1 架构与代码质量
1.  **逻辑耦合**: 核心解析逻辑紧耦合在 Web 端，导致未来的浏览器插件 (`apps/extension`) 无法直接复用这些能力。必须将 `lib/` 下的解析器迁移至 `packages/`。
2.  **类型定义分散**: 虽然有 `packages/shared`，但部分类型和工具函数（如 `json-utils`）仍在 Web 应用内部定义，导致复用困难。

### 4.2 技术实现缺陷
1.  **抓取能力脆弱**: `job-parser.ts` 仅使用简单的 `fetch` 请求。现代招聘网站 (LinkedIn, Seek, TradeMe) 通常有复杂的反爬虫机制或依赖客户端渲染 (SPA)。简单的 `fetch` 极大概率会失败或被封锁。
    *   **建议**: 需要引入 Headless Browser (如 Puppeteer/Playwright) 或专业的 Scraping API (如 Firecrawl/ScrapingBee)。
2.  **AI 依赖风险**: 代码硬编码了特定的模型版本 `claude-sonnet-4-5-20250929` 和自定义的中转域名 `relay.a-dobe.club`。
    *   如果中转服务下线，整个应用将瘫痪。
    *   模型版本号看起来像是预览版或特定版，可能随时失效。

### 4.3 功能缺失
1.  **浏览器插件缺失**: 对于求职助手，浏览器插件是核心场景（用户在招聘网站浏览时直接点击分析）。目前该目录为空，严重缺失了产品的核心竞争力。
2.  **ATS 优化缺失**: `packages/ats-optimizer` 为空，说明简历针对特定职位的关键词优化功能尚未实现。

## 5. 后续开发计划建议 (Future Development Plan)

### 阶段一：架构重构与基建 (Refactoring) - 1周
1.  **迁移核心逻辑**: 将 `resume-parser.ts`, `job-parser.ts`, `cover-letter-generator.ts` 从 `apps/web` 迁移到对应的 `packages/*` 中。
2.  **统一类型定义**: 完善 `packages/shared`，确保 Web 和 Extension 都能引用统一的数据模型。
3.  **数据库 Schema**: 在 `packages/database` 中定义完整的 Supabase Schema 和迁移脚本。

### 阶段二：核心能力增强 (Enhancement) - 2周
1.  **增强抓取引擎**: 在 `packages/job-scraper` 中实现基于 Playwright 或 Firecrawl 的抓取服务，解决动态网页和反爬问题。
2.  **浏览器插件开发**: 启动 `apps/extension` 开发。
    *   功能：在 Seek/LinkedIn 页面注入侧边栏，一键解析当前职位，并显示与用户简历的匹配度。
3.  **ATS 评分系统**: 实现 `packages/ats-optimizer`，计算简历与职位的关键词匹配得分。

### 阶段三：产品化与商业化 (Productization) - 2周
1.  **用户仪表盘**: 完善 Web 端的申请追踪看板 (Kanban board)。
2.  **支付集成**: 接入 Stripe，设计订阅模式 (Freemium)。
3.  **多语言支持**: 完善 i18n，虽然目前主要针对新西兰（英语），但代码中已有中文支持的痕迹，可扩展至其他市场。

## 6. 商业价值分析 (Commercial Value)

*   **痛点**: 投递简历重复性高、针对性修改耗时、求职信编写困难。
*   **价值主张**: "10倍速求职" —— 自动化抓取、解析、匹配和生成。
*   **商业模式**:
    *   **Freemium**: 免费用户每天有限次解析/生成。
    *   **Pro Subscription**: 无限次使用，高级 ATS 优化建议，多简历版本管理。
*   **竞争壁垒**:
    *   **本地化**: 针对新西兰市场 (Seek, TradeMe) 的深度适配。
    *   **浏览器插件体验**: 嵌入式的工作流比单纯的 Web 应用更符合用户习惯。

---
**总结**: 该项目拥有清晰的商业逻辑和技术原型，但目前处于"脚手架完善但核心未填充"的状态。当务之急是进行架构解耦，并着手开发浏览器插件，这是该产品区别于普通 GPT 套壳工具的关键差异化竞争点。
