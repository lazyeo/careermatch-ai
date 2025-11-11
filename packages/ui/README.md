# @careermatch/ui

Beautiful, accessible UI components for resume and job search applications. Built with React, TypeScript, and Tailwind CSS.

## ⭐ Features

- 🎨 Modern, professional design tailored for job search UIs
- ♿ Accessible components following WAI-ARIA guidelines
- 🎭 Multiple variants and customization options
- 📦 Tree-shakeable exports
- 💪 Full TypeScript support
- 🎨 Tailwind CSS integration

## 📦 Installation

```bash
npm install @careermatch/ui
# or
pnpm add @careermatch/ui
# or
yarn add @careermatch/ui
```

### Peer Dependencies

This package requires the following peer dependencies:

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0"
}
```

## 🚀 Usage

### Button

```tsx
import { Button } from '@careermatch/ui'

export function Example() {
  return (
    <div>
      <Button variant="primary">Primary Button</Button>
      <Button variant="accent">Accent Button</Button>
      <Button variant="outline">Outline Button</Button>
    </div>
  )
}
```

### Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@careermatch/ui'

export function JobCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Software Engineer</CardTitle>
        <CardDescription>Acme Corp • Auckland, NZ</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Join our team and build amazing products...</p>
      </CardContent>
    </Card>
  )
}
```

### Skill Tag

```tsx
import { SkillTag } from '@careermatch/ui'

export function Skills() {
  return (
    <div className="flex gap-2">
      <SkillTag skill="React" level="expert" />
      <SkillTag skill="TypeScript" level="intermediate" />
      <SkillTag skill="Node.js" level="beginner" />
    </div>
  )
}
```

### Match Score Badge

```tsx
import { MatchScoreBadge } from '@careermatch/ui'

export function JobMatch() {
  return (
    <div>
      <MatchScoreBadge score={85} />
    </div>
  )
}
```

## 🎨 Tailwind CSS Configuration

This package uses Tailwind CSS for styling. Make sure to include the package path in your `tailwind.config.js`:

```js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@careermatch/ui/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4A8B5A',
          // ... other shades
        },
        accent: {
          DEFAULT: '#E67E22',
          // ... other shades
        },
      },
    },
  },
}
```

## 📚 Components

### Available Components

- **Button** - Versatile button component with multiple variants
- **Card** - Container component for grouping related content
- **SkillTag** - Display skills with proficiency levels
- **MatchScoreBadge** - Show job match scores with color coding

### Coming Soon

- **ResumeTemplate** - Pre-built resume templates
- **ResumePreview** - Real-time resume preview component
- **TimelineView** - Application tracking timeline
- **MatchRadar** - Radar chart for multi-dimension analysis
- **JobCard** - Specialized card for job postings

## 🤝 Contributing

Contributions are welcome! This is an open-source component library designed to help the job search community.

## 📄 License

MIT © CareerMatch AI

## 🔗 Links

- [Documentation](https://github.com/yourusername/careermatch-ui)
- [Report Issues](https://github.com/yourusername/careermatch-ui/issues)
- [Changelog](https://github.com/yourusername/careermatch-ui/releases)
