# Sprint 6 开发计划

> **创建日期**: 2025-11-12
> **规划周期**: 2天（快速增强 + 生产部署）
> **目标**: 完善用户体验 + 部署到生产环境

---

## 🎯 Sprint目标

### 主要目标
1. ✨ 添加3个高价值功能（Google OAuth、PDF导出、搜索筛选）
2. 🚀 部署到Vercel生产环境
3. 📊 获得真实用户反馈
4. 🔧 修复部署后发现的问题

### 成功标准
- [x] Sprint 5功能100%完成并测试通过
- [ ] Google OAuth集成完成
- [ ] 简历PDF导出功能完成
- [ ] 岗位搜索筛选完成
- [ ] 应用成功部署到Vercel
- [ ] 生产环境测试通过

---

## 📅 详细时间表

### Day 1 - 功能增强（2025-11-12）

#### 上午 (09:00 - 13:00) - 4小时

**任务1: Google OAuth集成** (2小时)
```
09:00 - 09:30  配置Supabase OAuth
09:30 - 10:00  获取Google OAuth凭证
10:00 - 10:30  更新登录/注册页面UI
10:30 - 11:00  测试OAuth流程
```
- [ ] Supabase Dashboard配置Google Provider
- [ ] Google Cloud Console创建OAuth应用
- [ ] 更新`/login`和`/register`页面
- [ ] 测试完整OAuth流程
- [ ] 处理OAuth回调和错误

**任务2: 开始简历PDF导出** (2小时)
```
11:00 - 11:30  安装和配置@react-pdf/renderer
11:30 - 12:30  创建PDF模板组件
12:30 - 13:00  映射简历数据到模板
```
- [ ] 安装依赖：`pnpm add @react-pdf/renderer`
- [ ] 创建PDF模板组件`ResumePDFTemplate.tsx`
- [ ] 设计PDF布局（个人信息、技能、经历）
- [ ] 测试基础渲染

#### 下午 (14:00 - 18:00) - 4小时

**任务3: 完成简历PDF导出** (4小时)
```
14:00 - 16:00  完善PDF样式和布局
16:00 - 17:00  添加下载按钮和API
17:00 - 18:00  测试各种简历格式
```
- [ ] 优化PDF样式（字体、颜色、间距）
- [ ] 处理长文本和分页
- [ ] 在简历详情页添加"下载PDF"按钮
- [ ] 创建PDF生成API路由（如需要）
- [ ] 测试不同内容的简历导出

**预期产出**:
- ✅ Google OAuth可用
- ✅ 简历PDF导出功能完成
- ✅ 单元测试通过

---

### Day 2 - 搜索筛选 + 部署（2025-11-13）

#### 上午 (09:00 - 13:00) - 4小时

**任务4: 岗位搜索和筛选** (4小时)
```
09:00 - 10:00  设计搜索筛选UI
10:00 - 11:30  实现搜索和筛选逻辑
11:30 - 12:30  集成Supabase全文搜索
12:30 - 13:00  E2E测试搜索功能
```
- [ ] 在岗位列表页添加搜索框
- [ ] 添加筛选器（状态、类型、薪资、日期）
- [ ] 实现前端筛选逻辑
- [ ] 集成Supabase `.textSearch()` 或 `.ilike()`
- [ ] 添加排序功能（时间、薪资）
- [ ] 测试各种搜索和筛选组合

#### 下午 (14:00 - 18:00) - 4小时

**任务5: 准备生产部署** (1小时)
```
14:00 - 14:30  整理环境变量
14:30 - 15:00  创建部署配置文件
```
- [ ] 创建`.env.production`模板
- [ ] 整理所有环境变量清单
- [ ] 创建`vercel.json`配置
- [ ] 检查生产环境兼容性

**任务6: 部署到Vercel** (1小时)
```
15:00 - 15:30  连接GitHub仓库到Vercel
15:30 - 16:00  配置环境变量并部署
```
- [ ] 安装Vercel CLI：`pnpm add -g vercel`
- [ ] 登录Vercel：`vercel login`
- [ ] 部署：`vercel --prod`
- [ ] 配置环境变量
- [ ] 绑定自定义域名（可选）

**任务7: 生产环境测试** (2小时)
```
16:00 - 17:00  完整功能测试
17:00 - 18:00  性能检查和bug修复
```
- [ ] 测试所有核心流程
- [ ] 检查页面加载速度
- [ ] 测试OAuth在生产环境
- [ ] 检查错误日志
- [ ] 修复发现的问题

**预期产出**:
- ✅ 搜索筛选功能完成
- ✅ 应用部署到Vercel
- ✅ 生产环境可访问
- ✅ 核心功能验证通过

---

## 📋 详细任务分解

### Task 1: Google OAuth集成

#### 1.1 Supabase配置
```bash
# 在Supabase Dashboard操作
1. 进入 Authentication → Providers
2. 启用 Google Provider
3. 配置回调URL: https://your-project.supabase.co/auth/v1/callback
```

#### 1.2 Google Cloud Console
```bash
1. 访问 https://console.cloud.google.com
2. 创建新项目或选择现有项目
3. 启用 Google+ API
4. 创建 OAuth 2.0 凭证
5. 添加授权重定向URI
6. 获取 Client ID 和 Client Secret
```

#### 1.3 代码实现
**文件**: `apps/web/src/app/login/page.tsx`
```typescript
// 添加Google登录按钮
import { createClient } from '@/lib/supabase'

const handleGoogleLogin = async () => {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
}

// UI更新
<Button onClick={handleGoogleLogin} className="w-full gap-2">
  <GoogleIcon />
  使用Google登录
</Button>
```

**文件**: `apps/web/src/app/auth/callback/route.ts`
```typescript
import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

#### 验收标准
- [ ] Google登录按钮显示正常
- [ ] 点击后跳转到Google授权页面
- [ ] 授权后正确回调并创建会话
- [ ] 用户信息正确保存到profiles表
- [ ] 错误处理正常（取消授权、网络错误）

---

### Task 2: 简历PDF导出

#### 2.1 安装依赖
```bash
cd apps/web
pnpm add @react-pdf/renderer
```

#### 2.2 创建PDF模板
**文件**: `apps/web/src/components/ResumePDF.tsx`
```typescript
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

// 定义样式
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 3,
  },
})

export function ResumePDF({ resume }: { resume: Resume }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 个人信息 */}
        <View style={styles.header}>
          <Text style={styles.name}>
            {resume.content.personal_info?.full_name}
          </Text>
          <Text>{resume.content.personal_info?.email}</Text>
          <Text>{resume.content.personal_info?.phone}</Text>
        </View>

        {/* 技能 */}
        {resume.content.skills && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>技能</Text>
            {resume.content.skills.map((skill, i) => (
              <Text key={i}>• {skill.name} - {skill.proficiency}</Text>
            ))}
          </View>
        )}

        {/* 工作经历 */}
        {resume.content.experiences && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>工作经历</Text>
            {resume.content.experiences.map((exp, i) => (
              <View key={i} style={{ marginBottom: 10 }}>
                <Text>{exp.company} - {exp.position}</Text>
                <Text>{exp.start_date} - {exp.end_date}</Text>
                <Text>{exp.description}</Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  )
}
```

#### 2.3 添加下载功能
**文件**: `apps/web/src/app/resumes/[id]/page.tsx`
```typescript
'use client'
import { pdf } from '@react-pdf/renderer'
import { ResumePDF } from '@/components/ResumePDF'

const handleDownloadPDF = async () => {
  const blob = await pdf(<ResumePDF resume={resume} />).toBlob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${resume.title || 'resume'}.pdf`
  link.click()
}

// UI
<Button onClick={handleDownloadPDF}>
  下载PDF
</Button>
```

#### 验收标准
- [ ] PDF正确生成（无错误）
- [ ] 布局美观（字体、间距、对齐）
- [ ] 所有字段正确显示
- [ ] 中文显示正常
- [ ] 支持多页（长简历自动分页）
- [ ] 下载文件名合理

---

### Task 3: 岗位搜索和筛选

#### 3.1 UI设计
**文件**: `apps/web/src/app/jobs/page.tsx`
```typescript
'use client'
import { useState } from 'react'

export default function JobsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: 'all',
    jobType: 'all',
    salaryMin: null,
    salaryMax: null,
  })
  const [sortBy, setSortBy] = useState('updated_at')

  return (
    <>
      {/* 搜索框 */}
      <input
        type="text"
        placeholder="搜索岗位标题、公司..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* 筛选器 */}
      <div className="filters">
        <select onChange={(e) => setFilters({...filters, status: e.target.value})}>
          <option value="all">所有状态</option>
          <option value="saved">已保存</option>
          <option value="applied">已申请</option>
          {/* ... */}
        </select>

        <select onChange={(e) => setFilters({...filters, jobType: e.target.value})}>
          <option value="all">所有类型</option>
          <option value="full-time">全职</option>
          <option value="part-time">兼职</option>
          {/* ... */}
        </select>
      </div>

      {/* 排序 */}
      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
        <option value="updated_at">最近更新</option>
        <option value="created_at">最近添加</option>
        <option value="deadline">截止日期</option>
      </select>
    </>
  )
}
```

#### 3.2 实现搜索逻辑
```typescript
// Supabase查询
const { data: jobs } = await supabase
  .from('jobs')
  .select('*')
  .eq('user_id', user.id)
  .or(`title.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%`)
  .eq(filters.status !== 'all' ? 'status' : undefined, filters.status)
  .order(sortBy, { ascending: false })
```

#### 3.3 前端筛选
```typescript
// 客户端筛选（薪资范围）
const filteredJobs = jobs?.filter(job => {
  if (filters.salaryMin && job.salary_min < filters.salaryMin) return false
  if (filters.salaryMax && job.salary_max > filters.salaryMax) return false
  return true
})
```

#### 验收标准
- [ ] 搜索框实时响应
- [ ] 状态筛选正确
- [ ] 类型筛选正确
- [ ] 薪资范围筛选正确
- [ ] 排序功能正常
- [ ] 空结果友好提示
- [ ] 筛选器可清除

---

### Task 4: Vercel部署

#### 4.1 环境变量清单
```bash
# .env.production
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
OPENAI_API_KEY=sk-xxx
```

#### 4.2 Vercel配置
**文件**: `vercel.json`
```json
{
  "buildCommand": "turbo run build --filter=web",
  "outputDirectory": "apps/web/.next",
  "framework": "nextjs",
  "regions": ["sfo1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "OPENAI_API_KEY": "@openai-api-key"
  }
}
```

#### 4.3 部署步骤
```bash
# 1. 安装Vercel CLI
pnpm add -g vercel

# 2. 登录
vercel login

# 3. 初始化项目
vercel

# 4. 配置环境变量（Vercel Dashboard）
# 或使用CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add OPENAI_API_KEY production

# 5. 生产部署
vercel --prod

# 6. 检查部署
vercel inspect
```

#### 验收标准
- [ ] 部署成功无错误
- [ ] 环境变量正确配置
- [ ] 首页可访问
- [ ] OAuth回调正确配置
- [ ] API路由正常工作
- [ ] 静态资源加载正常

---

## 🧪 测试计划

### 功能测试清单

**Google OAuth**:
- [ ] 点击Google登录跳转正确
- [ ] 授权后成功登录
- [ ] 用户信息保存正确
- [ ] 取消授权正常处理
- [ ] 已有账号关联正确

**PDF导出**:
- [ ] 基础简历导出正确
- [ ] 完整简历导出正确
- [ ] 长简历分页正确
- [ ] 中文字符显示正常
- [ ] PDF可正常打开

**搜索筛选**:
- [ ] 标题搜索正确
- [ ] 公司搜索正确
- [ ] 状态筛选正确
- [ ] 类型筛选正确
- [ ] 薪资筛选正确
- [ ] 排序功能正确
- [ ] 组合筛选正确

**生产部署**:
- [ ] 所有页面可访问
- [ ] 登录注册正常
- [ ] CRUD操作正常
- [ ] 图片加载正常
- [ ] 错误处理正确

---

## 📊 风险评估

### 高风险项

**Google OAuth集成**:
- 🔴 风险：回调URL配置错误
- ✅ 缓解：仔细核对URL，本地测试
- 🔴 风险：OAuth凭证泄露
- ✅ 缓解：使用环境变量，不提交到Git

**PDF导出**:
- 🟡 风险：中文字体问题
- ✅ 缓解：提前测试中文内容
- 🟡 风险：PDF文件过大
- ✅ 缓解：优化图片，压缩文件

**Vercel部署**:
- 🔴 风险：环境变量缺失
- ✅ 缓解：使用checklist逐一验证
- 🟡 风险：构建失败
- ✅ 缓解：本地先运行`pnpm build`

---

## 📈 成功指标

### 量化指标
- [ ] OAuth集成完成度：100%
- [ ] PDF导出成功率：>95%
- [ ] 搜索响应时间：<500ms
- [ ] 部署成功率：100%
- [ ] 生产环境可用性：>99%

### 质量指标
- [ ] 代码审查通过
- [ ] E2E测试通过
- [ ] 无严重bug
- [ ] 用户体验良好

---

## 📝 文档更新

### 需要更新的文档
- [ ] `docs/PROGRESS.md` - 更新Sprint 6进度
- [ ] `docs/CHANGELOG.md` - 添加v0.7.0版本记录
- [ ] `README.md` - 更新部署说明
- [ ] `DEVELOPMENT.md` - 添加新功能开发指南

---

## 🎯 下一步规划

### Sprint 6完成后
1. **收集反馈**（1-2天）
   - 邀请朋友试用
   - 记录用户反馈
   - 分析使用数据

2. **决策Sprint 7方向**
   - Option A: 面试管理（如果用户强烈需求）
   - Option B: 浏览器扩展（如果想扩展场景）
   - Option C: 优化现有功能（如果有明显问题）

3. **长期规划**
   - 智能提醒系统
   - 数据导入导出
   - 团队协作功能
   - 付费功能探索

---

## ✅ 每日检查清单

### Day 1结束前
- [ ] Google OAuth完成并测试
- [ ] 简历PDF导出完成
- [ ] 代码已提交到Git
- [ ] 文档已更新

### Day 2结束前
- [ ] 搜索筛选完成并测试
- [ ] 应用成功部署
- [ ] 生产环境测试通过
- [ ] 所有文档更新完成
- [ ] 庆祝里程碑 🎉

---

**准备好了吗？让我们开始Sprint 6！** 🚀

*计划创建时间: 2025-11-12*
*预计完成时间: 2025-11-13*
