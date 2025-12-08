# CareerMatch AI 重构与演进计划 (Refactoring & Evolution Plan)

## 1. 核心目标 (Core Objectives)

1.  **模块化 (Modularization)**: 实现 "Micro-Kernel" 架构，核心业务逻辑（解析、抓取、生成）封装为独立 Package，通过标准接口通信。
2.  **Agentic Workflow**: 从 "被动工具" 转型为 "主动 Agent"，具备记忆能力，主动优化 CV/Cover Letter。
3.  **基础设施升级**: 结合 Cloudflare Workers 的边缘计算能力，优化抓取和解析性能。
4.  **MCP 集成**: 利用 Model Context Protocol (MCP) 让 AI "拥有技能"，而非单纯的文本生成。

## 2. 架构重构方案 (Architecture Refactoring)

### 2.1 现状 vs 目标

| 组件 | 当前位置 (Monolith) | 目标位置 (Modular) | 部署形态 |
| :--- | :--- | :--- | :--- |
| **简历解析** | `apps/web/src/lib/resume-parser.ts` | `packages/resume-parser` | Cloudflare Worker (API) |
| **职位抓取** | `apps/web/src/lib/job-parser.ts` | `packages/job-scraper` | Cloudflare Worker (Browser Rendering) |
| **求职信生成** | `apps/web/src/lib/cover-letter-generator.ts` | `packages/ai-agent` | Library / Serverless Function |
| **核心类型** | `apps/web` & `packages/shared` | `packages/shared` | NPM Package (Workspace) |
| **Web UI** | `apps/web` | `apps/web` | Vercel (Next.js) |

### 2.2 接口标准化 (Interface Standardization)

所有模块必须遵循 "Input -> Process -> Output" 的无状态设计。

```typescript
// packages/shared/src/types/parser.ts
export interface IResumeParser {
  parse(fileContent: Buffer, options?: ParseOptions): Promise<ParsedResume>;
}

// packages/shared/src/types/scraper.ts
export interface IJobScraper {
  scrape(url: string): Promise<JobData>;
}
```

## 3. Agent 与 记忆系统 (Agent & Memory)

### 3.1 记忆架构 (Memory Architecture)

不再依赖单一的 Chat History，而是构建结构化的 "用户画像 (User Profile)" 和 "上下文索引 (Context Index)"。

*   **Fact Memory (事实记忆)**: 存储在 Supabase PostgreSQL。
    *   用户偏好 (如: "喜欢正式语气", "不接受外包")
    *   职业身份 (如: "全栈工程师", "5年经验")
*   **Episodic Memory (情景记忆)**: 存储在 Vector DB (Supabase pgvector)。
    *   过往的修改建议、成功的 Cover Letter 片段。
    *   用于 RAG (Retrieval-Augmented Generation) 检索相似场景。

### 3.2 对话管理策略 (Conversation Management)

**建议方案: "以对象为中心的对话 (Object-Centric Chat)"**

不要模仿 ChatGPT 的 "无限列表"，而是将对话绑定到具体的**对象**上。

*   **Job Chat**: 针对 "Google - Senior Dev" 这个岗位的专用对话窗口。上下文自动包含该岗位描述和用户简历。
*   **Resume Chat**: 针对 "2025版简历" 的优化对话。
*   **Global Assistant**: 一个全局浮窗，用于通用指令（"帮我看看最近有什么新工作"），它调用 MCP 工具来执行任务。

**优势**:
*   上下文窗口小，Token 消耗低。
*   用户意图明确，无需翻找历史记录。
*   历史记录作为 "Activity Log" (活动日志) 存档，而非对话列表。

## 4. 基础设施与部署 (Infrastructure)

### 4.1 混合云架构 (Hybrid Cloud)

*   **Vercel (Frontend)**: 托管 Next.js 应用。优势：构建速度快，与 React 生态集成完美。
*   **Cloudflare (Backend/Edge)**:
    *   **Workers**: 托管 `parser-api`, `scraper-api`。优势：冷启动快，成本低，适合高并发 API。
    *   **Browser Rendering**: 用于 `job-scraper` 解决反爬问题 (Playwright on Edge)。
    *   **R2**: 存储原始简历文件 (PDF/Docx)，替代 Supabase Storage (可选，视成本而定)。
*   **Supabase (Data)**: PostgreSQL 数据库 + Auth + Vector。

### 4.2 MCP (Model Context Protocol) 集成

利用 "Claude Code" 或类似的 Agent 框架，将内部模块封装为 MCP Tools。

*   `tool: parse_resume(file_id)`
*   `tool: scrape_job(url)`
*   `tool: generate_cover_letter(resume_id, job_id)`

这样，AI Agent 可以通过调用工具来完成任务，而不是仅仅生成文本建议。

## 5. 实施路线图 (Implementation Roadmap)

### Phase 1: 解耦 (Decoupling) - 预计 3-5 天
1.  在 `packages/` 下创建标准包结构。
2.  将 `apps/web/src/lib` 中的逻辑迁移至对应包。
3.  在 `apps/web` 中引用本地包，确保功能回归。

### Phase 2: 服务化 (Servicization) - 预计 1 周
1.  初始化 `workers/` 目录。
2.  将 `packages/job-scraper` 封装为 Cloudflare Worker。
3.  在 Web 端通过 API 调用 Worker，而非本地执行 (解决 Vercel 函数超时问题)。

### Phase 3: 智能化 (Agentification) - 持续迭代
1.  设计 `user_facts` 表结构。
2.  实现 "主动建议" 逻辑：当用户上传简历时，后台 Agent 自动运行 `optimize_resume` 工具并生成建议报告。

## 6. 工作量评估 (Workload Assessment)

*   **重构工作量**: **中等**。代码逻辑已存在，主要是搬运和接口定义。
*   **新功能工作量**: **较高**。特别是 Cloudflare Workers 的环境配置和 Browser Rendering 的调试，以及 Agent 记忆系统的设计。
*   **建议**: 
    *   先做 **Phase 1** (代码搬运)，这是无风险且收益立竿见影的（代码清晰了）。
    *   再做 **Phase 2** (Cloudflare)，解决实际的抓取痛点。
    *   最后做 **Phase 3** (Agent)，这是产品的升华。
