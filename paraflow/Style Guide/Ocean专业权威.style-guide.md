# Elegant Light - Ocean

## Style Overview
- An elegant, minimalist light theme featuring a sophisticated deep sea blue primary color with a refined monochromatic palette.
- Characterized by sophisticated serif typography, ample whitespace, sharp right angles with no rounded corners, and subtle gradients for occasional accents, creating a modern and refined gallery-like aesthetic with mysterious oceanic undertones.

## Colors
- **Primary Color**: An elegant, sophisticated deep sea blue with mysterious depth. Use sparingly.
  - **color-primary-base**: #1B4A6B
  - **color-primary-lighter**: #D6E4ED
  - **color-primary-darker**: #0F2E42

- **color-page-background**: #FFFFFF
- **surface**:
  - **color-surface-primary**: #F8FAFB
  - **color-surface-secondary**: #F1F5F7
  - **color-surface-tertiary**: #E6EDF2

- **Text Colors**:
  - **color-text-primary**: #1A1A1A
  - **color-text-secondary**: #4A5568
  - **color-text-tertiary**: #718096
  - **color-text-on-dark**: #FFFFFF

- **Functional Colors**: 
  - **color-success**: #38A169
  - **color-warning**: #D69E2E
  - **color-error**: #E53E3E
  - **color-info**: #3182CE

## Typography
- **Font Stack**:
  - **font-family-base**: `"Kannada MN", "Georgia", "Times New Roman", "SimSong", "Apple Garamond", Baskerville, Times, serif`

- **Font Size & Weight**: 
  - **Caption**: 10px / 400
  - **Body**: 12px / 400
  - **Card Title / Emphasized Text**: 14px / 500
  - **Page Title**: 20px / 500
  - **Headline**: 30px / 500
  - **Display**: 40px / 500

- **Line Height**: 1.4

## Border Radius
  - **Small**: 0px
  - **Large**: 0px
  - **Full**: 0px

## Layout & Spacing
- **Grid System**: 
  - Based on an 8px grid system for consistent alignment.

- **Spacing Scale**: 
  - **Base Unit**: 8px
  - **Tight**: 4px - For close-related elements and padding within cards.
  - **Compact**: 8px - For list items and small gaps.
  - **Standard**: 24px - For general padding and margins.
  - **Comfortable**: 48px - For page margins and section spacing to create ample whitespace.


## Borders
- **Default**: `1px solid #F1F5F7`. Used for inputs, cards, and other elements needing subtle definition. `border border-[#F1F5F7]`

## Dividers
- No dividers are used. Separation is achieved through whitespace.

## Shadows & Effects
- No shadows are used to maintain a flat, minimalist aesthetic.
- A delicate, subtle linear gradient can be used for decorative accents, transitioning from `color-primary-lighter` to transparent.

## Assets
### Image

  - Always use `object-cover` for proper image scaling and cropping.

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
<body class="w-[1440px] min-h-[900px] bg-[#FFFFFF] font-['Kannada_MN','Georgia','Times_New_Roman','SimSong','Apple_Garamond',Baskerville,Times,serif] leading-[1.4]">

</body>
```

## Tailwind Component Examples
<!-- Important Note: Use utility classes directly. Do NOT create custom CSS classes or add styles in <style> tags -->
### Basic
- **Progress bars**: h-1.5
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

### Container

## Additional Notes

<colors_extraction>
#1B4A6B
#D6E4ED
#0F2E42
#FFFFFF
#F8FAFB
#F1F5F7
#E6EDF2
#1A1A1A
#4A5568
#718096
#38A169
#D69E2E
#E53E3E
#3182CE
</colors_extraction>