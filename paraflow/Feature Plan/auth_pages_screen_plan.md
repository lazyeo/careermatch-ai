# 用户认证页面组
包含登录、注册、忘记密码等用户认证相关的页面设计。

## Login Page (登录页面)

Layout Hierarchy:
- Header (Full-width):
  - Simple Navigation
- Content Container (Centered):
  - Login Form Card
- Footer (Full-width):
  - Minimal Footer

### Simple Navigation
- CareerMatch AI logo
- 返回首页链接
- 语言切换选项

### Login Form Card
- 页面标题："欢迎回来"
- 登录表单：
  - 邮箱输入框（带验证）
  - 密码输入框（带显示/隐藏切换）
  - "记住我"复选框
  - 登录按钮（主要样式）
- 快速登录选项：
  - Google登录按钮
  - LinkedIn登录按钮
- 辅助链接：
  - "忘记密码？"链接
  - "还没有账户？立即注册"链接
- 安全提示：
  - 数据加密保护说明
  - 隐私政策链接

## Register Page (注册页面)

Layout Hierarchy:
- Header (Full-width):
  - Simple Navigation
- Content Container (Centered):
  - Registration Form Card
- Footer (Full-width):
  - Minimal Footer

### Registration Form Card
- 页面标题："开始您的智能求职之旅"
- 注册表单：
  - 姓名输入框
  - 邮箱输入框（带实时验证）
  - 密码输入框（带强度指示器）
  - 确认密码输入框
  - 基本信息：
    - 当前职业状态（下拉选择）
    - 目标岗位类型（多选标签）
    - 工作地点偏好（新西兰城市）
- 同意条款：
  - 服务条款和隐私政策确认
  - 营销邮件订阅选项（可选）
- 注册按钮（主要样式）
- 快速注册选项：
  - Google注册按钮
  - LinkedIn注册按钮
- 已有账户链接：
  - "已有账户？立即登录"

### Registration Benefits Sidebar
- 注册后可获得：
  - 免费简历分析
  - 5个岗位匹配分析
  - 1份定制简历生成
  - 专业求职建议
- 成功案例简要展示
- 平台安全保障说明

## Forgot Password Page (忘记密码页面)

Layout Hierarchy:
- Header (Full-width):
  - Simple Navigation
- Content Container (Centered):
  - Password Reset Form Card

### Password Reset Form Card
- 页面标题："重置您的密码"
- 说明文本："输入您的邮箱地址，我们将发送重置链接"
- 重置表单：
  - 邮箱输入框
  - 发送重置链接按钮
- 状态反馈：
  - 发送成功提示
  - 邮箱检查提醒
  - 重新发送倒计时
- 返回登录链接

## Password Reset Page (密码重置页面)

Layout Hierarchy:
- Header (Full-width):
  - Simple Navigation
- Content Container (Centered):
  - New Password Form Card

### New Password Form Card
- 页面标题："设置新密码"
- 新密码表单：
  - 新密码输入框（带强度指示器）
  - 确认新密码输入框
  - 设置新密码按钮
- 密码要求提示：
  - 至少8个字符
  - 包含大小写字母
  - 包含数字和特殊字符
- 设置成功后自动登录

## Email Verification Page (邮箱验证页面)

Layout Hierarchy:
- Header (Full-width):
  - Simple Navigation
- Content Container (Centered):
  - Verification Status Card

### Verification Status Card
- 验证成功状态：
  - 成功图标
  - "邮箱验证成功"标题
  - 自动跳转登录提示
  - 手动登录按钮
- 验证失败状态：
  - 错误图标
  - 失败原因说明
  - 重新发送验证邮件按钮
  - 联系客服链接

## 交互设计规范

### Modal vs Page Navigation
- **使用模态框 (Modal) 的场景**：
  - 快速登录（从任何页面触发）
  - 简单的忘记密码流程
  - 邮箱验证提醒
  - 登录状态过期提醒

- **使用页面跳转的场景**：
  - 完整注册流程（需要较多信息输入）
  - 密码重置完整流程
  - 首次用户引导流程
  - 账户验证相关页面

### 响应式设计
- 移动端适配：
  - 表单字段垂直堆叠
  - 触摸友好的按钮尺寸
  - 软键盘优化
- 桌面端优化：
  - 居中卡片布局
  - 合适的最大宽度限制
  - 侧边信息展示区域