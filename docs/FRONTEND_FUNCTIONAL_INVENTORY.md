# 前端功能与路由信息整理

用途：作为前端样式重构前的设计交接资料。本文只整理现有流程、功能、页面和路由事实，不包含视觉设计要求。

## 1. 奥卡姆剃刀后的结构结论

当前产品最精简的功能结构可以归纳为 6 个模块：

1. 账户与入口
2. 个人档案
3. 岗位管理与岗位分析
4. 简历与申请材料
5. 申请追踪
6. AI 助手与浏览器扩展

建议设计交接时优先围绕这 6 个模块组织页面，不按代码目录逐页照搬。原因是代码里存在一些重复入口、历史组件和未完成功能。

## 2. 重复、无效或需降级的信息

### 可合并的信息

- `/assistant` 独立页面和登录后右侧 Copilot 面板使用同一套聊天组件。它们是同一功能的两个入口，不应作为两套独立产品能力理解。
- `/resumes/[id]` 和 `/resumes/preview/[id]` 都是简历查看相关页面。前者是结构化数据详情，后者是最终版简历预览、打印和导出页面。
- 岗位详情页中 `JobSummary` 在“决策面板”上下文里出现了重复渲染，功能层面只需要保留一个“岗位点评/摘要”概念。
- 简历模块和个人档案模块都包含个人信息、经历、教育、技能、项目、证书。功能上应理解为：个人档案是长期主数据，简历是针对岗位生成或手动维护的材料版本。
- 岗位状态和申请状态不是同一套状态。岗位状态用于岗位队列，申请状态用于投递进度，不应混用。

### 当前有入口但功能不完整的信息

- `/jobs/import` 显示“链接导入”和“文本导入”，但前端解析逻辑始终先检查 URL；纯文本模式在当前实现中会因为没有 URL 而报错。因此“文本导入”目前不应作为稳定有效功能交接。
- `/profile/edit` 支持保存基本信息和职业摘要，也支持删除已有工作经历、教育、技能、项目、证书；但新增/编辑这些子资源目前只是 alert 占位提示。上传简历导入可以创建这些资料。
- 登录页有 `/forgot-password` 链接，但项目中没有对应页面。
- `/settings` 页面没有独立设置功能，会直接重定向到 `/profile/edit`。
- 浏览器扩展 side panel 的聊天回复是 mock；扩展当前有效核心能力是“在招聘网站保存岗位”。

### 代码存在但不是当前主流程的信息

- `OneClickProcessButton`、`useProcessJob`、`ProcessingStatusCard`、`/api/jobs/[id]/process-full` 形成“一键处理：分析岗位、生成简历、生成求职信”的任务流，但当前页面没有实际挂载入口。
- 旧版岗位分析组件和接口仍存在，例如基于指定简历的分析、流式分析、简历优化页等；当前 `/jobs/[id]/analysis` 主页面使用的是 V2 8 维度分析。
- `/test-db`、`/test/mock-jobs` 属于测试/开发入口，不进入设计交接范围。

## 3. 主要用户对象

- 用户：通过 Supabase 认证登录。
- 个人档案：长期职业资料，包括基本信息、职业摘要、目标岗位、工作经历、教育、技能、项目、证书。
- 岗位：用户保存或创建的目标岗位。
- 岗位分析：针对岗位和个人档案生成匹配判断、关键要求、风险、简历策略、面试准备。
- 简历：用户手动创建或基于分析生成的材料版本。
- 求职信：针对岗位生成的文本材料。
- 申请：用户把岗位和某份简历关联后创建的投递记录。
- AI 助手：聊天式求职助手，可结合当前上下文回答问题，也可上传简历文件。

## 4. 账户与入口

### `/`

首页。根据登录状态显示：

- 未登录：注册、登录入口。
- 已登录：进入仪表盘。
- 展示产品能力概览：简历生成、岗位匹配、申请追踪、浏览器扩展。

### `/login`

登录页。

- 邮箱密码登录。
- Google OAuth 登录。
- 表单校验和错误提示。
- 已登录用户会被中间件重定向到 `/dashboard` 或 redirect 参数指定页。

### `/register`

注册页。

- 姓名、邮箱、密码、确认密码、条款同意。
- 密码强度提示。
- Google OAuth 注册。
- 注册成功后进入仪表盘或提示邮箱验证后回到登录页。

### `/auth/callback` 与 `/auth/signout`

认证回调和退出登录路由。

## 5. 登录后基础框架

### 受保护路由

中间件保护以下路径：

- `/dashboard`
- `/jobs`
- `/resumes`
- `/applications`
- `/profile`
- `/assistant`

未登录访问会跳转到 `/login?redirect=当前路径`。

### 共享布局

`(authenticated)` 下的页面使用同一个 DashboardLayout：

- 左侧导航：仪表盘、我的机会、个人档案。
- 底部入口：语言切换、设置、退出登录。
- 右侧 Copilot 面板：可展开/收起的 AI 助手。

注意：简历管理和申请管理当前不是侧边栏主导航项，但可从仪表盘和业务流程进入。

## 6. 仪表盘

### `/dashboard`

登录后的概览页。

展示信息：

- 欢迎语。
- 三个主要入口：简历管理、岗位管理、申请追踪。
- 统计：简历数量、保存岗位数量、申请数量、面试安排数量。
- 如果存在申请记录，显示申请状态概览：已提交、审核中、面试安排、已获录取。
- 最近岗位数据有查询，但当前页面主要展示统计和入口。

## 7. 个人档案

### `/profile`

个人资料中心。

展示信息：

- 资料完成度百分比。
- 快捷入口：编辑资料、上传简历。
- 模块完成状态：基本信息、职业摘要、工作经历、教育、技能、项目、证书。
- 每个模块显示是否完成及记录数量。

完成度计算：

- 基本信息：20%
- 职业摘要：15%
- 工作经历：25%
- 教育：15%
- 技能：15%
- 项目：10%

### `/profile/edit`

个人资料编辑页。

当前有效能力：

- 编辑并保存基本信息：姓名、邮箱、电话、所在地、LinkedIn、GitHub、个人网站。
- 编辑并保存职业摘要、目标岗位。
- 查看工作经历、教育、技能、项目、证书。
- 删除已有工作经历、教育、技能、项目、证书。

当前不完整能力：

- 新增和编辑工作经历、教育、技能、项目、证书的交互是占位提示。

### `/profile/upload`

上传简历导入个人档案。

流程：

1. 上传 PDF、Word、TXT 文件，最大 10MB。
2. AI 解析简历内容。
3. 展示解析结果预览。
4. 用户选择要导入的部分。
5. 将选中内容导入个人档案。

可导入内容：

- 基本信息
- 工作经历
- 教育背景
- 技能
- 项目
- 证书

## 8. 岗位管理与岗位分析

### `/jobs`

岗位列表/工作区。

展示信息：

- 岗位总数、已保存、已申请、面试中、分析中的数量。
- 岗位按状态分区：收藏/准备中、已投递、面试中、已归档。
- 每个岗位卡片展示：标题、公司、来源链接、分析任务状态、地点、薪资、查看详情入口。

岗位状态：

- `saved`
- `applied`
- `interview`
- `rejected`
- `offer`
- `withdrawn`

分析任务状态：

- 等待分析
- 分析中
- 已分析
- 分析失败

### `/jobs/new`

手动创建岗位。

表单字段：

- 基本信息：标题、公司、地点、工作类型、岗位状态。
- 薪资信息：最低薪资、最高薪资、货币。
- 岗位详情：描述、要求、福利。
- 其他信息：来源链接、发布日期、申请截止日期。

创建岗位后会保存到岗位列表，并尝试排队自动分析任务。

### `/jobs/import`

智能导入岗位。

当前稳定流程：

1. 输入一个或多个招聘页面 URL。
2. 调用解析接口提取岗位信息。
3. 预览解析结果：标题、公司、地点、薪资、描述摘要。
4. 统一保存全部解析成功的岗位。
5. 保存后进入岗位列表。

注意：页面上存在“文本导入”模式，但当前纯文本模式不可视为稳定功能。

### `/jobs/[id]`

岗位详情页。

展示信息：

- 岗位标题、状态、公司、地点、工作类型、薪资、更新时间、来源链接。
- 可重新抓取岗位信息。
- 可编辑岗位。
- 可查看岗位原文。
- 可查看决策面板：岗位点评、最新分析结果、匹配分、分析任务状态。
- 可进入详细分析。
- 可生成求职信。
- 可创建申请记录。
- 如果已生成材料，展示关联简历和求职信。

主要动作：

- 重新抓取
- 编辑岗位
- 开始/重新开始分析
- 查看详细分析
- 生成求职信
- 创建申请

### `/jobs/[id]/edit`

编辑岗位。复用手动创建岗位表单。

### `/jobs/[id]/analysis`

当前主岗位分析页，使用 V2 8 维度分析。

流程：

1. 进入分析工作区。
2. 如果已有 V2 分析结果，直接展示。
3. 如果没有结果，用户启动分析。
4. 分析以流式方式展示进度。
5. 完成后展示分数、推荐等级、结论、8 维度详情。
6. 可重新分析。
7. 可选择简历模板并生成针对该岗位的简历。

8 维度内容包括：

- 匹配度评分
- 角色定位
- 核心职责覆盖
- 关键词匹配
- 关键要求
- SWOT
- CV 策略
- 面试准备

### `/jobs/[id]/analysis/optimize`

旧版简历优化页。

依赖查询参数：

- `resumeId`
- `sessionId`

流程：

1. 基于分析会话和指定简历请求 AI 优化。
2. 展示原始简历和优化后简历对比。
3. 用户确认后将优化内容写回原简历。

当前主分析页 V2 不直接使用这个流程。

### `/jobs/[id]/cover-letter`

岗位求职信生成页。

流程：

1. 页面加载时检查该岗位是否已有求职信。
2. 若已有，直接展示最新求职信。
3. 若没有，用户选择语气和语言。
4. AI 生成求职信并保存。
5. 用户可以复制或下载 txt。

语气选项：

- professional
- friendly
- formal

语言选项：

- 英文
- 中文

## 9. 简历与申请材料

### `/resumes`

简历列表。

展示信息：

- 简历总数。
- 默认简历数量。
- 最近更新时间。
- 简历卡片：标题、默认标记、版本、创建时间、更新时间。

主要动作：

- 创建新简历。
- 查看简历详情。
- 编辑简历。
- 删除简历。

### `/resumes/new`

手动创建简历。

表单内容：

- 简历标题。
- 个人信息：姓名、邮箱、电话、地点、LinkedIn、GitHub。
- 职业目标。
- 技能。
- 工作经历。
- 教育背景。

注意：类型定义包含项目、证书、兴趣，但当前表单主要实现个人信息、职业目标、技能、工作经历、教育。

### `/resumes/[id]`

结构化简历详情页。

展示内容：

- 个人信息。
- 职业目标。
- 技能。
- 工作经历。
- 项目。
- 教育。
- 证书。
- 兴趣。

主要动作：

- 导出 PDF。
- 编辑。
- 返回列表。

### `/resumes/[id]/edit`

编辑简历。复用手动创建简历表单。

### `/resumes/preview/[id]`

最终版简历预览页。

功能：

- 按简历模板渲染 A4 预览。
- 支持单栏和双栏模板布局。
- 显示当前模板名称。
- 打印。
- 导出 PDF。
- 导出 Word。
- 进入编辑页。

支持的模板来源：

- 简历自带 `template_id`。
- 无模板时使用默认模板配置。

### 简历模板选择

模板选择器当前在岗位 V2 分析完成后触发，用于“选择模板并生成简历”。

内置模板：

- Modern Blue
- Classic Serif
- Creative Gradient
- Executive Minimal
- Tech Engineer
- Finance Analyst
- Creative Designer
- Technical Dark

支持按风格过滤：

- modern
- classic
- creative
- professional

## 10. 申请追踪

### `/applications`

申请列表与状态概览。

展示信息：

- 总申请数。
- 进行中数量。
- 面试安排数量。
- 已获录取数量。
- 状态分布。
- 申请卡片列表。

申请状态：

- `draft`
- `submitted`
- `under_review`
- `interview_scheduled`
- `offer_received`
- `rejected`
- `withdrawn`
- `accepted`

创建申请入口：

- 从岗位详情页创建。
- 从申请列表空状态或按钮回到岗位列表。

### `/applications/[id]`

申请详情页。

展示信息：

- 关联岗位标题、公司、地点。
- 当前申请状态。
- 状态管理下拉框。
- 申请时间线。
- 备注。
- 岗位描述、要求、福利。
- 申请信息：创建时间、更新时间、时间线事件数量。
- 使用的简历。
- 岗位摘要信息。

主要动作：

- 更新申请状态。
- 查看关联岗位。
- 查看使用的简历。
- 查看 AI 分析。
- 删除申请。

### 从岗位创建申请

入口：岗位详情页的申请按钮。

流程：

1. 打开创建申请弹窗。
2. 加载用户简历列表。
3. 用户选择一份简历。
4. 选择申请状态：草稿或已提交。
5. 可填写备注。
6. 创建后跳转到申请详情页。

限制：

- 创建申请必须关联岗位和简历。
- 同一个岗位重复创建申请会返回冲突错误。

## 11. AI 助手

### 右侧 Copilot 面板

登录后布局内提供可收起的右侧 AI 助手。

能力：

- 聊天。
- 流式回复。
- 停止生成。
- 根据当前上下文回答问题。
- 识别岗位分析意图，并跳转到对应岗位分析页。
- 上传 PDF、Word、TXT 简历文件进行解析。
- 展示建议问题。

### `/assistant`

独立 AI 助手页面。

功能与 Copilot 面板共享同一个聊天组件。

## 12. 浏览器扩展

扩展技术栈：Plasmo。

### 注入范围

- SEEK：`seek.co.nz`、`seek.com.au`
- LinkedIn：`linkedin.com`
- 通用招聘页面：通过 Schema.org `JobPosting` 或 URL/页面关键词判断

### 当前有效功能：保存岗位

流程：

1. 在招聘页面注入“Save to CareerMatch”按钮。
2. 自动检测当前岗位 URL 和页面内容。
3. 自动展开部分“Show more / Read more”内容。
4. 提取岗位 HTML 和 canonical URL。
5. 通过后台脚本读取 Web 应用登录 cookie 中的 Supabase token。
6. 调用 Web 应用 `/api/jobs/import`，传入 content、url、`save_immediately: true`。
7. 保存成功后在扩展本地记录该岗位已保存。
8. 同一岗位再次访问时显示 Already Saved。

### 扩展其他界面

- Popup：只显示扩展已启用状态和版本。
- Side panel：展示岗位上下文和聊天界面，但当前 AI 回复是 mock，不是稳定业务能力。

## 13. 主要 API 能力映射

### 岗位

- `GET /api/jobs`：获取用户岗位列表。
- `POST /api/jobs`：手动创建岗位，并尝试排队自动分析。
- `PATCH /api/jobs/[id]`：更新岗位。
- `DELETE /api/jobs/[id]`：删除岗位。
- `POST /api/jobs/import`：从 URL 或内容解析岗位；可选择立即保存。
- `POST /api/jobs/[id]/rescrape`：重新抓取岗位。
- `POST /api/jobs/[id]/analyze-v2/stream`：V2 流式分析。
- `GET /api/jobs/[id]/analyze-v2`：读取 V2 分析数据。
- `POST /api/jobs/[id]/cover-letter`：为岗位生成求职信。

### 简历

- `GET /api/resumes`：获取简历列表。
- `POST /api/resumes`：创建简历。
- `GET /api/resumes/[id]`：获取单份简历。
- `PATCH /api/resumes/[id]`：更新简历。
- `DELETE /api/resumes/[id]`：删除简历。
- `POST /api/resumes/generate-v2`：基于 V2 分析和模板生成简历。
- `GET /api/resumes/[id]/export-pdf`：导出 PDF。
- `GET /api/resumes/[id]/export-docx`：导出 Word。
- `GET /api/resumes/[id]/export`：按 format/template 导出 HTML 或 PDF。

### 个人档案

- `GET /api/profile`：获取完整个人档案。
- `PUT /api/profile`：更新基本信息和职业摘要。
- `/api/profile/work`
- `/api/profile/education`
- `/api/profile/skills`
- `/api/profile/projects`
- `/api/profile/certifications`

上述子资源接口支持后台 CRUD，但前端编辑页的新增/编辑 UI 尚未完整接入。

### 简历上传

- `POST /api/resume-upload`：上传并解析简历文件。
- `POST /api/resume-upload/[id]/apply`：将解析结果应用到个人档案。

### 申请

- `GET /api/applications`：获取申请列表。
- `POST /api/applications`：创建申请。
- `PATCH /api/applications/[id]`：更新申请状态等。
- `DELETE /api/applications/[id]`：删除申请。

### AI 助手

- `POST /api/assistant/stream`：AI 助手流式回复。
- `POST /api/assistant/chat`：非流式聊天接口。

### 任务状态

- `GET /api/tasks/[id]/status`：查询后台处理任务状态。

## 14. 精简后的设计交接信息架构

### 一级模块

1. 仪表盘
2. 岗位
3. 个人档案
4. 简历
5. 申请
6. AI 助手

### 关键业务链路

链路 A：从招聘网站保存岗位

1. 用户在 SEEK、LinkedIn 或通用招聘页看到岗位。
2. 点击扩展保存按钮。
3. 系统解析并保存岗位。
4. 自动排队岗位分析。
5. 用户回到 Web 应用查看岗位和分析结果。

链路 B：从 Web 应用导入岗位

1. 用户进入岗位导入页。
2. 粘贴招聘 URL。
3. 预览解析结果。
4. 保存岗位。
5. 查看岗位详情和分析状态。

链路 C：判断岗位是否值得申请

1. 用户打开岗位详情。
2. 查看岗位原文和岗位点评。
3. 查看或启动 V2 分析。
4. 获取匹配分、推荐等级、关键差距、CV 策略和面试建议。
5. 决定是否生成材料或创建申请。

链路 D：生成申请材料

1. 用户在分析结果页选择简历模板。
2. 系统生成针对该岗位的简历。
3. 用户进入简历预览页。
4. 用户导出 PDF/Word 或继续编辑。
5. 用户在岗位详情页生成求职信。

链路 E：创建并追踪申请

1. 用户在岗位详情页点击创建申请。
2. 选择简历。
3. 选择草稿或已提交。
4. 添加备注。
5. 进入申请详情页。
6. 后续更新申请状态并查看时间线。

链路 F：完善个人档案

1. 用户进入个人档案。
2. 查看完成度和缺失模块。
3. 选择手动编辑基本信息/摘要，或上传简历。
4. 上传简历后预览解析结果。
5. 选择要导入的资料部分。
6. 资料用于岗位分析和材料生成。

## 15. 当前可交接给设计师的最小页面清单

必须覆盖：

- 首页
- 登录
- 注册
- 仪表盘
- 个人档案概览
- 个人档案编辑
- 简历上传与解析预览
- 岗位列表
- 岗位导入
- 岗位创建/编辑
- 岗位详情
- 岗位 V2 分析
- 求职信生成
- 简历列表
- 简历创建/编辑
- 简历结构化详情
- 简历最终预览/导出
- 申请列表
- 申请详情
- AI 助手/Copilot
- 浏览器扩展保存岗位按钮状态

可降级或暂不单独设计：

- 设置页：当前只是跳转到个人档案编辑。
- 旧版分析/简历优化页：不是当前主分析链路。
- 一键处理任务流：代码存在但当前未挂载。
- 扩展 side panel 聊天：当前是 mock。
- 测试路由。

## 16. 样式重构实施状态

更新时间：2026-05-27

已完成：

- 已将 `docs/CareerMatch/styles.css` 的 Warm Studio 核心 token 迁移到 `apps/web/src/app/globals.css`。
- 已将 Tailwind 的 primary/accent、surface、ink、line、radius、shadow、font 映射到 CSS variables。
- 已重构 `@careermatch/ui` 的 `Button`、`Card`、`MatchScoreBadge`、`SkillTag`，并新增 `Badge`、`ProgressBar`、`ScoreRing`、`Segmented`、`Field`、`EmptyState`。
- 已将 authenticated app shell、侧边导航、移动顶部栏、语言切换和 Copilot 面板外观迁移到 Warm Studio 风格。
- 导航入口已补齐真实可用主入口：Dashboard、Opportunities、Applications、Resumes、Profile、AI Copilot、Settings。
- 已完成公开入口 `/`、`/login`、`/register` 的 Warm Studio 迁移；CTA 仅保留登录、注册、Dashboard 等真实路由，移除未接通的 extension/forgot-password/terms/privacy 链接承诺。
- 已完成 Dashboard、Jobs、Job Import、Job Create/Edit、Job Detail 的页面级迁移；岗位导入 UI 仅展示当前后端支持的 URL 导入。
- 已完成 Analysis V2、Resume Optimize、Cover Letter 的主要状态迁移；保留现有 streaming、resume selector、provider selector、重新分析和生成 API。
- 已完成 Resumes、Resume Create/Edit/Detail、Applications、Application Detail、Profile、Profile Edit、Profile Upload、Assistant 的页面级迁移。
- 已补齐核心页面的空状态、加载态、错误态、表单控件、badge/score/progress 视觉一致性，并处理登录/注册条款文案的可访问性空格。

验证结果：

- `pnpm --filter web type-check` 通过。
- `pnpm --filter web lint` 通过，0 warnings / 0 errors。
- `pnpm --filter web build` 通过；仍存在基线已知提示：Browserslist/baseline-browser-mapping 数据陈旧，以及 `/api/profile`、`/api/templates` 在构建期因 `cookies` 触发 Next dynamic server usage 提示。
- Playwright 验证 `/`、`/login`、`/register` 可渲染，未登录访问 `/dashboard` 会跳转到 `/login?redirect=%2Fdashboard`。

备注：

- 未接真实会话和 Supabase 数据时，authenticated 内页只能通过编译和未登录跳转验证；需要真实登录态才能做端到端 CRUD/生成流程验证。
- `components/templates/**`、部分旧分析内部展示组件仍保留局部历史 utility class，但主要路由外壳和当前主流程已经统一到 Warm Studio token 与 shared primitives。
