# Google OAuth 集成配置手册

> **创建时间**: 2025-11-12
> **预计时间**: 30-40分钟
> **难度**: ⭐⭐⭐☆☆

---

## 📋 配置清单

在开始之前，请确保你有以下账号：
- ✅ Supabase账号（已有）
- ✅ Google Cloud Console账号（需要Gmail账号）
- ✅ 项目已在本地运行（http://localhost:3000）

---

## 🔧 第一步：Supabase Dashboard 配置

### 1.1 登录 Supabase Dashboard

1. 访问：https://supabase.com/dashboard
2. 登录你的账号
3. 选择项目：**bfvuwbkfarrppaqcenwo** (CareerMatch AI)

### 1.2 获取回调URL

Supabase为你的项目自动生成了OAuth回调URL：

```
https://bfvuwbkfarrppaqcenwo.supabase.co/auth/v1/callback
```

**⚠️ 重要**：复制这个URL，稍后在Google Cloud Console中需要使用！

### 1.3 启用Google Provider（稍后完成）

**暂时不要启用**，等我们从Google获取Client ID和Secret后再回来配置：

1. 在Supabase Dashboard左侧菜单，点击 **Authentication**
2. 点击 **Providers** 标签
3. 找到 **Google** Provider（暂时不要点击启用）
4. 记住这个位置，稍后需要在这里输入：
   - Client ID（来自Google）
   - Client Secret（来自Google）

---

## 🌐 第二步：Google Cloud Console 配置

### 2.1 访问 Google Cloud Console

1. 打开浏览器，访问：https://console.cloud.google.com
2. 使用你的Gmail账号登录

### 2.2 创建新项目

1. 点击顶部导航栏的项目选择器（"Select a project"）
2. 点击 **NEW PROJECT** 按钮
3. 填写项目信息：
   ```
   Project name: CareerMatch AI
   Location: No organization
   ```
4. 点击 **CREATE** 按钮
5. 等待项目创建完成（约10-30秒）
6. 确保你在新创建的项目中（顶部导航栏显示"CareerMatch AI"）

### 2.3 启用 Google+ API（已废弃，改为People API）

Google OAuth 2.0现在使用People API来获取用户信息。

1. 在左侧菜单点击 **☰ > APIs & Services > Library**
2. 在搜索框中输入：`Google People API`
3. 点击搜索结果中的 **Google People API**
4. 点击 **ENABLE** 按钮
5. 等待API启用完成

### 2.4 配置OAuth同意屏幕

在创建凭证之前，必须先配置OAuth同意屏幕：

#### Step 1: 进入配置页面
1. 左侧菜单点击 **☰ > APIs & Services > OAuth consent screen**

#### Step 2: 选择用户类型
- 选择 **External**（外部用户）
- 点击 **CREATE** 按钮

#### Step 3: 填写应用信息

**App information**:
```
App name: CareerMatch AI
User support email: [你的Gmail邮箱]
```

**App logo**（可选）:
- 跳过，稍后可以添加

**App domain**（可选，暂时跳过）:
```
Application home page: http://localhost:3000 （开发阶段可留空）
Application privacy policy link: （暂时留空）
Application terms of service link: （暂时留空）
```

**Authorized domains**（重要！）:
```
supabase.co
```
- 点击 **ADD DOMAIN** 添加域名

**Developer contact information**:
```
Email addresses: [你的Gmail邮箱]
```

点击 **SAVE AND CONTINUE**

#### Step 4: 配置Scopes（权限范围）

1. 点击 **ADD OR REMOVE SCOPES** 按钮
2. 在弹出的对话框中，选择以下scopes：
   ```
   ✅ .../auth/userinfo.email (查看你的电子邮件地址)
   ✅ .../auth/userinfo.profile (查看你的个人信息)
   ✅ openid
   ```
3. 点击 **UPDATE** 按钮
4. 点击 **SAVE AND CONTINUE**

#### Step 5: 测试用户（开发阶段）

在应用发布之前，你需要添加测试用户：

1. 点击 **ADD USERS** 按钮
2. 输入你的测试Gmail账号（可以是你自己的账号）：
   ```
   your-email@gmail.com
   ```
3. 点击 **ADD** 按钮
4. 点击 **SAVE AND CONTINUE**

#### Step 6: 检查摘要

1. 检查所有配置信息
2. 点击 **BACK TO DASHBOARD** 返回

**⚠️ 注意**：在开发阶段，你的应用处于"Testing"状态，只有添加的测试用户才能登录。要发布到生产环境，需要通过Google的审核（后续步骤）。

### 2.5 创建OAuth凭证

#### Step 1: 进入凭证页面
1. 左侧菜单点击 **☰ > APIs & Services > Credentials**
2. 点击顶部的 **+ CREATE CREDENTIALS** 按钮
3. 选择 **OAuth client ID**

#### Step 2: 选择应用类型
```
Application type: Web application
Name: CareerMatch AI Web Client
```

#### Step 3: 配置授权重定向URI

**Authorized JavaScript origins**（可选，暂时留空）:
```
http://localhost:3000
```

**Authorized redirect URIs**（重要！）:
```
https://bfvuwbkfarrppaqcenwo.supabase.co/auth/v1/callback
```

**⚠️ 关键步骤**：
1. 点击 **+ ADD URI** 按钮
2. 粘贴上面的Supabase回调URL
3. 确保URL完全正确（包括https和/callback）

点击 **CREATE** 按钮

#### Step 4: 保存凭证

创建成功后，会弹出对话框显示：

```
Your Client ID
------------------------------------------
[一长串字符].apps.googleusercontent.com

Your Client Secret
------------------------------------------
[一串密钥字符]
```

**🔴 重要**：立即复制并保存这两个值！

- **方式1**：点击 **DOWNLOAD JSON** 按钮下载凭证文件
- **方式2**：手动复制Client ID和Client Secret到安全的地方

**⚠️ 安全提醒**：
- Client Secret是敏感信息，不要提交到Git
- 不要分享给他人
- 如果泄露，立即在Google Console中重置

---

## 🔐 第三步：配置Supabase OAuth Provider

现在我们有了Google的凭证，返回Supabase Dashboard：

### 3.1 返回Supabase

1. 访问：https://supabase.com/dashboard/project/bfvuwbkfarrppaqcenwo
2. 左侧菜单 **Authentication** > **Providers**
3. 找到 **Google** Provider

### 3.2 启用并配置Google

1. 点击 **Google** 旁边的开关，**启用**它
2. 填写从Google获取的凭证：

```
Client ID (for OAuth):
[粘贴从Google获取的Client ID]

Client Secret (for OAuth):
[粘贴从Google获取的Client Secret]
```

3. **Authorized Client IDs**（可选，留空）

4. 点击 **Save** 按钮

### 3.3 验证配置

配置完成后，你应该看到：
- ✅ Google Provider显示为"Enabled"
- ✅ Client ID已填写（部分隐藏）
- ✅ Client Secret已填写（完全隐藏）

---

## ✅ 配置完成检查清单

在进行代码实现之前，请确认：

- [ ] Google Cloud项目已创建
- [ ] Google People API已启用
- [ ] OAuth同意屏幕已配置
- [ ] 测试用户已添加
- [ ] OAuth Client ID已创建
- [ ] 已获取Client ID和Client Secret
- [ ] Supabase Google Provider已启用
- [ ] Supabase中的Client ID和Secret已填写
- [ ] 回调URL配置正确

---

## 📝 记录你的凭证（仅用于开发）

为了方便后续使用，请将凭证记录在安全的地方：

```bash
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Supabase Callback URL
CALLBACK_URL=https://bfvuwbkfarrppaqcenwo.supabase.co/auth/v1/callback

# 测试用户
TEST_USER_EMAIL=your-test-email@gmail.com
```

**⚠️ 重要**：不要将这些凭证提交到Git仓库！

---

## 🚨 常见问题和故障排除

### 问题1: "Access blocked: This app's request is invalid"

**原因**：回调URL配置错误

**解决方案**：
1. 检查Google Console中的"Authorized redirect URIs"
2. 确保URL完全匹配：`https://bfvuwbkfarrppaqcenwo.supabase.co/auth/v1/callback`
3. 注意：
   - 必须是https（不是http）
   - 必须包含完整路径（/auth/v1/callback）
   - 不能有尾部斜杠

### 问题2: "Error 400: redirect_uri_mismatch"

**原因**：Supabase发送的回调URL与Google Console中配置的不匹配

**解决方案**：
1. 在Supabase中重新确认回调URL
2. 在Google Console中重新确认Authorized redirect URIs
3. 确保两者完全一致
4. 如果修改了配置，等待1-2分钟让更改生效

### 问题3: "Access blocked: Authorization Error"

**原因**：应用处于Testing状态，当前用户不在测试用户列表中

**解决方案**：
1. 返回Google Console > OAuth consent screen
2. 点击 **ADD USERS**
3. 添加你要测试的Gmail账号
4. 保存并重试

### 问题4: "This app hasn't been verified"

**说明**：这是正常的，因为应用还在开发阶段

**解决方案**：
1. 点击 **Advanced** 链接
2. 点击 **Go to CareerMatch AI (unsafe)** 继续
3. 这个警告只在开发阶段出现
4. 生产部署时需要通过Google的审核才能移除此警告

---

## 📢 配置完成后的下一步

完成以上所有配置后，请告诉我，我将：

1. ✅ 创建OAuth回调路由（`/auth/callback/route.ts`）
2. ✅ 更新登录页面，添加"使用Google登录"按钮
3. ✅ 更新注册页面，添加"使用Google注册"按钮
4. ✅ 测试完整的OAuth流程
5. ✅ 处理OAuth错误和边缘情况

**准备好了吗？** 🚀

---

*文档版本: v1.0*
*最后更新: 2025-11-12*
