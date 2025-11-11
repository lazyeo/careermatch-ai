# CareerMatch AI - Development Workflow Guide

> **项目配置文件** - 定义开发工作流、规范和最佳实践

---

## 🎯 核心工作流原则

### 1. 文档驱动开发（Document-Driven Development）

**原则**：所有开发活动必须在文档中有迹可循，确保项目状态随时可审计。

**要求**：
- ✅ 开发前先查阅文档
- ✅ 开发中实时更新文档
- ✅ 完成后补充文档记录
- ✅ 关键决策必须文档化

### 2. Todo驱动任务管理（Todo-Driven Task Management）

**原则**：所有非平凡任务必须使用TodoWrite工具追踪，确保进度透明。

**要求**：
- ✅ 复杂任务（3步以上）必须创建Todo
- ✅ 每个Todo必须有清晰的完成标准
- ✅ 同时只能有1个Todo处于in_progress状态
- ✅ 完成后立即标记completed

---

## 📋 强制工作流规范

### 阶段一：开发前（Planning Phase）

#### 1.1 文档检查清单

在开始任何开发工作前，必须完成以下检查：

```markdown
[ ] 阅读 README.md - 了解项目整体架构
[ ] 阅读 DEVELOPMENT.md - 掌握开发指南
[ ] 查看 docs/PROGRESS.md - 了解当前进度
[ ] 查看 docs/CHANGELOG.md - 了解最近变更
[ ] 查看 paraflow/ 设计文件 - 理解UI需求
```

#### 1.2 任务规划（强制使用TodoWrite）

**触发条件**（满足任一即需使用TodoWrite）：
- 任务需要3个以上步骤
- 任务预计超过30分钟
- 任务涉及多个文件修改
- 用户明确要求创建Todo列表
- 任务包含多个子任务

**TodoWrite规范**：
```typescript
// 每个Todo必须包含：
{
  content: "动词开头的任务描述",        // 如：创建、实现、配置
  activeForm: "现在进行时描述",         // 如：创建中、实现中
  status: "pending | in_progress | completed"
}

// 示例
{
  content: "实现用户认证功能",
  activeForm: "实现用户认证功能",
  status: "pending"
}
```

#### 1.3 前置检查脚本

开发前运行检查：
```bash
# 检查当前工作目录
pwd

# 检查Git状态
git status

# 检查分支
git branch

# 查看最近提交
git log --oneline -5
```

---

### 阶段二：开发中（Development Phase）

#### 2.1 实时文档更新规则

**规则1：每完成一个Todo，必须：**
```bash
1. 标记Todo为completed
2. 更新 docs/PROGRESS.md 进度记录
3. 如有重要决策，记录到 docs/DECISIONS.md
```

**规则2：遇到问题时，必须：**
```bash
1. 在 docs/ISSUES.md 记录问题
2. 记录尝试的解决方案
3. 记录最终解决方法
```

**规则3：修改架构时，必须：**
```bash
1. 更新 README.md 的架构说明
2. 更新相关包的 README.md
3. 提交说明中详细描述变更原因
```

#### 2.2 Todo管理规范

**状态转换流程**：
```
pending → in_progress → completed
```

**严格规则**：
- ⚠️ **同时只能有1个Todo为in_progress**
- ⚠️ **开始工作前必须将Todo改为in_progress**
- ⚠️ **完成后立即标记completed，不能批量操作**
- ⚠️ **遇到阻塞时，保持in_progress并创建新Todo描述阻塞原因**

**不完整时不能标记completed的情况**：
- ❌ 测试失败
- ❌ 遇到错误未解决
- ❌ 功能部分实现
- ❌ 依赖缺失
- ❌ 文档未更新

#### 2.3 代码提交规范

**提交信息格式**（中文）：
```
[类型] 简要描述

## 详细说明
- 具体变更内容
- 相关文件列表
- 影响范围

## 相关Todo
- [x] Todo #1: 具体描述
- [x] Todo #2: 具体描述

## 技术细节（可选）
- 使用的技术/库
- 重要的实现决策
```

**类型标签**：
- `[新增]` - 新功能、新文件、新包
- `[修复]` - Bug修复
- `[优化]` - 性能优化、代码重构
- `[文档]` - 文档更新
- `[配置]` - 配置文件修改
- `[测试]` - 测试相关
- `[重构]` - 代码结构调整

---

### 阶段三：完成后（Completion Phase）

#### 3.1 文档更新检查清单

完成任务后，必须更新以下文档：

```markdown
[ ] docs/PROGRESS.md - 更新完成进度
[ ] docs/CHANGELOG.md - 记录变更内容
[ ] README.md - 如有架构变更，更新说明
[ ] DEVELOPMENT.md - 如有新的开发流程，补充文档
[ ] 相关包的 README.md - 如有新功能，更新使用说明
```

#### 3.2 状态同步

```bash
# 1. 确保所有Todo已标记completed
# 2. 更新项目进度文档
# 3. 提交代码和文档
git add .
git commit -m "[类型] 描述"

# 4. 推送到远程（如需要）
# git push origin develop
```

---

## 📊 核心文档结构

### 必需文档（Must-Have）

```
docs/
├── PROGRESS.md         # 项目进度追踪（实时更新）
├── CHANGELOG.md        # 变更日志（每次提交更新）
├── DECISIONS.md        # 技术决策记录（重要决策记录）
├── ISSUES.md           # 问题追踪（遇到问题记录）
└── API.md              # API文档（后端开发时创建）
```

### 进度追踪文档模板（docs/PROGRESS.md）

```markdown
# 项目进度追踪

> 最后更新：2025-01-11 | 当前阶段：Phase 1 - 基础架构

## 当前状态

**整体进度**: 15% (Phase 1 完成)

### Phase 1: 基础架构 ✅ 完成
- [x] Monorepo搭建
- [x] Next.js应用初始化
- [x] UI组件库创建
- [x] 数据库Schema设计
- [x] 项目文档完善

### Phase 2: 核心功能 🚧 进行中 (0%)
- [ ] 用户认证 (Supabase Auth)
- [ ] 简历CRUD操作
- [ ] 简历编辑器
- [ ] PDF导出功能

### Phase 3: Job管理 📅 计划中
- [ ] 岗位添加和管理
- [ ] AI匹配分析
- [ ] 岗位详情页

---

## 本周计划（Week 2: 2025-01-11 ~ 2025-01-17）

### 优先级 P0（必须完成）
- [ ] 配置Supabase项目
- [ ] 实现用户登录/注册
- [ ] 简历列表页面

### 优先级 P1（尽量完成）
- [ ] Google OAuth集成
- [ ] 用户Profile管理

### 优先级 P2（时间允许）
- [ ] 简历编辑器原型

---

## 已完成里程碑

### 2025-01-11: 项目初始化 ✅
- 创建Monorepo架构
- 完成技术栈选型
- 设计数据库Schema
- 编写项目文档
- 推送到GitHub

---

## 阻塞问题

暂无

---

## 下一步行动

1. 创建Supabase项目
2. 配置环境变量
3. 开始用户认证开发
```

### 变更日志模板（docs/CHANGELOG.md）

```markdown
# 变更日志

所有重要变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/)。

## [Unreleased]

### Added
- 新增的功能

### Changed
- 改变的功能

### Fixed
- 修复的Bug

### Removed
- 移除的功能

---

## [0.1.0] - 2025-01-11

### Added
- 初始化Monorepo架构（Turborepo + pnpm）
- 创建Next.js 14主应用
- 创建@careermatch/ui组件库（Button, Card, SkillTag, MatchScoreBadge）
- 创建@careermatch/shared类型库
- 设计Supabase数据库Schema（8张表）
- 编写项目文档（README.md, DEVELOPMENT.md）
- 配置Tailwind CSS设计系统

### Technical Details
- 技术栈：Next.js 14, TypeScript, Tailwind CSS, Supabase
- 架构：Monorepo with Turborepo
- 包管理：pnpm workspaces
```

### 技术决策记录模板（docs/DECISIONS.md）

```markdown
# 技术决策记录（Architecture Decision Records）

记录项目中的重要技术决策及其背景。

---

## ADR-001: 选择Monorepo架构

**日期**: 2025-01-11
**状态**: ✅ 已采用
**决策者**: 开发团队

### 背景
需要管理多个相互依赖的包（web应用、UI组件库、类型库等）。

### 决策
采用Turborepo + pnpm workspaces的Monorepo架构。

### 理由
1. **代码共享**: UI组件和类型在多个应用间共享
2. **版本同步**: 避免版本不一致问题
3. **构建优化**: Turborepo缓存加速构建
4. **开发体验**: 统一的开发命令
5. **开源友好**: 独立包可单独发布

### 备选方案
- **多仓库**: 维护成本高，版本同步困难
- **Lerna**: 较旧的方案，性能不如Turborepo

### 后果
- 优势：开发效率提升，代码复用性好
- 劣势：初期配置复杂，学习曲线

### 参考
- [Turborepo文档](https://turbo.build/repo)

---

## ADR-002: 选择Supabase作为后端

**日期**: 2025-01-11
**状态**: ✅ 已采用

### 背景
需要数据库、认证、存储等后端服务，预算有限。

### 决策
使用Supabase（PostgreSQL + Auth + Storage）。

### 理由
1. **免费额度充足**: 500MB数据库，支持100-300用户的MVP
2. **功能完整**: 数据库、认证、存储、实时订阅一体化
3. **开发速度**: 减少后端开发工作量
4. **类型安全**: 自动生成TypeScript类型
5. **Row Level Security**: 内置数据安全机制

### 备选方案
- **Firebase**: 文档数据库，不适合关系型数据
- **自建后端**: 开发成本高，运维负担重
- **PlanetScale**: 只有数据库，需单独处理认证

### 后果
- 优势：快速启动，成本低
- 劣势：部分依赖Supabase生态

---

## 模板

### ADR-XXX: 决策标题

**日期**: YYYY-MM-DD
**状态**: 🔄 讨论中 / ✅ 已采用 / ❌ 已废弃

### 背景
描述为什么需要做这个决策。

### 决策
简要说明决策内容。

### 理由
列举支持这个决策的原因。

### 备选方案
列举考虑过的其他方案。

### 后果
描述采用这个方案的影响（优势和劣势）。

### 参考
相关链接和资料。
```

---

## 🚨 强制执行检查

### Claude Code执行前检查

每次开始开发任务时，Claude Code必须：

1. **检查文档完整性**
   ```bash
   # 必须存在的文档
   - README.md
   - DEVELOPMENT.md
   - docs/PROGRESS.md
   - docs/CHANGELOG.md
   ```

2. **检查Todo状态**
   ```bash
   # 确保没有遗留的in_progress状态
   # 确保上次任务的Todo已完成
   ```

3. **检查Git状态**
   ```bash
   git status  # 确保工作区干净或了解当前变更
   ```

### 开发中检查点

每完成一个功能点（约30分钟或一个Todo）：

```markdown
[ ] Todo已更新状态
[ ] 代码已保存
[ ] 相关文档已更新
[ ] 如有测试，测试已通过
```

### 提交前检查

```markdown
[ ] 所有Todo已标记completed
[ ] docs/PROGRESS.md 已更新
[ ] docs/CHANGELOG.md 已添加条目
[ ] 提交信息完整且清晰
[ ] 没有遗留的console.log或调试代码
[ ] TypeScript类型检查通过
```

---

## 🔄 工作流示例

### 示例1：开发用户认证功能

#### Step 1: 规划（使用TodoWrite）
```typescript
TodoWrite([
  {
    content: "配置Supabase项目并获取API密钥",
    activeForm: "配置Supabase项目",
    status: "pending"
  },
  {
    content: "创建Supabase客户端工具函数",
    activeForm: "创建Supabase客户端",
    status: "pending"
  },
  {
    content: "实现登录页面UI",
    activeForm: "实现登录页面UI",
    status: "pending"
  },
  {
    content: "实现注册页面UI",
    activeForm: "实现注册页面UI",
    status: "pending"
  },
  {
    content: "集成Supabase Auth",
    activeForm: "集成Supabase Auth",
    status: "pending"
  },
  {
    content: "测试登录注册流程",
    activeForm: "测试登录注册流程",
    status: "pending"
  }
])
```

#### Step 2: 执行第一个Todo
```typescript
// 2.1 标记为in_progress
TodoWrite([
  {
    content: "配置Supabase项目并获取API密钥",
    activeForm: "配置Supabase项目",
    status: "in_progress"  // ← 改为in_progress
  },
  // ... 其他todos保持pending
])

// 2.2 执行任务
// - 访问supabase.com
// - 创建项目
// - 获取API密钥
// - 配置.env.local

// 2.3 完成后立即标记completed
TodoWrite([
  {
    content: "配置Supabase项目并获取API密钥",
    activeForm: "配置Supabase项目",
    status: "completed"  // ← 改为completed
  },
  {
    content: "创建Supabase客户端工具函数",
    activeForm: "创建Supabase客户端",
    status: "in_progress"  // ← 开始下一个
  },
  // ... 其他todos
])
```

#### Step 3: 更新文档
```bash
# 更新 docs/PROGRESS.md
## Phase 2: 核心功能 🚧 进行中 (10%)
- [x] 配置Supabase项目 ✅
- [ ] 创建Supabase客户端 🚧
- [ ] 实现登录页面

# 更新 docs/CHANGELOG.md
### Added
- 配置Supabase项目（项目ID: xxx）
- 添加环境变量配置
```

#### Step 4: 提交
```bash
git add .
git commit -m "[配置] 添加Supabase项目配置

## 详细说明
- 在Supabase创建新项目 careermatch-ai
- 配置环境变量 (.env.local)
- 更新文档记录项目信息

## 相关Todo
- [x] 配置Supabase项目并获取API密钥

## 技术细节
- Supabase Project: careermatch-ai-xxxx
- Region: Asia Pacific (Singapore)
"
```

---

## 📌 快速参考

### TodoWrite何时使用

| 场景 | 是否使用TodoWrite |
|------|------------------|
| 单个文件的简单修改（<5分钟） | ❌ 不需要 |
| 3步以上的任务 | ✅ 必须 |
| 预计超过30分钟 | ✅ 必须 |
| 用户明确要求 | ✅ 必须 |
| 跨多个文件的修改 | ✅ 必须 |
| 纯信息查询 | ❌ 不需要 |

### 文档更新频率

| 文档 | 更新频率 |
|------|---------|
| docs/PROGRESS.md | 每完成1个Todo |
| docs/CHANGELOG.md | 每次提交 |
| docs/DECISIONS.md | 重要决策时 |
| docs/ISSUES.md | 遇到问题时 |
| README.md | 架构变更时 |

### 提交信息类型速查

```bash
[新增] - 新功能、文件、包
[修复] - Bug修复
[优化] - 性能、重构
[文档] - 文档更新
[配置] - 配置修改
[测试] - 测试相关
[重构] - 结构调整
```

---

## 🎯 工作流目标

通过严格遵循此工作流，我们确保：

1. ✅ **进度透明**: 随时了解项目状态
2. ✅ **决策可追溯**: 了解为什么做某个选择
3. ✅ **问题有记录**: 避免重复踩坑
4. ✅ **知识沉淀**: 文档即知识库
5. ✅ **团队协作**: 新成员快速上手

---

## 📚 设计文件参考

### Paraflow设计资源

```
paraflow/
├── Screen & Prototype/        # 14个页面设计
│   ├── 登录页面.html
│   ├── 注册页面.html
│   ├── 求职仪表盘.html
│   ├── 简历管理中心.html
│   ├── 简历编辑器.html
│   ├── 岗位管理.html
│   ├── 岗位详情.html
│   ├── 智能推荐.html
│   ├── 申请进度追踪.html
│   ├── 个人档案设置.html
│   ├── 浏览器扩展弹窗.html
│   ├── 新用户引导.html
│   ├── 营销主页.html
│   └── careermatch-ai.prototype.html
├── Feature Plan/              # 功能规划文档
│   ├── prd.md                # 产品需求文档
│   ├── user_flow.md          # 用户流程
│   ├── interaction_patterns.md  # 交互模式
│   └── *_screen_plan.md      # 各页面详细规划
├── Global Context/            # 全局上下文
│   ├── product_charter.md    # 产品章程
│   └── persona_*.md          # 用户画像
└── Style Guide/               # 设计规范
    └── ResumeAI优雅平衡.style-guide.md
```

**使用原则**：
- 🔍 开发前先查看对应的screen_plan.md
- 🎨 UI实现参考HTML设计文件
- 📋 功能需求参考Feature Plan文档
- 👤 用户体验参考persona文档

---

## ⚡ 开始开发

遵循此工作流，现在可以开始开发了：

```bash
# 1. 查看当前进度
cat docs/PROGRESS.md

# 2. 选择下一个任务
# 3. 使用TodoWrite创建任务列表
# 4. 开始开发
# 5. 实时更新文档
# 6. 提交代码和文档

# 重复直到项目完成！
```

---

**严格遵循此工作流，确保项目健康发展！** 🚀

*工作流版本: v1.0*
*最后更新: 2025-01-11*
