# Glassmorphism - Sky
## Color
### Primary Colors
- **primary-base**: `text-[#7389c6]` or `bg-[#7389c6]` 
- **primary-light**: `bg-[#9AB0EB]`
- **primary-dark**: `bg-[#5167A4]`

### Background Colors
- **bg-page**: `page-bg`
- **bg-container-primary**: `bg-white/0` - Primary container with no fill color, no background. Most content should use colorless containers; glass style design relies on generous whitespace to create a refined, minimalist aesthetic.
- **bg-container-secondary**: `bg-white/20 glass-subtle` - for tags and buttons, with minimal use for cards (most cards should be placed directly on the background without visible card treatment)
- **bg-container-tertiary**: `bg-white/40 glass-strong` - for emphasized tags and buttons (rarely used for high-priority cards that require strong emphasis)

- **bg-container-inset**: `bg-black/1 glass-inset-subtle` - For input
- **bg-container-inset-strong**: `bg-black/2 glass-inset-strong` - For checkbox background, slider track

### Text Colors
- **color-text-primary**: `text-black`
- **color-text-secondary**: `text-black/50`
- **color-text-tertiary**: `text-black/35`
- **color-text-on-dark**: `text-white` - Text on dark backgrounds and primary color

### Functional Colors (Use sparingly; only for small icons, text, and tags)
- **color-error**: `bg-[#F38585]` or `text-[#F38585]` 
- **color-warning**:`bg-[#FFDCA5]` or `text-[#FFA10D]` 
- **color-success**:`bg-[#BEE2B3]` or `text-[#5EA448]` 
- **color-link**:`bg-[#B4CFFD]` or `text-[#7796ED]` 

### Divider & Single-Side Border Colors
Only use for long lists where visual separation is essential: Settings pages, Data tables/sheet, Long menus...
- **border-divider**: `border-black/8` - Border color for dividers
- **border-divider-bg**: `bg-black/8` - Background color for divider lines

## Font
### Font & Line Height
- **font-base**: font-[-apple-system,BlinkMacSystemFont,'Segoe UI'] - Regular UI copy using system font stack
- **line-height**: leading-[1.4]

### Font Sizes & Weights
- **text-label-small**: `text-[10px] font-normal`
- **text-label-medium**: `text-xs font-light`
- **text-label-large**: `text-xs font-normal`
- **text-body-small**: `text-xs font-light`
- **text-body-medium**: `text-sm font-light` - Default body size
- **text-body-large**: `text-base font-light`
- **text-title-small**: `text-lg font-light`
- **text-title-medium**: `text-xl font-normal`
- **text-title-large**: `text-2xl font-medium`
- **text-headline-small**: `text-xl font-normal`
- **text-headline-medium**: `text-2xl font-medium`
- **text-headline-large**: `text-3xl font-medium`
- **text-display-small**: `text-4xl font-semibold`
- **text-display-medium**: `text-5xl font-bold`
- **text-display-large**: `text-6xl font-semibold`

## Border Radius(in tailwind)
  - rounded-2xl - (24px) For small cards,photo in card
  - rounded-3xl - (36px) For medium elements: cards, panels, major containers, modal backgrounds
  - rounded-full - For small elements: buttons, tags, pills, input fields, chips and circular elements (avatars, floating action buttons, profile pictures)

## Create Boundaries (contrast of surface color, borders, dividers, shadows)
Glass style design is minimalist and relies on generous whitespace. In most cases, use bg-container-primary with no background, borders, or shadows. Other containers can leverage glass and luster effects to create visual boundaries.

## Layout & Spacing
- **Spacing Scale**:
  - **Tight**: 4px - Close-related elements within components.
  - **Standard**: 16px - Page(Main Content Area) padding, section gap and space, middle card padding
  - **Comfortable**: 20px - Large card and module padding.

## Custom CSS Classes
<!-- Important Note: Only generate the custom CSS classes declared here, Do NOT create any other custom CSS classes -->
```css
.page-bg{
  background: radial-gradient(106% 73% at 50% 18%, #F0F9FF 0%, #E0F2FE 100%);
}
.glass-subtle{
  box-shadow: inset 5px 0px 8px -3px rgba(255, 255, 255, 0.40), inset -5px 0px 8px -3px rgba(255, 255, 255, 0.40);
  backdrop-filter: blur(6px);
}

.glass-strong{
  box-shadow: inset 10px 0px 20px -10px rgba(255, 255, 255, 0.40), inset -10px 0px 20px -10px rgba(255, 255, 255, 0.40), inset -2px 0px 2px -1px #FFFFFF, inset 2px 0px 2px -1px #FFFFFF;
  backdrop-filter: blur(20px);
}

.glass-inset-subtle{
  box-shadow: inset 4px 4px 8px -4px rgba(0, 0, 0, 0.04);
}

.glass-inset-strong{
  box-shadow: inset 4px 4px 10px -4px rgba(0, 0, 0, 0.08);
}

```

## Assets
### Image
  - For normal `<img>`: object-cover
  - For `<img>` with:
    - Slight overlay: object-cover brightness-85
    - Heavy overlay: object-cover brightness-50

### Logo
- To protect copyright, do **NOT** use real product logos as a logo for a new product, individual user, or other company products.
- **Icon-based**:
  - **Graphic**: Use a simple, relevant icon from Lucide (e.g., `lucide:calendar` for a scheduler, `lucide:home` for a smart home app).

### Icon
- Use Lucide icons from Iconify.
- To ensure aesthetic layout, each icon should be centered in a square container matching the icon's size. This container is only for layout optimization and does not imply the icon has a background; other properties should be determined based on actual needs.
- Use Tailwind font size to control icon size
- Example:
  ```html
  <div class="flex items-center justify-center bg-transparent w-4 h-4">
  <iconify-icon icon="lucide:flag" class="text-base"></iconify-icon>
  </div>
  ```

## Basic Layout suggestions - Web
<!-- Critical Note: **MUST** follow the layout rules. -->
- Vertical Layout: 
  - body (w-[1440px]) 
    - Header (Fixed height w-full) <!-- bg: color-surface-primary-->
    - Content Container(w-full flex):
      - Left Sider - if present (flex-shrink-0 min-w-fit max-w-xs) <!-- bg: color-surface-secondary-->
      - Main Content Area (flex-1 overflow-x-hidden)
      - Right Sider - if present (flex-shrink-0 min-w-fit max-w-xs) <!-- bg: color-surface-secondary-->
    - Footer - if present (Fixed height w-full)

- Horizontal Layout (at least one of the left/right siders must be present, or both):
  - body (w-[1440px] flex)
    - Left Sider (Optional)<!-- bg: color-surface-primary-->
    - content container:
      - Header (Optional)<!-- bg: color-surface-secondary-->
      - main content area
      - Footer (Optional)
    - Right Sider (Optional)


## Page Layout - Web (*EXTREMELY* important)

```html
<!-- standard implementation for body. A specific body width needs to be defined, which changes based on user requirements -->
<body class="w-[1440px] min-h-[900px] page-bg font-[-apple-system,BlinkMacSystemFont,'Segoe UI'] leading-[1.4]">

</body>
```

## Tailwind Component Examples
<!-- Important Note: Use utility classes directly. Do NOT create custom CSS classes or add styles in <style> tags -->
### Basic
  - **Dividers**: Only use for long lists where visual separation is essential, such as settings pages, data tables/sheets, and long menus.
      ```html
      <!-- Showcase: Simple Divider Tag -->
      <div class="h-px bg-black/8 w-full"></div>

      <!-- Showcase: Data Table Row with horizontal and vertical dividers -->
      <div class="p-4 border-b border-white/8">
        <div class="grid grid-cols-3 gap-4">
          <span class="text-black border-r border-black/8 pr-4">Project Alpha</span>
          <span class="text-black border-r border-black/8 pr-4">Active</span>
          <span class="text-black/50">2024-01-15</span>
        </div>
      </div>
      ```
  - **Notification bell with badge**:
    bell: absolute top-0 right-0 w-3.5 h-3.5 text-[10px]

  - **Button**: <!-- Note: Use flex and items-center for the container-->
    - example 1(text button):
      - button: flex items-center
        - span: Cancel (button copy)
    - example 2(icon button):
      - button: flex items-center
        - icon
  - **Lable/Tag/Badge**: 
      - div: flex items-center <!-- Note: Use flex and items-center for the container-->
        - span: All (copy)

### Data Entry
  - **Checkbox and radio button**
    - default: bg-black/2 glass-inset-strong
    - checked: bg-black/2 or bg-[#7389c6]; text-white(color-text-on-dark)
  - **progress bars**
    - h-1.5

### Container
  - **Card**
    - example 1(Vertical card with image and text):
        - Card: bg-white/0 (or bg-white/20 glass-subtle) rounded-3xl flex flex-col p-4 gap-4
        - Image: rounded-2xl w-full
        - Text area: flex flex-col gap-3
          - card-title: 
          - card-subtitle: 
    - example 2(Horizontal card with image and text):
        - Card: bg-white/0 (or bg-white/20 glass-subtle) rounded-3xl flex p-4 gap-4
        - Image: rounded-2xl h-full
        - Text area: flex flex-col gap-3
          - card-title: 
          - card-subtitle: 
    - example 3(Image-focused card: no background or padding):
        - Card: flex flex-col gap-4
        - Image: rounded-3xl w-full
        - Text area: flex flex-col gap-3
          - card-title: 
          - card-subtitle: 
    - example 4(text-only cards, simple cards, such as Upgrade Card, Activity Summary Cards)
        - Card: bg-white/0 (or bg-white/20 glass-subtle or bg-white/40 glass-strong) rounded-3xl flex p-4


<colors_extraction>
#7389C6
#9AB0EB
#5167A4
radial-gradient(106% 73% at 50% 18%, #F0F9FF 0%, #E0F2FE 100%)
#FFFFFF00
#FFFFFF33
#FFFFFF66
#00000003
#00000005
#000000
#00000080
#00000059
#FFFFFF
#F38585
#FFDCA5
#FFA10D
#BEE2B3
#5EA448
#B4CFFD
#7796ED
#00000014
</colors_extraction>