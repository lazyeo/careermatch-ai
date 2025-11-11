# 技术决策记录（Architecture Decision Records）

记录项目中的重要技术决策及其背景、理由和后果。

---

## ADR-001: 选择Monorepo架构

**日期**: 2025-01-11
**状态**: ✅ 已采用
**决策者**: 开发团队

### 背景
需要管理多个相互依赖的包：
- Web应用（apps/web）
- UI组件库（packages/ui）
- 共享类型库（packages/shared）
- 工具库（resume-parser, ats-optimizer等）

传统的多仓库方式会导致版本同步困难、代码重复、开发体验差。

### 决策
采用 **Turborepo + pnpm workspaces** 的Monorepo架构。

### 理由

#### 1. 代码共享
- UI组件和类型在多个应用间共享
- 避免代码重复
- 统一的依赖管理

#### 2. 版本同步
- 所有包版本一致
- 避免"依赖地狱"
- 简化依赖升级

#### 3. 构建优化
- Turborepo缓存机制加速构建
- 并行构建多个包
- 智能依赖图分析

#### 4. 开发体验
- 统一的开发命令（pnpm dev）
- 跨包的TypeScript类型推导
- 更好的IDE支持

#### 5. 开源友好
- 独立包可单独发布到npm
- 保持核心业务私有
- 灵活的发布策略

### 备选方案

#### 方案A: 多仓库（Polyrepo）
**优势**: 独立性强，权限隔离好
**劣势**:
- 版本同步困难
- 跨仓库重构复杂
- 开发体验差
- 本地开发需要link多个仓库

#### 方案B: Lerna
**优势**: 成熟的Monorepo工具
**劣势**:
- 较旧的解决方案
- 性能不如Turborepo
- 社区活跃度下降

#### 方案C: Nx
**优势**: 功能强大，支持多种框架
**劣势**:
- 学习曲线陡峭
- 配置复杂
- 对于我们的需求过于重量级

### 后果

#### 优势
- ✅ 开发效率显著提升
- ✅ 代码复用性好
- ✅ 构建速度快（缓存机制）
- ✅ 类型安全跨包传递
- ✅ 便于重构和维护

#### 劣势
- ⚠️ 初期配置相对复杂
- ⚠️ 需要理解Turborepo和pnpm
- ⚠️ 仓库体积较大（包含所有包）
- ⚠️ CI/CD需要特殊配置

### 参考资料
- [Turborepo官方文档](https://turbo.build/repo)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Monorepo.tools](https://monorepo.tools/)

---

## ADR-002: 选择Supabase作为后端

**日期**: 2025-01-11
**状态**: ✅ 已采用
**决策者**: 开发团队

### 背景
项目需要：
- PostgreSQL关系型数据库
- 用户认证系统
- 文件存储（简历PDF）
- 实时订阅（可选）

预算有限，需要免费额度支持MVP开发，且希望减少后端开发和运维工作量。

### 决策
使用 **Supabase**（PostgreSQL + Auth + Storage + Realtime）。

### 理由

#### 1. 免费额度充足
- 500MB PostgreSQL数据库
- 1GB文件存储
- 50K月活用户（MAU）
- 足够支持100-300用户的MVP

#### 2. 功能完整
- 数据库：PostgreSQL（强大的关系型数据库）
- 认证：内置Auth系统，支持邮箱、OAuth
- 存储：文件上传和管理
- 实时订阅：WebSocket支持（未来可用）
- Row Level Security：数据安全原生支持

#### 3. 开发速度
- 无需搭建后端服务器
- 自动生成REST API
- 自动生成TypeScript类型
- 减少80%的后端开发工作

#### 4. 开发体验
- 优秀的Web Dashboard
- SQL Editor在线执行
- 实时日志查看
- 数据库迁移管理

#### 5. 扩展性
- 支持PostgreSQL所有功能
- 可以编写自定义函数（PL/pgSQL）
- 支持触发器和存储过程
- 可以自托管（未来需要时）

### 备选方案

#### 方案A: Firebase
**优势**: Google生态，实时数据库
**劣势**:
- 文档数据库（NoSQL），不适合关系型数据
- 复杂查询能力弱
- 价格相对较高
- 数据模型不适合简历/岗位场景

#### 方案B: 自建后端（Node.js + PostgreSQL）
**优势**: 完全控制，灵活性最高
**劣势**:
- 开发成本高（需要写所有API）
- 运维负担重（服务器、数据库维护）
- 认证系统需要自己实现
- 时间成本高，不利于快速验证MVP

#### 方案C: PlanetScale
**优势**: MySQL兼容，免费额度
**劣势**:
- 只提供数据库，认证和存储需要另外解决
- 无Row Level Security
- 需要额外集成Auth服务（如Clerk、Auth0）
- 总成本可能更高

#### 方案D: AWS (RDS + Cognito + S3)
**优势**: 企业级，可扩展性强
**劣势**:
- 配置复杂
- 免费额度有限（1年）
- 成本较高
- 学习曲线陡峭
- 不适合MVP快速开发

### 后果

#### 优势
- ✅ 极快的开发速度
- ✅ 低成本甚至零成本启动
- ✅ PostgreSQL全功能支持
- ✅ 类型安全（自动生成类型）
- ✅ RLS保障数据安全
- ✅ 优秀的开发体验

#### 劣势
- ⚠️ 部分依赖Supabase生态
- ⚠️ 自托管需要额外工作
- ⚠️ 免费额度有限制（500MB数据库）
- ⚠️ 区域选择有限（延迟问题）

#### 迁移策略（如果需要）
1. Supabase支持自托管（开源）
2. PostgreSQL数据库标准，易于迁移
3. 可以逐步迁移到自建后端

### 性能考量
- 选择Asia Pacific (Singapore)区域，延迟最低
- 使用连接池优化数据库连接
- 合理设计索引提升查询速度
- 启用RLS的同时注意查询性能

### 参考资料
- [Supabase官方文档](https://supabase.com/docs)
- [Supabase vs Firebase对比](https://supabase.com/alternatives/supabase-vs-firebase)
- [Row Level Security指南](https://supabase.com/docs/guides/auth/row-level-security)

---

## ADR-003: 选择Next.js 14 App Router

**日期**: 2025-01-11
**状态**: ✅ 已采用
**决策者**: 开发团队

### 背景
需要选择前端框架来构建Web应用。要求：
- 支持SSR和SSG
- TypeScript优先
- 良好的开发体验
- 易于部署
- 社区活跃

### 决策
使用 **Next.js 14（App Router）**。

### 理由

#### 1. App Router的优势
- 基于React Server Components
- 更简洁的文件系统路由
- 内置Loading和Error状态
- 更好的数据获取模式（async/await）
- Streaming和Suspense支持

#### 2. 性能优化
- 自动代码分割
- 图片优化（next/image）
- 字体优化（next/font）
- 预取（Prefetching）
- 增量静态生成（ISR）

#### 3. 开发体验
- 快速刷新（Fast Refresh）
- TypeScript原生支持
- ESLint和Prettier集成
- 优秀的错误提示

#### 4. 部署便捷
- Vercel一键部署
- 免费额度充足
- 全球CDN
- 自动HTTPS

#### 5. 生态系统
- 社区活跃，资源丰富
- 大量第三方库支持
- 官方文档完善
- Vercel官方支持

### 备选方案

#### 方案A: Next.js Pages Router
**优势**: 更成熟，社区资源多
**劣势**:
- 较旧的架构
- 数据获取模式不够优雅
- 缺少Server Components
- 未来趋势是App Router

#### 方案B: Remix
**优势**: 优秀的表单处理，嵌套路由
**劣势**:
- 社区相对较小
- 第三方库支持不如Next.js
- 学习曲线陡峭
- 部署选择少

#### 方案C: Vite + React Router
**优势**: 极快的开发服务器，灵活
**劣势**:
- 需要手动配置SSR
- 缺少开箱即用的优化
- 部署配置复杂
- 不适合需要SEO的场景

#### 方案D: Vue.js (Nuxt)
**优势**: 简单易学，性能好
**劣势**:
- 团队更熟悉React
- 生态系统相对较小
- TypeScript支持不如React

### 后果

#### 优势
- ✅ 现代化的开发体验
- ✅ 优秀的性能
- ✅ 便捷的部署
- ✅ 未来趋势
- ✅ 强大的生态系统

#### 劣势
- ⚠️ App Router相对较新，可能有坑
- ⚠️ 学习曲线（Server Components概念）
- ⚠️ 某些第三方库可能不兼容

#### 风险缓解
- 充分测试Server/Client Components
- 关注Next.js更新和社区反馈
- 保持代码模块化，便于未来迁移

### 参考资料
- [Next.js 14文档](https://nextjs.org/docs)
- [App Router介绍](https://nextjs.org/docs/app)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

---

## ADR-004: AI服务混合策略

**日期**: 2025-01-11
**状态**: ✅ 已采用
**决策者**: 开发团队

### 背景
项目需要AI能力：
- 简历与岗位匹配分析
- 简历优化建议
- 求职信生成
- 关键词提取

完全使用OpenAI成本高，完全使用开源模型质量可能不足。

### 决策
采用 **混合AI策略**：
- **OpenAI GPT-4**: 核心高价值功能
- **Cloudflare AI Workers**: 辅助功能
- **缓存机制**: 减少重复调用

### 理由

#### 1. 成本优化
- GPT-4用于关键功能，确保质量
- Cloudflare AI免费额度处理简单任务
- 缓存减少API调用次数

#### 2. 性能平衡
- GPT-4：9维度分析、简历优化、求职信
- GPT-3.5-turbo：关键词提取、文本摘要
- Cloudflare AI：文本相似度、简单分类

#### 3. 可扩展性
- 未来可增加本地模型
- 灵活调整不同AI服务占比
- 不锁定单一供应商

### AI功能分配

| 功能 | AI服务 | 原因 |
|------|--------|------|
| 9维度岗位匹配 | GPT-4 | 需要深度理解和推理 |
| 简历优化建议 | GPT-4 | 需要生成高质量建议 |
| 求职信生成 | GPT-4 | 需要创意和个性化 |
| 关键词提取 | GPT-3.5-turbo | 任务简单，成本低 |
| 文本相似度 | Cloudflare AI | 计算型任务，免费 |
| 简历解析 | 规则+GPT-3.5 | 混合方案，平衡质量和成本 |

### 成本预估（MVP阶段）

假设100个活跃用户：
- 每用户每周分析10个岗位
- 每次分析使用GPT-4（~2000 tokens）
- 每周总计：100用户 × 10次 × 2000 tokens = 2M tokens
- 月成本：2M × 4周 × $0.01/1K tokens ≈ **$80/月**

**优化后**：
- 缓存匹配结果：节省50%
- 部分使用GPT-3.5：节省30%
- 实际成本：**$20-30/月**

### 备选方案

#### 方案A: 仅使用OpenAI
**优势**: 质量最高，集成简单
**劣势**: 成本高，依赖单一供应商

#### 方案B: 仅使用开源模型（Llama, Mistral）
**优势**: 完全免费，自主可控
**劣势**:
- 需要GPU资源
- 推理速度慢
- 质量可能不稳定
- 维护成本高

#### 方案C: 使用Anthropic Claude
**优势**: 质量好，上下文窗口大
**劣势**:
- 成本与OpenAI相近
- 免费额度有限
- 生态不如OpenAI成熟

### 后果

#### 优势
- ✅ 平衡质量和成本
- ✅ 灵活性高
- ✅ 可持续发展
- ✅ 风险分散

#### 劣势
- ⚠️ 集成复杂度增加
- ⚠️ 需要维护多个API
- ⚠️ 质量可能不一致

### 实施细节

#### 缓存策略
```typescript
// 相同简历+岗位的分析结果缓存7天
job_analyses表存储分析结果
避免重复调用OpenAI API
```

#### Fallback机制
```typescript
// OpenAI失败时的降级策略
1. 尝试3次重试
2. 失败后使用缓存结果
3. 最终回退到规则算法
```

#### 监控
- 记录API调用次数
- 监控响应时间
- 追踪成本
- 质量评估

### 参考资料
- [OpenAI定价](https://openai.com/pricing)
- [Cloudflare AI Workers](https://ai.cloudflare.com/)
- [混合AI策略最佳实践](https://www.patterns.app/blog/2023/09/06/openai-vs-open-source)

---

## 决策模板

### ADR-XXX: 决策标题

**日期**: YYYY-MM-DD
**状态**: 🔄 讨论中 / ✅ 已采用 / ❌ 已废弃 / 📝 已替代
**决策者**: XXX

### 背景
描述为什么需要做这个决策，当前面临的问题或挑战。

### 决策
简要说明最终的决策内容。

### 理由
详细列举支持这个决策的原因：
1. 原因1
2. 原因2
3. 原因3

### 备选方案
列举考虑过的其他方案及其优劣：

#### 方案A
**优势**: XXX
**劣势**: XXX

#### 方案B
**优势**: XXX
**劣势**: XXX

### 后果
描述采用这个方案的影响：

#### 优势
- ✅ 优势1
- ✅ 优势2

#### 劣势
- ⚠️ 劣势1
- ⚠️ 劣势2

### 参考资料
- [相关链接1](url)
- [相关链接2](url)

---

*最后更新: 2025-01-11*
