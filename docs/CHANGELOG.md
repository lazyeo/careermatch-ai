# 变更日志

所有重要变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/)。
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [Unreleased]

### 计划添加
- 申请追踪系统（Sprint 5）
- Google OAuth集成（Sprint 6）
- 简历PDF导出功能
- 浏览器扩展

---

## [0.5.0] - 2025-11-11

### Added - Sprint 4: AI智能匹配分析系统 ✅

#### OpenAI集成
- ✨ **OpenAI客户端配置** (`src/lib/openai.ts`)
  - 单例OpenAI客户端实例
  - 模型配置常量（GPT-4, GPT-4 Turbo, GPT-3.5 Turbo）
  - 温度预设（分析型、平衡型、创意型）
  - API配置检查函数
  - 统一错误处理机制

#### AI匹配分析API
- ✨ **匹配分析API路由** (`/api/jobs/[id]/analyze`)
  - `POST /api/jobs/[id]/analyze` - 执行AI分析
  - `GET /api/jobs/[id]/analyze?resumeId=xxx` - 获取已有分析
  - 分析结果自动缓存（避免重复调用OpenAI）
  - 完整的用户认证和权限检查
  - OpenAI配置状态验证

#### 9维度匹配分析
- ✨ **智能匹配算法**
  - 角色定位匹配度（Role Alignment）
  - 技能匹配度（Skills Match）
  - 经验水平匹配（Experience Level）
  - 教育背景匹配（Education Background）
  - 行业契合度（Industry Fit）
  - 软技能评估（Soft Skills）
  - 文化契合度（Cultural Fit）
  - 成长潜力（Growth Potential）
  - 薪资期望匹配（Salary Expectation）
  - 每个维度0-100分评分 + 详细说明
  - 整体匹配度综合评分

#### AI分析展示页面
- ✨ **分析页面** (`/jobs/[id]/analysis`)
  - 简历选择流程
  - 分析触发按钮（带加载状态）
  - 完整的分析结果展示
  - 空状态处理（无简历提示）
  - 返回岗位详情导航

#### 雷达图可视化
- ✨ **雷达图组件** (`RadarChartComponent`)
  - 使用Recharts库
  - 9维度数据可视化
  - 交互式Tooltip
  - 维度详情展示
  - 响应式设计

#### 匹配分数展示
- ✨ **匹配分数卡片** (`MatchScoreCard`)
  - 大号分数徽章
  - 分数等级判定（强力推荐/值得尝试/有机会/不匹配）
  - 动态颜色编码
  - 整体匹配度说明

#### 优势与差距分析
- ✨ **优势差距组件** (`StrengthsGapsSection`)
  - 3-5个主要优势列表
  - 3-5个需要改进的差距
  - 图标可视化（绿色✓ vs 橙色⚠）
  - 并排对比展示

#### SWOT分析
- ✨ **SWOT矩阵组件** (`SWOTMatrix`)
  - 2×2矩阵布局
  - Strengths（优势）- 内部积极因素
  - Weaknesses（劣势）- 内部限制因素
  - Opportunities（机会）- 外部有利因素
  - Threats（威胁）- 外部挑战因素
  - 每个象限3-5个要点
  - 颜色编码和图标标识

#### 关键词匹配分析
- ✨ **关键词匹配表格** (`KeywordsTable`)
  - ATS关键词提取
  - 简历中包含/缺失标识
  - 关键词重要性分级（高/中/低）
  - 优化建议和上下文
  - 匹配率统计
  - 智能排序（已匹配优先 + 重要性排序）

#### 交互组件
- ✨ **分析按钮** (`AnalyzeButton`)
  - 触发AI分析
  - 加载状态动画
  - 错误处理和提示
  - 自动刷新结果
- ✨ **简历选择器** (`ResumeSelector`)
  - 卡片式简历列表
  - 更新时间显示
  - 点击选择交互
  - 友好的空状态

#### 岗位详情页集成
- 🔄 **更新岗位详情页** (`/jobs/[id]`)
  - 移除"即将上线"占位符
  - 添加"开始AI分析"按钮
  - 链接到分析页面
  - 功能介绍说明

### Technical Details

**User Stories完成**:
- ✅ US-4.1: 简历与岗位匹配度计算 (8 points)
- ✅ US-4.2: 9维度分析展示 (8 points)
- ✅ US-4.4: 优势和差距识别 (3 points)
- ✅ US-4.5: 关键词匹配分析 (5 points)
- **Sprint 4总计**: 24/24 Story Points完成 (100%)

**技术实现**:
- OpenAI GPT-4集成（智能prompt工程）
- JSON响应格式化（`response_format: json_object`）
- 温度控制（0.3分析型 - 确保一致性）
- Recharts雷达图可视化
- 分析结果数据库缓存（避免重复调用）
- TypeScript完整类型定义
- Server Components + Client Components混合架构

**API设计**:
- POST `/api/jobs/[id]/analyze` - 执行分析（15-30秒）
- GET `/api/jobs/[id]/analyze?resumeId=xxx` - 获取缓存
- 自动Supabase RLS权限检查
- OpenAI配置状态验证
- 详细错误信息返回

**数据模型**:
```typescript
job_analyses {
  id: uuid
  job_id: uuid
  resume_id: uuid
  match_score: integer (0-100)
  dimensions: jsonb[]
  strengths: text[]
  gaps: text[]
  swot: jsonb
  keywords: jsonb[]
  created_at: timestamp
}
```

**9维度定义**:
1. 角色定位 - 候选人经验与岗位角色的对齐度
2. 技能匹配 - 技术和软技能的符合程度
3. 经验水平 - 工作经验年限和深度匹配
4. 教育背景 - 学历和专业相关性
5. 行业契合 - 行业经验和领域知识
6. 软技能 - 沟通、团队协作、领导力
7. 文化契合 - 与公司价值观和文化的匹配（推断）
8. 成长潜力 - 学习能力和职业发展轨迹
9. 薪资期望 - 期望薪资与岗位薪资的对齐

**性能优化**:
- 分析结果缓存（同job+resume组合不重复分析）
- 异步分析执行（15-30秒响应时间）
- 前端加载状态提示
- 数据库索引优化

**已知限制**:
- ⚠️ 需要配置OPENAI_API_KEY才能使用
- ⚠️ GPT-4调用成本较高（约$0.03-0.06/次分析）
- ⚠️ 分析时间15-30秒（取决于简历和岗位复杂度）

### Changed
- 🔄 更新 `apps/web/package.json` - 添加openai依赖
- 🔄 更新岗位详情页 - 集成AI分析入口

### Fixed
- 🐛 修复类型导入问题 - 使用@careermatch/shared统一类型

---

## [0.4.0] - 2025-11-11

### Added - Sprint 3: 岗位管理系统 ✅

#### 岗位列表页面
- ✨ **岗位管理中心** (`/jobs`)
  - 显示所有岗位卡片（卡片式布局）
  - 实时统计（岗位总数、已保存、已申请、面试中）
  - 空状态提示（暂无岗位时）
  - 快速操作按钮（查看、编辑、删除）
  - 岗位状态徽章（6种颜色编码）
  - 岗位信息预览（地点、类型、薪资）
  - 从仪表盘可直接访问

#### 岗位添加功能
- ✨ **添加新岗位页面** (`/jobs/new`)
  - 完整的表单验证（React Hook Form + Zod）
  - 基本信息（岗位标题*、公司名称*、地点、类型、状态）
  - 薪资信息（最低/最高薪资、货币选择）
  - 岗位详情（描述、要求、福利）
  - 其他信息（来源链接、发布日期、截止日期）
  - 自动保存提示
  - 创建成功后跳转到列表

#### 岗位查看功能
- ✨ **岗位详情页面** (`/jobs/[id]`)
  - 美观的卡片式布局
  - 显示所有岗位章节
    - 基本信息（标题、公司、地点、类型、薪资、来源）
    - 岗位描述
    - 岗位要求
    - 福利待遇
    - 时间信息（发布日期、截止日期）
  - 顶部操作栏（编辑、返回列表）
  - 状态徽章显示
  - AI匹配分析预览卡片（Sprint 4提示）

#### 岗位编辑功能
- ✨ **编辑岗位页面** (`/jobs/[id]/edit`)
  - 预填充现有数据
  - 与创建页面相同的表单组件
  - 保存修改后跳转回列表
  - 顶部操作栏（查看详情、返回列表）

#### 岗位删除功能
- ✨ **删除确认机制**
  - 两步确认（点击删除 → 显示确认按钮）
  - 删除中状态显示
  - 删除成功后刷新列表
  - 防止误删除

#### API路由
- ✨ **岗位CRUD API**
  - `POST /api/jobs` - 创建岗位
  - `GET /api/jobs` - 获取用户所有岗位
  - `GET /api/jobs/[id]` - 获取单个岗位
  - `PATCH /api/jobs/[id]` - 更新岗位
  - `DELETE /api/jobs/[id]` - 删除岗位
  - 所有API都有RLS保护
  - 返回适当的HTTP状态码

#### 仪表盘集成
- ✨ **仪表盘更新**
  - 岗位管理卡片可点击跳转
  - 实时显示岗位数量统计
  - 4个统计卡片（岗位总数、已保存、已申请、面试中）
  - Sprint进度提示更新为"Sprint 3 完成"

### Technical Details

**User Stories完成**:
- ✅ US-3.1: 手动添加岗位 (3 points)
- ✅ US-3.3: 岗位列表查看 (3 points)
- ✅ US-3.5: 岗位详情查看 (5 points)
- ✅ US-3.6: 岗位状态管理 (3 points)
- **Sprint 3总计**: 14/19 Story Points完成 (74%)
- **注**: US-3.4 (筛选搜索) 延后到后续优化

**测试覆盖**:
- ✅ 岗位列表显示（空状态 + 有数据）
- ✅ 添加岗位流程（表单验证 + 提交）
- ✅ 查看岗位详情
- ✅ 编辑岗位并保存
- ✅ 删除岗位（带确认）
- ✅ 仪表盘集成和导航
- ✅ 6种岗位状态管理
- 所有测试使用Chrome DevTools MCP工具验证

**技术实现**:
- React Hook Form + Zod实现类型安全的表单验证
- Next.js Server Components + Client Components混合架构
- Supabase RLS确保数据安全
- 6种岗位状态：已保存、已申请、面试中、已拒绝、已录用、已撤回
- 完整的表单字段验证和错误处理

**API请求验证**:
- POST `/api/jobs` → 201 Created
- GET `/api/jobs` → 200 OK
- GET `/api/jobs/[id]` → 200 OK
- PATCH `/api/jobs/[id]` → 200 OK
- DELETE `/api/jobs/[id]` → 200 OK

**已知问题**:
- 岗位筛选和搜索功能延后到后续优化
- AI匹配分析功能延后到Sprint 4实现

### Changed
- 🔄 更新 `apps/web/src/app/dashboard/page.tsx` - 启用岗位管理卡片和统计
- 🔄 更新Sprint进度提示为"Sprint 3 完成"

---

## [0.3.0] - 2025-11-11

### Added - Sprint 2: 简历管理系统 ✅

#### 简历列表页面
- ✨ **简历管理中心** (`/resumes`)
  - 显示所有简历卡片
  - 实时统计（简历总数、默认简历、最近更新）
  - 空状态提示（暂无简历时）
  - 快速操作按钮（查看、编辑、删除）
  - 从仪表盘可直接访问

#### 简历创建功能
- ✨ **创建新简历页面** (`/resumes/new`)
  - 完整的表单验证（React Hook Form + Zod）
  - 动态表单数组（useFieldArray）
    - 技能列表（可添加/删除）
    - 工作经历列表（可添加/删除）
    - 教育背景列表（可添加/删除）
  - 个人信息（姓名、邮箱、电话、地点、LinkedIn、GitHub）
  - 职业目标（多行文本）
  - 自动保存提示
  - 创建成功后跳转到列表

#### 简历查看功能
- ✨ **简历详情页面** (`/resumes/[id]`)
  - 美观的卡片式布局
  - 显示所有简历章节
    - 个人信息
    - 职业目标
    - 技能（带熟练度标签）
    - 工作经历（时间线展示）
    - 项目经历
    - 教育背景
    - 证书
    - 兴趣爱好
  - 顶部操作栏（编辑、返回列表）
  - 版本信息显示

#### 简历编辑功能
- ✨ **编辑简历页面** (`/resumes/[id]/edit`)
  - 预填充现有数据
  - 与创建页面相同的表单组件
  - 保存修改后跳转回列表
  - 顶部操作栏（预览、返回列表）

#### 简历删除功能
- ✨ **删除确认机制**
  - 两步确认（点击删除 → 显示确认按钮）
  - 删除中状态显示
  - 删除成功后刷新列表
  - 防止误删除

#### API路由
- ✨ **简历CRUD API**
  - `POST /api/resumes` - 创建简历
  - `GET /api/resumes` - 获取用户所有简历
  - `GET /api/resumes/[id]` - 获取单个简历
  - `PATCH /api/resumes/[id]` - 更新简历
  - `DELETE /api/resumes/[id]` - 删除简历
  - 所有API都有RLS保护
  - 返回适当的HTTP状态码

#### 仪表盘集成
- ✨ **仪表盘更新**
  - 简历管理卡片可点击跳转
  - 实时显示简历数量统计
  - 岗位和申请卡片显示"敬请期待"
  - Sprint进度提示更新

### Technical Details

**User Stories完成**:
- ✅ US-2.2: 创建新简历 (5 points)
- ✅ US-2.3: 编辑简历内容 (8 points)
- ✅ US-2.5: 简历版本管理（基础） (部分完成)
- **Sprint 2总计**: 13/21 Story Points完成 (62%)

**测试覆盖**:
- ✅ 简历列表显示（空状态 + 有数据）
- ✅ 创建简历流程（表单验证 + 提交）
- ✅ 查看简历详情
- ✅ 编辑简历并保存
- ✅ 删除简历（带确认）
- ✅ 仪表盘集成和导航
- 所有测试使用Chrome DevTools MCP工具自动化执行

**技术实现**:
- React Hook Form + Zod实现类型安全的表单验证
- useFieldArray管理动态数组字段（技能、工作经历、教育）
- Next.js Server Components + Client Components混合架构
- Supabase RLS确保数据安全
- 乐观UI更新提升用户体验

**API请求验证**:
- POST `/api/resumes` → 201 Created
- GET `/api/resumes` → 200 OK
- GET `/api/resumes/[id]` → 200 OK
- PATCH `/api/resumes/[id]` → 200 OK
- DELETE `/api/resumes/[id]` → 200 OK

**已知问题**:
- 工作经历的日期选择器需要手动输入（type="month"的UX可以优化）
- PDF导出功能延后到Sprint 4实现

### Changed
- 🔄 更新 `apps/web/src/app/dashboard/page.tsx` - 添加简历统计和链接
- 🔄 更新进度提示为Sprint 2状态

### Fixed
- 🐛 修复表单数组删除功能（useFieldArray正确集成）

---

## [0.2.0] - 2025-11-11

### Added - Sprint 1: 用户认证系统 ✅

#### 认证页面
- ✨ **登录页面** (`/login`)
  - React Hook Form + Zod表单验证
  - 邮箱和密码登录
  - "记住我"功能
  - 错误提示处理
  - 自动跳转到仪表盘
- ✨ **注册页面** (`/register`)
  - 完整表单验证（姓名、邮箱、密码、确认密码）
  - 密码强度指示器（弱/中等/强）- 实时显示
  - 密码确认匹配验证
  - 服务条款同意checkbox
  - 注册成功后邮箱验证提示
  - 自动跳转到登录页

#### Supabase集成
- ✨ **浏览器端客户端** (`src/lib/supabase.ts`)
  - 使用localStorage进行会话管理
  - 单例模式避免重复创建
- ✨ **服务器端客户端** (`src/lib/supabase-server.ts`)
  - 使用cookies进行会话管理
  - 支持Server Components和API Routes
  - 便捷函数：`getCurrentUser()`, `getSession()`
- ✨ **环境变量配置** (`.env.local`)
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY

#### 仪表盘
- ✨ **仪表盘原型** (`/dashboard`)
  - 欢迎界面，显示用户姓名
  - 顶部导航栏（用户名 + 退出登录按钮）
  - 3个功能卡片（简历管理、岗位管理、申请追踪）
  - 4个统计卡片（简历数量、保存的岗位、申请中、面试安排）
  - 开发状态提示卡片

#### 认证保护
- ✨ **Next.js Middleware** (`src/middleware.ts`)
  - 自动刷新Supabase会话
  - 保护需要认证的路由（/dashboard, /resumes, /jobs, /applications）
  - 未登录访问受保护路由 → 重定向到登录页（带redirect参数）
  - 已登录访问登录/注册页 → 重定向到仪表盘
  - 登录后自动跳回原页面
- ✨ **退出登录API** (`/auth/signout`)
  - POST请求退出登录
  - 清除会话并重定向

#### 首页更新
- ✨ **动态导航按钮**
  - 未登录：显示"免费注册"和"登录"
  - 已登录：显示"进入仪表盘"

#### 文档
- ✨ **测试账号文档** (`docs/TEST_ACCOUNTS.md`)
  - 记录测试账号信息
  - 测试场景覆盖
  - 快速登录指南
  - **注意**: 已添加到.gitignore，不会提交到仓库

### Technical Details

**User Stories完成**:
- ✅ US-1.1: 用户注册 (3 points)
- ✅ US-1.2: 用户登录 (2 points)
- **Sprint 1总计**: 5/8 Story Points完成 (62.5%)

**测试覆盖**:
- ✅ 首页显示和导航测试
- ✅ 用户注册流程测试
- ✅ 用户登录流程测试
- ✅ 仪表盘访问测试
- ✅ 退出登录功能测试
- ✅ 认证保护机制测试
- 所有测试使用Chrome DevTools MCP工具自动化执行

**网络请求验证**:
- POST `/auth/v1/signup` → 200 OK
- POST `/auth/v1/token?grant_type=password` → 200 OK
- GET `/dashboard` → 200 OK (已登录)
- GET `/dashboard` → 307 Redirect to `/login?redirect=%2Fdashboard` (未登录)

**已知问题**:
- Supabase默认要求邮箱验证后才能登录
- `test@example.com` 被Supabase拒绝为无效邮箱（已解决，使用真实域名）

### Changed
- 🔄 更新 `apps/web/package.json` - 添加workspace依赖
- 🔄 更新 `apps/web/src/app/page.tsx` - 根据登录状态显示不同按钮
- 🔄 更新 `packages/ui/package.json` - 直接指向源码支持开发模式

### Fixed
- 🐛 修复Tailwind CSS配置 - 添加完整颜色系统（neutral, success, warning, error）
- 🐛 修复globals.css - 移除未定义的颜色类

---

## [0.1.0] - 2025-01-11

### Added
- ✨ **docs/USER_STORIES.md** - 完整的用户故事和开发计划文档
  - 3个详细的用户画像（应届毕业生、职业转换者、资深专业人士）
  - 8个Epic Stories涵盖所有主要功能
  - 40+个详细的User Stories，包含验收标准、技术任务、故事点和依赖关系
  - 6个Sprint计划（12周开发路线图）
  - 完整的依赖关系图（Mermaid格式）
  - 用户旅程地图和Story Mapping
  - 风险管理和成本预估

---

## [0.1.0] - 2025-01-11

### Added

#### 核心架构
- ✨ 初始化Monorepo架构（Turborepo + pnpm workspaces）
- ✨ 配置Next.js 14主应用（App Router + TypeScript）
- ✨ 配置Tailwind CSS设计系统（基于Paraflow）
- ✨ 配置Turborepo构建优化

#### UI组件库 (@careermatch/ui)
- ✨ Button组件（5种变体：default, primary, accent, outline, ghost）
- ✨ Card组件系列（Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter）
- ✨ SkillTag组件（支持3个熟练度级别）
- ✨ MatchScoreBadge组件（0-100分匹配度显示）
- ✨ 工具函数 cn() 用于类名合并

#### 类型库 (@careermatch/shared)
- ✨ Resume类型（简历数据结构）
- ✨ Job类型（岗位信息）
- ✨ Application类型（申请追踪）
- ✨ User类型（用户和偏好）
- ✨ 常量定义（岗位类型、状态、NZ城市等）

#### 数据库
- ✨ Supabase PostgreSQL Schema设计
  - profiles表（用户档案）
  - user_preferences表（求职偏好）
  - resumes表（简历）
  - jobs表（岗位）
  - job_analyses表（AI分析结果）
  - applications表（申请）
  - interviews表（面试）
- ✨ Row Level Security (RLS)策略
- ✨ 自动更新触发器
- ✨ 辅助函数（handle_new_user, get_application_stats）
- ✨ 索引优化

#### 文档
- ✨ README.md（项目介绍和快速开始）
- ✨ DEVELOPMENT.md（详细开发指南）
- ✨ CLAUDE.md（工作流规范）
- ✨ docs/PROGRESS.md（进度追踪）
- ✨ docs/CHANGELOG.md（变更日志）
- ✨ docs/DECISIONS.md（技术决策记录）
- ✨ packages/ui/README.md（UI组件库文档）

#### 配置文件
- ✨ .gitignore（Git忽略规则）
- ✨ turbo.json（Turborepo配置）
- ✨ pnpm-workspace.yaml（Workspace配置）
- ✨ tsconfig.json（TypeScript配置）
- ✨ tailwind.config.ts（Tailwind配置）
- ✨ next.config.js（Next.js配置）

#### Next.js应用
- ✨ 欢迎页面（包含3个功能卡片）
- ✨ 全局样式配置
- ✨ 字体配置（Inter）
- ✨ 响应式布局

### Technical Details

**技术栈**:
- Frontend: Next.js 14.0.4, React 18.2.0, TypeScript 5.3.3
- Styling: Tailwind CSS 3.4.0
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth
- AI: OpenAI API (待集成)
- Build: Turborepo 1.11.0
- Package Manager: pnpm 8.12.0

**架构决策**:
- Monorepo架构便于代码共享和版本管理
- Next.js App Router用于现代化的文件系统路由
- Supabase提供一体化后端服务（数据库+认证+存储）
- 混合AI策略（OpenAI + Cloudflare AI）平衡成本和性能

**开源策略**:
- packages/ui 计划开源 (MIT License)
- packages/resume-parser 计划开源（待开发）
- packages/ats-optimizer 计划开源（待开发）
- packages/job-scraper 计划开源（待开发）
- 核心业务逻辑保持私有

**代码统计**:
- 总提交数: 1
- 文件数: 79
- 代码行数: ~16,065行（含Paraflow设计文件）
- 包数: 4 (web, ui, shared, 及根包)

### Git

**仓库**: git@github.com:lazyeo/CareerMatch.git
**分支**: main
**提交**: 0ddab01

---

## 版本说明

### 版本号规则
- **0.x.x**: MVP开发阶段
- **1.0.0**: 正式版发布
- **主版本号**: 不兼容的API修改
- **次版本号**: 向下兼容的功能性新增
- **修订号**: 向下兼容的问题修正

### 变更类型
- **Added**: 新增功能
- **Changed**: 功能变更
- **Deprecated**: 即将废弃的功能
- **Removed**: 已移除的功能
- **Fixed**: Bug修复
- **Security**: 安全相关

---

*最后更新: 2025-01-11*
