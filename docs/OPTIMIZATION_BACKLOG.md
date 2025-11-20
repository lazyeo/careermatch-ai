# 优化任务清单

> **文档目的**: 记录待优化的功能和改进项，按优先级排序
> **创建日期**: 2025-11-20
> **维护者**: 开发团队

---

## 📊 优化项总览

| 分类 | 待办数量 | 优先级分布 |
|------|---------|-----------|
| 用户体验优化 | 1 | P2: 1 |
| 功能增强 | 3 | P0: 1, P1: 2 |
| 性能优化 | 3 | P2: 3 |
| 开发体验 | 2 | P3: 2 |

**总计**: 9 个优化项

---

## 🔥 P0 - 高优先级（必须完成）

### 1. 简历 PDF 导出功能

**来源**: Sprint 6 计划
**当前状态**: 未开始
**预计工作量**: 6 小时

#### 需求描述
用户需要能够将简历导出为专业的 PDF 文件，用于直接投递或打印。

#### 技术方案
```bash
# 依赖安装
pnpm add @react-pdf/renderer

# 实现文件
- apps/web/src/components/ResumePDF.tsx
- apps/web/src/app/resumes/[id]/page.tsx (添加下载按钮)
```

#### 实现要点
- [x] 安装 @react-pdf/renderer
- [ ] 创建 PDF 模板组件
- [ ] 设计美观的 PDF 布局
- [ ] 映射简历所有字段到 PDF
- [ ] 处理中文字体显示
- [ ] 支持多页分页
- [ ] 添加"下载 PDF"按钮
- [ ] 测试不同长度的简历

#### 验收标准
- [ ] PDF 正确生成无错误
- [ ] 中文显示正常
- [ ] 布局美观专业
- [ ] 支持长简历自动分页
- [ ] 下载文件名合理（如：张三-全栈工程师简历.pdf）

#### 参考资料
- 详细实现计划：`docs/SPRINT_6_PLAN.md` (Task 2)
- React-PDF 文档：https://react-pdf.org/

---

## ⚡ P1 - 中优先级（尽快完成）

### 2. 岗位搜索和筛选功能

**来源**: Sprint 6 计划
**当前状态**: 未开始
**预计工作量**: 4 小时

#### 需求描述
用户需要能够在岗位列表页面搜索和筛选岗位，快速找到目标岗位。

#### 功能要点
- [ ] **搜索框**: 搜索岗位标题、公司名称
- [ ] **筛选器**:
  - 岗位状态（已保存、已申请、面试中等）
  - 岗位类型（全职、兼职、合同等）
  - 薪资范围（最小值、最大值）
  - 发布日期/截止日期
- [ ] **排序功能**:
  - 最近更新
  - 最近添加
  - 截止日期
  - 薪资范围

#### 技术实现
```typescript
// Supabase 全文搜索
const { data } = await supabase
  .from('jobs')
  .select('*')
  .or(`title.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%`)
  .eq('status', filterStatus)
  .order(sortBy, { ascending: false })
```

#### 验收标准
- [ ] 搜索实时响应（< 500ms）
- [ ] 筛选器逻辑正确
- [ ] 支持多条件组合筛选
- [ ] 空结果时友好提示
- [ ] 可清除筛选条件

#### 参考资料
- 详细计划：`docs/SPRINT_6_PLAN.md` (Task 3)

---

### 3. OpenAI API Key 配置和测试

**来源**: Sprint 6 计划
**当前状态**: 未配置
**预计工作量**: 1 小时

#### 需求描述
配置 OpenAI API Key 以启用 AI 智能匹配分析功能。

#### 任务清单
- [ ] 获取 OpenAI API Key
- [ ] 在 Vercel 添加环境变量 `OPENAI_API_KEY`
- [ ] 重新部署应用
- [ ] 测试 AI 分析功能
- [ ] 验证 9 维度分析正确
- [ ] 验证 SWOT 分析正确
- [ ] 验证关键词匹配正确

#### 注意事项
- ⚠️ API Key 敏感信息，不要提交到代码仓库
- ⚠️ 监控 API 调用量和成本
- 💡 建议配置 rate limiting

---

## 🎨 P2 - 低优先级（体验优化）

### 4. 申请状态更新反馈优化

**来源**: E2E 测试报告
**当前状态**: 功能正常，缺少反馈
**预计工作量**: 30 分钟

#### 问题描述
在申请详情页更新状态时，缺少即时的用户反馈，导致用户不确定操作是否成功。

#### 现状
```
用户操作：点击状态下拉选项
当前反馈：❌ 无明显提示
用户感受：😕 不确定是否成功
```

#### 改进方案（三选一）

**方案 A: Toast 通知（推荐）✨**
```typescript
// 在 StatusUpdater 组件中添加
import { toast } from 'sonner' // 或使用其他 toast 库

const handleStatusChange = async (newStatus: string) => {
  try {
    setIsUpdating(true)
    await updateStatus(newStatus)
    toast.success(`状态已更新为: ${statusLabels[newStatus]}`)
    router.refresh()
  } catch (error) {
    toast.error('更新失败，请重试')
  } finally {
    setIsUpdating(false)
  }
}
```

**方案 B: 加载状态指示器**
```typescript
{isUpdating && (
  <div className="flex items-center gap-2">
    <Spinner size="sm" />
    <span>更新中...</span>
  </div>
)}
```

**方案 C: 乐观 UI 更新**
```typescript
// 先更新 UI
setLocalStatus(newStatus)
// 再调用 API
await updateStatus(newStatus)
```

#### 实现文件
- `apps/web/src/app/applications/components/StatusUpdater.tsx`
- `apps/web/src/app/applications/[id]/page.tsx`

#### 验收标准
- [ ] 点击状态后有明显的反馈
- [ ] 更新成功显示成功提示
- [ ] 更新失败显示错误提示
- [ ] 下拉菜单自动关闭
- [ ] 页面数据自动刷新
- [ ] 时间线立即显示新事件

#### 依赖
```bash
# 如使用 sonner toast
pnpm add sonner
```

---

### 5. 页面加载性能优化

**来源**: 性能监控建议
**当前状态**: 良好，可优化
**预计工作量**: 4 小时

#### 优化目标
将页面加载时间从 < 2s 优化到 < 1s

#### 优化点

**5.1 图片优化**
- [ ] 使用 Next.js Image 组件
- [ ] 配置图片 CDN
- [ ] 添加懒加载
- [ ] 使用 WebP 格式

**5.2 代码分割**
```typescript
// 使用动态导入
const AnalysisPage = dynamic(() => import('./AnalysisPage'), {
  loading: () => <Spinner />
})
```

**5.3 API 响应缓存**
```typescript
// 添加 SWR 或 React Query
import useSWR from 'swr'

const { data, error } = useSWR('/api/jobs', fetcher, {
  revalidateOnFocus: false,
  dedupingInterval: 60000 // 1 分钟内不重复请求
})
```

**5.4 Supabase 查询优化**
```typescript
// 只查询需要的字段
.select('id, title, company, status')
// 而不是
.select('*')
```

#### 验收标准
- [ ] 首页加载 < 1s
- [ ] API 响应 < 500ms
- [ ] Lighthouse 性能分数 > 90

---

### 6. 删除操作测试和优化

**来源**: 测试清单未覆盖
**当前状态**: 功能存在，未测试
**预计工作量**: 2 小时

#### 需要测试的删除功能
- [ ] 删除简历
- [ ] 删除岗位
- [ ] 删除申请

#### 测试要点
- [ ] 删除确认对话框显示
- [ ] 确认后成功删除
- [ ] 数据从数据库移除
- [ ] 关联数据处理正确（级联删除）
- [ ] 列表自动刷新
- [ ] 统计数据更新

#### 可能需要优化的地方
- [ ] 添加"撤销删除"功能（软删除）
- [ ] 删除前显示影响范围提示
- [ ] 批量删除功能

---

## 🔧 P3 - 未来增强（可选）

### 7. Vercel Analytics 集成

**预计工作量**: 30 分钟

#### 目的
监控生产环境的性能和用户行为

#### 任务清单
- [ ] 在 Vercel 项目中启用 Analytics
- [ ] 启用 Speed Insights
- [ ] 配置 Web Vitals 监控
- [ ] 设置错误追踪（可选：集成 Sentry）

#### 监控指标
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- Time to First Byte (TTFB)

---

### 8. 自定义域名配置

**预计工作量**: 1 小时

#### 任务清单
- [ ] 购买域名（如：careermatch-ai.com）
- [ ] 在 Vercel 添加自定义域名
- [ ] 配置 DNS 记录
- [ ] 更新 Supabase Site URL
- [ ] 更新 Google OAuth 回调 URL
- [ ] 测试自定义域名访问

---

### 9. 退出登录功能测试

**来源**: 测试清单未覆盖
**预计工作量**: 15 分钟

#### 测试清单
- [ ] 点击"退出登录"按钮
- [ ] 验证会话清除
- [ ] 验证跳转到登录页
- [ ] 验证无法访问受保护页面
- [ ] 验证 Cookie 清除

---

## 🗓️ 建议实施顺序

### Sprint 6 Part 2（2-3 天）
**目标**: 完成核心功能增强

1. **Day 1 上午**: 简历 PDF 导出（P0）- 6 小时
2. **Day 1 下午**: OpenAI API Key 配置（P1）- 1 小时
3. **Day 2 上午**: 岗位搜索筛选（P1）- 4 小时
4. **Day 2 下午**: 状态更新反馈优化（P2）- 30 分钟
5. **Day 2 下午**: 删除功能测试（P2）- 2 小时

### Sprint 7（按需）
**目标**: 性能优化和监控

1. 页面性能优化（P2）
2. Vercel Analytics 集成（P3）
3. 自定义域名配置（P3）

---

## 📊 进度追踪

### 当前状态（2025-11-20）

| 优先级 | 总数 | 已完成 | 进行中 | 待开始 |
|-------|------|--------|--------|--------|
| P0 | 1 | 0 | 0 | 1 |
| P1 | 2 | 0 | 0 | 2 |
| P2 | 3 | 0 | 0 | 3 |
| P3 | 3 | 0 | 0 | 3 |
| **合计** | **9** | **0** | **0** | **9** |

**完成率**: 0% (0/9)

---

## 🎯 预期成果

### Sprint 6 Part 2 完成后
- ✅ 简历可导出为专业 PDF
- ✅ AI 智能匹配分析可用
- ✅ 岗位搜索筛选流畅
- ✅ 状态更新体验完美
- 📈 用户体验评分: 4.8 → **5.0**

### 全部优化完成后
- ✅ 所有 P0-P2 项目完成
- ✅ 页面加载时间 < 1s
- ✅ 性能监控已启用
- ✅ 生产环境完全优化
- 📈 总体评分: 4.8 → **5.0**

---

## 📝 维护日志

| 日期 | 操作 | 说明 |
|------|------|------|
| 2025-11-20 | 创建文档 | 基于 E2E 测试结果和 Sprint 6 计划创建初始版本 |

---

**下次更新**: 完成任何优化项后更新此文档

*文档版本: v1.0*
*最后更新: 2025-11-20*
