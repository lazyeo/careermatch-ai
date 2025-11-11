# Development Guide

## 🛠️ Development Setup

### Local Environment Setup

1. **Install pnpm** (if not already installed)
   ```bash
   npm install -g pnpm@8
   ```

2. **Install all dependencies**
   ```bash
   pnpm install
   ```

3. **Set up Supabase**
   - Create a free account at https://supabase.com
   - Create a new project
   - Copy your project URL and anon key
   - Create `.env.local` in `apps/web/`:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     ```
   - Run the migration from `supabase/migrations/20250101000000_initial_schema.sql` in the SQL Editor

4. **Set up OpenAI API**
   - Get API key from https://platform.openai.com/api-keys
   - Add to `.env.local`:
     ```env
     OPENAI_API_KEY=sk-...
     ```

5. **Start the development server**
   ```bash
   pnpm web:dev
   ```

---

## 📁 Project Organization

### Apps Structure

#### `apps/web` - Next.js Application
```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth routes group
│   │   ├── (dashboard)/       # Dashboard routes group
│   │   ├── api/               # API routes
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── ui/                # Base UI components
│   │   ├── features/          # Feature-specific components
│   │   └── layouts/           # Layout components
│   └── lib/                   # Utilities and helpers
│       ├── supabase/          # Supabase client
│       ├── openai/            # OpenAI integration
│       └── utils/             # Utility functions
├── public/                    # Static assets
├── next.config.js
├── tailwind.config.ts
└── package.json
```

### Packages Structure

#### `packages/ui` - Component Library
```
packages/ui/
├── src/
│   ├── components/            # React components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── SkillTag.tsx
│   │   └── MatchScoreBadge.tsx
│   ├── lib/
│   │   └── utils.ts           # Utility functions
│   └── index.ts               # Public exports
├── package.json
└── README.md                  # Package documentation
```

#### `packages/shared` - Shared Types
```
packages/shared/
├── src/
│   ├── types/                 # TypeScript types
│   │   ├── resume.ts
│   │   ├── job.ts
│   │   ├── application.ts
│   │   └── user.ts
│   ├── constants/             # Constants
│   │   └── index.ts
│   └── index.ts
└── package.json
```

---

## 🎨 Styling Guidelines

### Tailwind CSS Usage

We use a custom Tailwind configuration based on the Paraflow design system:

**Primary Colors**
- `primary-500`: Main brand color (#4A8B5A)
- `accent-500`: Accent color (#E67E22)

**Usage Examples**
```tsx
// Buttons
<button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg">
  Primary Action
</button>

// Cards
<div className="bg-white rounded-xl shadow-soft p-6">
  Content
</div>

// Text
<h1 className="text-3xl font-bold text-gray-900">Heading</h1>
<p className="text-gray-600">Body text</p>
```

### Component Styling

- Use Tailwind classes for styling
- Extract repeated patterns into components in `packages/ui`
- Use `cn()` utility for conditional classes
- Follow the design system colors

---

## 🗄️ Database Guidelines

### Working with Supabase

#### Querying Data

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

const supabase = createClientComponentClient<Database>()

// Fetch resumes
const { data, error } = await supabase
  .from('resumes')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
```

#### Row Level Security

All tables have RLS policies. Users can only access their own data.

#### Creating Migrations

```bash
# Create a new migration
supabase migration new your_migration_name

# Edit the file in supabase/migrations/
# Apply migration
pnpm db:push
```

---

## 🤖 AI Integration

### OpenAI Usage

We use OpenAI for:
- Job matching analysis (GPT-4)
- Resume optimization (GPT-4)
- Cover letter generation (GPT-4)
- Keyword extraction (GPT-3.5-turbo)

**Example: Job Matching**

```typescript
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    {
      role: 'system',
      content: 'You are an expert career advisor...',
    },
    {
      role: 'user',
      content: `Analyze this job posting: ${jobDescription}`,
    },
  ],
})
```

### Cost Optimization

- Cache analysis results in `job_analyses` table
- Use GPT-3.5-turbo for simple tasks
- Implement rate limiting
- Set max_tokens appropriately

---

## 🧪 Testing

### Unit Tests

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### E2E Tests (Coming Soon)

We'll use Playwright for end-to-end testing.

---

## 📦 Building for Production

### Build All Packages

```bash
pnpm build
```

This will:
1. Build all packages in the correct dependency order
2. Type-check all TypeScript code
3. Generate optimized production builds

### Build Specific Package

```bash
pnpm build --filter=web
pnpm build --filter=@careermatch/ui
```

---

## 🚀 Deployment

### Vercel Deployment (Frontend)

1. **Connect to Vercel**
   ```bash
   vercel
   ```

2. **Set Environment Variables**
   In Vercel Dashboard, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Supabase (Backend)

Already deployed when you created the project. Just run migrations:
```bash
pnpm db:push
```

---

## 🐛 Debugging

### Common Issues

**Issue: `pnpm install` fails**
- Make sure you're using pnpm@8 or higher
- Delete `node_modules` and `pnpm-lock.yaml`, then reinstall

**Issue: Next.js import errors**
- Check `transpilePackages` in `next.config.js`
- Make sure package is built: `pnpm build --filter=@careermatch/ui`

**Issue: Supabase connection errors**
- Verify environment variables
- Check if Supabase project is active
- Check RLS policies

**Issue: TypeScript errors**
- Run `pnpm type-check` to see all errors
- Regenerate database types: `pnpm db:generate`

---

## 🔧 Tools & Extensions

### Recommended VS Code Extensions

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript + JavaScript
- Supabase (syntax highlighting for SQL)

### Configuration Files

- `.vscode/settings.json` - VS Code settings
- `.prettierrc` - Code formatting
- `.eslintrc.json` - Linting rules

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Turborepo Documentation](https://turbo.build/repo/docs)

---

**Happy Coding! 🚀**
