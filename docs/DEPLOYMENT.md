# Vercel 部署指南

## 环境变量清单

部署到 Vercel 时需要配置以下环境变量：

### 必需的环境变量

1. **Supabase 配置**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥
   ```

   获取方式：
   - 登录 Supabase Dashboard
   - 进入项目设置 → API
   - 复制 URL 和 anon public key

2. **OpenAI API（可选，用于AI分析功能）**
   ```bash
   OPENAI_API_KEY=你的OpenAI API密钥
   ```

   获取方式：
   - 访问 https://platform.openai.com/api-keys
   - 创建新的 API 密钥

   注意：如果不配置此项，AI岗位匹配分析功能将不可用。

---

## Vercel 部署步骤

### 1. 准备 GitHub 仓库

确保代码已推送到 GitHub：
```bash
git add .
git commit -m "准备部署到Vercel"
git push origin main
```

### 2. 连接 Vercel

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Add New Project"
3. 导入你的 GitHub 仓库
4. Vercel 会自动检测 Next.js 项目

### 3. 配置项目

**Framework Preset**: Next.js
**Root Directory**: `apps/web` （重要！）
**Build Command**: 保持默认或使用 `cd ../.. && pnpm build`
**Output Directory**: 保持默认 `.next`
**Install Command**: `pnpm install`

### 4. 配置环境变量

在 Vercel 项目设置中，进入 "Settings" → "Environment Variables"，添加以下变量：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 你的Supabase URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 你的Supabase Anon Key | Production, Preview, Development |
| `OPENAI_API_KEY` | 你的OpenAI Key（可选） | Production, Preview, Development |

### 5. 部署

点击 "Deploy" 按钮，Vercel 会自动：
- 安装依赖
- 运行构建
- 部署到全球 CDN

---

## Supabase OAuth 配置

部署成功后，需要更新 Supabase 的 OAuth 回调 URL：

1. 获取 Vercel 部署的 URL（例如：`https://your-app.vercel.app`）

2. 登录 Supabase Dashboard

3. 进入 Authentication → URL Configuration

4. 添加以下 Redirect URLs：
   ```
   https://your-app.vercel.app/auth/callback
   https://*.vercel.app/auth/callback  （预览部署）
   ```

5. 进入 Authentication → Providers → Google

6. 在 Google Cloud Console 中添加授权重定向 URI：
   - Authorized redirect URIs: `https://<your-project>.supabase.co/auth/v1/callback`
   - 添加生产域名回调：`https://your-app.vercel.app/*`

---

## 验证部署

部署成功后，测试以下功能：

- [ ] 访问首页
- [ ] 用户注册/登录
- [ ] Google OAuth 登录
- [ ] 简历创建和编辑
- [ ] 岗位添加和管理
- [ ] AI 匹配分析（如果配置了 OpenAI API Key）
- [ ] 申请追踪功能

---

## 常见问题

### 构建失败

**问题**: Vercel 构建时找不到模块
**解决**: 确保 Root Directory 设置为 `apps/web`

**问题**: 类型错误
**解决**: 运行 `pnpm build` 本地验证，确保所有类型错误已修复

### OAuth 不工作

**问题**: Google 登录后显示 "redirect_uri_mismatch"
**解决**:
1. 检查 Supabase Dashboard 的 Redirect URLs
2. 检查 Google Cloud Console 的 Authorized redirect URIs
3. 确保包含了 Vercel 部署的域名

### API 调用失败

**问题**: 前端无法连接 Supabase
**解决**:
1. 检查环境变量是否正确配置
2. 确认 Supabase 项目状态正常
3. 检查 Row Level Security 策略

---

## 性能优化建议

1. **启用 Vercel Analytics**
   - 进入 Vercel 项目设置
   - 启用 Analytics 和 Speed Insights

2. **配置缓存**
   - Vercel 会自动处理静态资源缓存
   - API 路由根据需要配置 `revalidate`

3. **监控错误**
   - 使用 Vercel Logs 查看运行时错误
   - 考虑集成 Sentry 进行错误追踪

---

## 下一步

- [ ] 配置自定义域名
- [ ] 设置 CI/CD 自动部署
- [ ] 配置生产环境数据库备份
- [ ] 设置监控和告警

---

**更新时间**: 2025-11-20
**版本**: v1.0
