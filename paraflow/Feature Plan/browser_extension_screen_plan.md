# 浏览器扩展界面
为用户提供一键抓取岗位信息的浏览器插件，支持主流招聘网站的自动信息提取和快速匹配预览。

## Extension Popup Interface (320px width)

### Header Section
- CareerMatch AI logo（小尺寸）
- 版本标识和连接状态指示器
- 设置图标（跳转到选项页面）

### Page Detection Status
- 当前页面检测结果显示：
  - 已识别招聘页面：显示网站图标和名称
  - 未识别页面：显示"未检测到岗位信息"提示
  - 检测中状态：加载动画和"正在分析页面..."文本

### Job Information Preview (when detected)
- 岗位基本信息卡片：
  - 职位标题（加粗显示）
  - 公司名称和logo
  - 工作地点和工作类型
  - 薪资范围（如可提取）
  - 发布日期
- 数据完整度指示器：
  - 必需字段：绿色勾选标记
  - 缺失字段：橙色警告标记
  - 提取质量评分（A/B/C等级）

### Quick Match Analysis (if logged in)
- 用户登录状态显示
- 快速匹配评分：
  - 大号匹配度百分比（如 85%）
  - 星级评定显示（1-5星）
  - 匹配等级标签（完美匹配/高度匹配/中等匹配）
- 关键匹配点摘要：
  - 匹配的核心技能（最多3个）
  - 经验年限匹配状态
  - 地理位置匹配提示

### Action Buttons
- 主要操作按钮：
  - "保存到我的岗位"（主按钮，绿色）
  - "预览详细分析"（次要按钮）
  - "立即生成简历"（高匹配度时显示）
- 辅助操作：
  - "编辑信息"（修正提取错误）
  - "不感兴趣"（负面反馈）
  - "举报问题"（数据质量反馈）

### Status Feedback
- 操作成功状态：
  - 绿色勾选图标
  - "已成功保存到您的岗位库"
  - 跳转链接："查看完整分析"
- 操作失败状态：
  - 红色错误图标
  - 错误原因说明
  - "重试"按钮

### Footer Section
- 快速链接：
  - "打开网站"
  - "我的岗位"
  - "设置"
- 支持信息：
  - 意见反馈链接
  - 帮助文档

## Options Page Interface

### General Settings
- 自动检测开关：
  - 启用/禁用自动页面分析
  - 检测敏感度调节（高/中/低）
  - 支持的网站列表管理
- 通知偏好：
  - 保存成功通知
  - 匹配度提醒
  - 推送通知频率

### Account Integration
- 登录状态管理：
  - 当前登录用户信息
  - 登录/登出按钮
  - 账户类型显示（免费/专业版）
- 同步设置：
  - 岗位自动同步
  - 匹配分析实时计算
  - 离线模式配置

### Data & Privacy
- 数据处理设置：
  - 数据本地存储开关
  - 自动清理规则
  - 导出个人数据
- 隐私控制：
  - 匿名使用模式
  - 数据分享偏好
  - 第三方集成授权

### Advanced Features
- 批量操作：
  - 多标签页批量抓取
  - 搜索结果页面批量保存
  - 自定义抓取规则
- 集成设置：
  - Slack/Email 通知
  - Calendar 集成
  - CRM 系统对接

## Supported Website Detection Rules

### Seek.co.nz
- URL模式识别：包含"seek.co.nz/job/"
- 关键元素定位：
  - 职位标题：h1[data-automation="job-detail-title"]
  - 公司名称：[data-automation="advertiser-name"]
  - 地点：[data-automation="job-detail-location"]
  - 描述：[data-automation="jobAdDetails"]

### TradeMe Jobs
- URL模式识别：包含"trademe.co.nz/a/jobs"
- 关键元素定位：
  - 职位标题：.tm-listing-title
  - 公司名称：.tm-listing-attribution
  - 薪资：.tm-job-salary
  - 描述：.tm-listing-body

### LinkedIn Jobs
- URL模式识别：包含"linkedin.com/jobs/view"
- 关键元素定位：
  - 职位标题：.top-card-layout__title
  - 公司名称：.topcard__org-name-link
  - 地点：.topcard__flavor-row
  - 描述：.description__text

### Universal Fallback Mode
- 手动选择模式界面：
  - 页面截图显示
  - 拖拽框选功能
  - 字段标记工具
  - AI辅助识别