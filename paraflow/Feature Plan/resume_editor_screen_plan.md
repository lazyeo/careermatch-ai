# 简历编辑器
提供所见即所得的简历编辑界面，支持拖拽调整、实时预览、AI优化建议和多模板切换功能。

Layout Hierarchy:
- Header (Full-width):
  - Editor Top Bar
- Content Container (Positioned below the header):
  - Left Sidebar (Edit Panel)
  - Center Area (Live Preview)
  - Right Sidebar (AI Suggestions)

## Editor Top Bar
- 返回简历管理按钮
- 简历版本信息：
  - 当前编辑版本名称
  - 最后保存时间
  - 自动保存状态指示器
- 操作按钮组：
  - 保存草稿
  - 预览效果
  - 导出PDF
  - 分享链接
  - 更多操作下拉菜单

## Left Sidebar - Edit Panel (350px width)
- 章节导航列表：
  - 个人信息（Personal Information）
  - 职业目标（Career Objective）
  - 核心技能（Key Skills）
  - 工作经历（Work Experience）
  - 项目经历（Projects）
  - 教育背景（Education）
  - 技术技能（Technical Skills）
  - 认证资质（Certifications）
  - 兴趣爱好（Interests）
- 章节拖拽重排功能
- 添加自定义章节按钮

### Personal Information Section
- 基本信息输入字段：
  - 姓名（必填）
  - 职位标题
  - 邮箱和电话
  - 地址（可选详细程度）
  - LinkedIn、GitHub等链接
- 头像上传：
  - 照片裁剪工具
  - 显示/隐藏选项

### Career Objective Section
- 富文本编辑器
- AI生成建议按钮
- 字数统计（建议50-100词）
- 针对不同岗位类型的模板选择

### Skills Section
- 技能标签管理：
  - 技能名称输入
  - 熟练度选择（初级/中级/高级/专家）
  - 年限输入
  - 技能分类（技术/软技能/语言等）
- 批量导入功能（从岗位要求）
- 热门技能推荐

### Work Experience Section
- 工作经历条目编辑：
  - 公司名称和职位
  - 工作时间（开始/结束日期）
  - 工作地点
  - 职责描述（支持富文本）
  - 主要成就（可添加多项）
- 拖拽排序功能
- AI优化描述建议
- 量化成果提示工具

### Projects Section
- 项目经历管理：
  - 项目名称和角色
  - 项目时间和团队规模
  - 技术栈标签
  - 项目描述和成果
  - 项目链接（GitHub、演示等）
- 项目重要性评分
- 根据岗位类型推荐展示项目

## Center Area - Live Preview (flex grow)
- 实时简历预览：
  - 所见即所得渲染
  - 多种缩放比例（50%/75%/100%/125%）
  - A4纸张边界线显示
  - 页面分页预览
- 模板切换控制：
  - 模板缩略图选择器
  - 颜色主题调整
  - 字体大小和间距设置
- 直接编辑功能：
  - 点击文本进行内联编辑
  - 选中元素高亮显示
  - 拖拽调整元素位置

## Right Sidebar - AI Suggestions (320px width)
- AI建议面板：
  - 内容优化建议：
    - 识别模糊描述，提供具体化建议
    - 检测缺失关键词，推荐添加
    - 发现重复内容，建议精简
  - 结构优化建议：
    - 章节顺序调整建议
    - 内容长度优化（控制在1-2页）
    - 视觉布局改进建议
  - ATS优化评分：
    - 关键词密度分析
    - 格式兼容性检查
    - 整体ATS友好度评分（A-F等级）

## Bottom Action Bar
- 编辑模式切换：
  - 编辑模式（当前）
  - 预览模式
  - 导出模式
- 版本控制：
  - 另存为新版本
  - 恢复历史版本
  - 版本对比工具
- 协作功能（专业版）：
  - 分享编辑链接
  - 评论和反馈
  - 导出为多种格式

## Floating Tools
- 格式工具栏（当选中文本时显示）：
  - 粗体、斜体、下划线
  - 字体颜色和背景色
  - 项目符号和编号
  - 对齐方式
- 章节工具（当悬停章节时显示）：
  - 上移/下移
  - 复制章节
  - 删除章节
  - 折叠/展开

## Keyboard Shortcuts Panel
- 常用快捷键提示：
  - Ctrl+S：保存
  - Ctrl+Z：撤销
  - Ctrl+Y：重做
  - Ctrl+E：导出PDF
  - Tab：在字段间切换