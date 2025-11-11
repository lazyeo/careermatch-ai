# ResumeAI优雅平衡 Style Guide

## Colors
### Primary Colors
- **primary-base**: `text-[#4A8B5A]` or `bg-[#4A8B5A]` - 温暖翠绿主色
- **primary-lighter**: `bg-[#6FA474]` - 较浅翠绿
- **primary-darker**: `text-[#386843]` or `bg-[#386843]` - 较深翠绿

### Background Colors
- **bg-page**: `bg-gradient-to-br from-[#FEFCF9] to-[#F9F7F3]` - 温暖渐变背景，增加深度
- **bg-container-primary**: `bg-white/95` - 主要容器，带微透明增加层次
- **bg-container-secondary**: `bg-[#FEFCF9]` - 次要容器背景
- **bg-container-elevated**: `bg-white` - 高级容器，纯白突出
- **bg-container-inset**: `bg-gradient-to-b from-[#F8F6F2] to-[#F5F3EE]` - 凹陷效果渐变
- **bg-container-inset-strong**: `bg-gradient-to-b from-[#F2F0EB] to-[#EDE9E3]` - 强凹陷渐变
- **bg-accent-warm**: `bg-gradient-to-r from-[#FDF8F3] to-[#FBF5EF]` - 温暖橙色渐变背景
- **bg-glass-light**: `bg-white/60 backdrop-blur-sm` - 毛玻璃效果，轻质感
- **bg-glass-strong**: `bg-white/80 backdrop-blur-md` - 强毛玻璃效果

### Text Colors
- **color-text-primary**: `text-[#1A1F1C]` - 主要文本，深绿灰色
- **color-text-secondary**: `text-[#4A524E]` - 次要文本
- **color-text-tertiary**: `text-[#7A827E]` - 第三级文本
- **color-text-quaternary**: `text-[#A8AFA9]` - 第四级文本，占位符
- **color-text-on-dark-primary**: `text-white/90` - 深色背景上的主要文本
- **color-text-on-dark-secondary**: `text-white/70` - 深色背景上的次要文本
- **color-text-link**: `text-[#4A8B5A]` - 链接文本，使用主色调

### Functional Colors
- **color-success-default**: `#4A8B5A` - 成功状态，使用主色调
- **color-success-light**: `#E8F3EA` - 成功状态浅色背景
- **color-error-default**: `#D14343` - 错误状态
- **color-error-light**: `#FDF2F2` - 错误状态浅色背景
- **color-warning-default**: `#E67E22` - 警告状态，温暖橙色
- **color-warning-light**: `#FDF8F3` - 警告状态浅色背景
- **color-info-default**: `#386843` - 信息状态，深绿色点缀
- **color-info-light**: `#EBF0EC` - 信息状态浅色背景

### Accent Colors
次要色彩用于偶尔的突出显示和分类，避免过度使用以保护品牌识别度
- **accent-orange**: `text-[#E67E22]` or `bg-[#E67E22]` - 温暖橙色点缀
- **accent-deep-green**: `text-[#2C4F32]` or `bg-[#2C4F32]` - 深绿色点缀
- **accent-warm-cream**: `text-[#F5F2ED]` or `bg-[#F5F2ED]` - 温暖米色

### Data Visualization Charts
- 标准数据颜色: #E8F3EA, #C4D9C8, #A0BFA6, #7CA584, #588B62, #347140
- 重要数据可使用少量: #E67E22, #D14343, #386843, #2C4F32

## Typography 
- **Font Stack**:
  - **font-family-base**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` — 现代无衬线字体

- **Font Size & Weight**:
  - **Caption**: `text-xs font-normal` - 说明文字
  - **Body small**: `text-sm font-normal` - 小号正文
  - **Body default**: `text-base font-normal` - 默认正文
  - **Card Title / Emphasized Text**: `text-base font-semibold` - 卡片标题/强调文本
  - **Page Title**: `text-2xl font-semibold` - 页面标题
  - **Headline**: `text-4xl font-semibold` - 大标题
  - **Display**: `text-5xl font-semibold` - 展示标题

- **Line Height**: 1.5 - 提高可读性

## Border Radius
- **Small**: 8px - 卡片内部元素（如图片、按钮）
- **Medium**: 12px - 输入框、小卡片
- **Large**: 16px - 主要卡片容器
- **Extra Large**: 20px - 大型容器、特殊组件

## Layout & Spacing 
- **Spacing Scale**:
  - **Base Unit**: 4px
  - **Tight**: 8px - 紧密相关元素
  - **Compact**: 12px - 列表项和小间距
  - **Standard**: 16px - 通用内边距、外边距
  - **Comfortable**: 24px - 舒适间距
  - **Spacious**: 32px - 大间距，区块分隔

## Create Boundaries (contrast of surface color, borders, shadows)
主要通过表面颜色对比和精致细节创建边界，辅以微妙阴影增强层次感

### Borders 
- **Default**: `1px solid #E8F0E9` - 默认边框，微妙的绿色调
- **Stronger**: `1px solid #D4E2D6` - 强调边框，用于聚焦状态
- **Accent**: `1px solid #E67E22` - 重点边框，使用温暖橙色

### Dividers 
- **Default**: `border-t border-[#E8F0E9]` - 默认分隔线
- **Strong**: `border-t-2 border-[#D4E2D6]` - 强调分隔线

### Shadows & Effects
精致的阴影效果增强现代扁平设计的层次感
- **Subtle**: `shadow-[0_2px_8px_rgba(74,139,90,0.08)]` - 微妙阴影，带绿色调
- **Card**: `shadow-[0_4px_12px_rgba(74,139,90,0.12)]` - 卡片阴影
- **Elevated**: `shadow-[0_6px_20px_rgba(74,139,90,0.15)]` - 提升阴影
- **Focus**: `shadow-[0_0_0_3px_rgba(74,139,90,0.2)]` - 聚焦外框

## Assets
### Image
- For normal `<img>`: `object-cover`
- For `<img>` with:
  - Slight overlay: `object-cover brightness-95`
  - Heavy overlay: `object-cover brightness-85`

### Logo
- 为保护版权，请勿使用真实产品logo作为新产品、个人用户或其他公司产品的标识
- **Icon-based**:
  - **Graphic**: 使用简洁相关的FontAwesome Solid图标（如简历应用使用`fa-file-alt`，职业平台使用`fa-briefcase`）

### Icon
- 使用来自Iconify的Lucide图标库
- 每个图标应居中放置在与图标尺寸匹配的方形容器中
- 使用Tailwind字体大小控制图标尺寸
- 示例:
  ```html
  <div class="flex items-center justify-center bg-transparent w-4 h-4">
    <iconify-icon icon="lucide:file-text" class="text-base"></iconify-icon>
  </div>
  ```

## Basic Layout - Web

- Vertical Layout: 
  - body (w-[1440px]) 
    - Header (Fixed height w-full) <!-- bg: bg-white -->
    - Content Container(w-full flex):
      - Left Sider - if present (flex-shrink-0 min-w-fit max-w-xs) <!-- bg: bg-[#FEFCF9] -->
      - Main Content Area (flex-1 overflow-x-hidden)
      - Right Sider - if present (flex-shrink-0 min-w-fit max-w-xs) <!-- bg: bg-[#FEFCF9] -->
    - Footer - if present (Fixed height w-full)

- Horizontal Layout (at least one of the left/right siders must be present, or both):
  - body (w-[1440px] flex)
    - Left Sider (Optional)<!-- bg: bg-white -->
    - content container:
      - Header (Optional)<!-- bg: bg-[#FEFCF9] -->
      - main content area
      - Footer (Optional)
    - Right Sider (Optional)

## Page Layout - Web

```html
<body class="w-[1440px] min-h-[900px] font-[-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif] leading-[1.5] bg-[#FEFCF9]">

</body>
```

## Tailwind Component Examples

### Basic
- **Button**: 
  - example 1(primary button):
    - button: `flex items-center px-6 py-3 bg-[#4A8B5A] text-white rounded-lg hover:bg-[#386843] transition-colors`
      - span: 开始优化简历
  - example 2(secondary button):
    - button: `flex items-center px-6 py-3 border border-[#4A8B5A] text-[#4A8B5A] rounded-lg hover:bg-[#E8F3EA] transition-colors`
      - span: 了解更多
  - example 3(text button):
    - button: `flex items-center text-[#4A8B5A] hover:text-[#386843] transition-colors`
      - span: 取消

- **Label/Tag/Badge**: 
    - div: `flex items-center px-3 py-1 bg-[#E8F3EA] text-[#386843] rounded-full text-sm`
      - span: 推荐

### Data Entry
- **Progress bars**: `h-2 bg-[#F2F0EB] rounded-full`
  - filled: `h-2 bg-[#4A8B5A] rounded-full`
- **Input Fields**: `px-4 py-3 border border-[#E8F0E9] rounded-lg focus:border-[#4A8B5A] focus:shadow-[0_0_0_3px_rgba(74,139,90,0.2)] bg-white`
- **Checkbox and radio button**
  - default: `bg-[#F8F6F2]`
  - checked: `bg-[#4A8B5A] text-white`

### Container
- **Navigation Menu - horizontal**
    - example 1(Basic horizontal navigation):
        - Nav Container: `flex items-center gap-8 px-6 py-4 bg-white border-b border-[#E8F0E9]`
        - Menu Item: `flex items-center gap-2 text-[#4A524E] hover:text-[#4A8B5A] transition-colors`
          - menu-text: 
          - dropdown-icon (if applicable): `w-4 h-4`

- **Card**
    - example 1(Main content card):
        - Card: `bg-white rounded-lg p-6 shadow-[0_4px_12px_rgba(74,139,90,0.12)] border border-[#E8F0E9]`
        - Content area: `flex flex-col gap-4`
          - card-title: `text-xl font-semibold text-[#1A1F1C]`
          - card-content: `text-[#4A524E]`
    
    - example 2(Feature card):
        - Card: `bg-white rounded-lg p-5 hover:shadow-[0_6px_20px_rgba(74,139,90,0.15)] transition-shadow border border-[#E8F0E9]`
        - Icon area: `w-12 h-12 bg-[#E8F3EA] rounded-lg flex items-center justify-center mb-4`
          - icon: `w-6 h-6 text-[#4A8B5A]`
        - Text area: `flex flex-col gap-3`
          - card-title: `text-base font-semibold text-[#1A1F1C]`
          - card-subtitle: `text-sm text-[#7A827E]`
    
    - example 3(Status card):
        - Card: `bg-[#E8F3EA] rounded-lg p-4 border-l-4 border-[#4A8B5A]`
        - Content: `flex items-start gap-3`
          - status-icon: `w-5 h-5 text-[#4A8B5A] mt-0.5`
          - text-content: `flex-1`
            - title: `text-sm font-semibold text-[#386843]`
            - description: `text-sm text-[#4A524E]`

## Additional Notes

这个样式指南专门为ResumeAI Pro简历优化平台设计，体现了专业性与友好性的平衡。温暖的翠绿色传达成长和成功，而温暖的橙色点缀增加了活力和鼓励感。整体设计现代简洁，同时通过精致的细节（如微妙的阴影和圆角）提升用户体验的舒适度和专业感。