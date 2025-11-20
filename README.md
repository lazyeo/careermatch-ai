# CareerMatch AI 🎯

> **Intelligent Job Search Assistant for the New Zealand Market**

CareerMatch AI is an AI-powered job search platform that helps job seekers discover opportunities, optimize resumes, track applications, and succeed in their career journey. Built with modern web technologies and designed specifically for the New Zealand job market.

![Status](https://img.shields.io/badge/status-MVP%20Development-orange)
![License](https://img.shields.io/badge/license-Private-red)

---

## ✨ Features

### Core Functionality (MVP)
- 🔐 **User Authentication** - Secure login with email/Google via Supabase Auth
- 📝 **Resume Management** - Create, edit, and manage multiple resume versions
- 💼 **Job Tracking** - Save and organize job opportunities from multiple sources
- 🤖 **AI Job Matching** - 9-dimension intelligent analysis powered by OpenAI
- 📊 **Application Tracking** - Monitor your application progress through 6 status stages
- 📈 **Dashboard Analytics** - Visualize your job search progress

### Coming Soon (Phase 2+)
- 🌐 **Browser Extension** - One-click job capture from Seek, LinkedIn, TradeMe
- ✍️ **AI Resume Optimizer** - Personalized suggestions for each application
- 📄 **Cover Letter Generator** - AI-powered customized cover letters
- 🎯 **Smart Recommendations** - Personalized job suggestions based on your profile
- 🎤 **Interview Prep** - AI-generated interview questions and tips

---

## 🏗️ Architecture

### Tech Stack

**Frontend**
- **Framework**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS + Custom Design System
- **State Management**: Zustand + TanStack Query
- **Form Handling**: React Hook Form + Zod validation
- **UI Components**: Custom component library (@careermatch/ui)
- **Icons**: Lucide React
- **Charts**: Recharts

**Backend**
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **API Layer**: Next.js API Routes + Serverless Functions
- **Heavy Compute**: Cloudflare Workers (job scraping, AI tasks)

**AI Services (Multi-Provider Support)** 🆕
- **Multiple AI Providers**: OpenAI, Codex, Claude, Gemini (via relay service)
- **Primary Use**: 9-dimension job matching, SWOT analysis, resume optimization
- **Relay Support**: Compatible with [claude-relay-service](https://github.com/Wei-Shaw/claude-relay-service)
- **Auto-Selection**: Intelligent provider selection (Claude > OpenAI > Codex > Gemini)
- **Cloudflare AI Workers**: (Future) Keyword extraction, text similarity

**DevOps**
- **Monorepo**: Turborepo + pnpm workspaces
- **Version Control**: Git + GitHub
- **Deployment**: Vercel (frontend) + Supabase (backend)
- **CI/CD**: GitHub Actions

### Project Structure

```
careermatch-ai/
├── apps/
│   ├── web/                    # Next.js main application
│   └── extension/              # Chrome browser extension (future)
├── packages/
│   ├── ui/                     # 🌟 Open-source UI components
│   ├── shared/                 # Shared TypeScript types
│   ├── database/               # Supabase client & utilities
│   ├── resume-parser/          # 🌟 Open-source resume parser
│   ├── ats-optimizer/          # 🌟 Open-source ATS optimizer
│   └── job-scraper/            # 🌟 Open-source scraper template
├── workers/
│   ├── job-extractor/          # Cloudflare Worker for scraping
│   └── ai-assistant/           # Cloudflare AI compute tasks
├── supabase/
│   ├── migrations/             # Database migrations
│   └── config.toml             # Supabase configuration
├── paraflow/                   # Original Paraflow design files
└── docs/                       # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Supabase CLI** (optional, for local development)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CareerMatch\ AI
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Copy the example file and configure:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` in project root:
   ```env
   # Supabase (Required)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # AI Provider (Choose at least ONE)
   # Option 1: OpenAI (Native)
   OPENAI_API_KEY=sk-xxx...
   OPENAI_BASE_URL=https://api.openai.com/v1

   # Option 2: Claude (Relay) - Recommended
   # CLAUDE_API_KEY=your-relay-api-key
   # CLAUDE_BASE_URL=https://your-relay-service.com/v1

   # Option 3: Codex (Relay)
   # CODEX_API_KEY=your-relay-api-key
   # CODEX_BASE_URL=https://your-relay-service.com/v1

   # Option 4: Gemini (Relay)
   # GEMINI_API_KEY=your-relay-api-key
   # GEMINI_BASE_URL=https://your-relay-service.com/v1
   ```

   > 📖 **详细配置指南**: 参见 [AI提供商配置文档](docs/AI_PROVIDERS_SETUP.md)

4. **Set up Supabase**

   **Option A: Using Supabase Cloud (Recommended for MVP)**
   - Create a project at [supabase.com](https://supabase.com)
   - Run the migration:
     ```bash
     # In Supabase Dashboard > SQL Editor, paste contents of:
     # supabase/migrations/20250101000000_initial_schema.sql
     ```

   **Option B: Local Supabase**
   ```bash
   supabase init
   supabase start
   supabase db push
   ```

5. **Start development server**
   ```bash
   pnpm dev
   # or specifically:
   pnpm web:dev
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

---

## 📦 Monorepo Commands

```bash
# Development
pnpm dev                 # Start all apps in dev mode
pnpm web:dev             # Start only web app
pnpm extension:dev       # Start only extension

# Building
pnpm build               # Build all packages and apps
pnpm build --filter=web  # Build specific package

# Code Quality
pnpm lint                # Lint all packages
pnpm type-check          # TypeScript type checking
pnpm format              # Format code with Prettier

# Database
pnpm db:generate         # Generate TypeScript types from DB
pnpm db:push             # Push migrations to database
pnpm db:reset            # Reset local database

# Cleanup
pnpm clean               # Remove all node_modules and build artifacts
```

---

## 🌟 Open Source Components

While the core business logic remains private, we've extracted several components that can benefit the developer community:

### 1. **@careermatch/ui** - Resume UI Component Library
Beautiful, accessible React components for building resume and job search UIs.

- Resume templates and preview components
- Job matching visualizations (radar charts, score badges)
- Application tracking timeline
- Skill tags with proficiency levels

**License**: MIT
**Status**: Ready for open source

### 2. **@careermatch/resume-parser** - Smart Resume Parser
Intelligent resume parsing tool that extracts structured data from PDF/DOCX files.

- Multi-format support (PDF, DOCX, plain text)
- Semantic section detection
- Experience and education extraction
- Skills and technologies identification

**License**: MIT
**Status**: In development

### 3. **@careermatch/ats-optimizer** - ATS Optimization Library
Algorithms and tools to optimize resumes for Applicant Tracking Systems.

- Keyword density analysis
- ATS-friendly formatting checks
- Compatibility scoring
- Optimization suggestions

**License**: MIT
**Status**: Planned

### 4. **@careermatch/job-scraper-template** - Job Scraper Framework
Configurable framework for extracting job postings from various websites.

- Playwright-based scraping
- JSON configuration for selectors
- Anti-bot evasion strategies
- Rate limiting and retries

**License**: MIT
**Status**: Planned

---

## 💰 Cost Breakdown (Free Tier)

| Service | Free Tier | MVP Usage |
|---------|-----------|-----------|
| **Vercel** | 100GB bandwidth/month | ✅ Sufficient |
| **Supabase** | 500MB DB + 1GB storage + 50K MAU | ✅ Sufficient (100-500 users) |
| **Cloudflare Workers** | 100K requests/day | ✅ Sufficient |
| **OpenAI API** | Pay-as-you-go | ⚠️ Estimate $5-20/month (testing) |

**Total MVP Cost**: $0-20/month

---

## 🗺️ Roadmap

### Phase 1: Foundation (Weeks 1-2) ✅
- [x] Monorepo setup with Turborepo
- [x] Next.js application scaffold
- [x] Tailwind CSS integration
- [x] Supabase configuration
- [x] Database schema design
- [x] UI component library foundation

### Phase 2: Core Features (Weeks 3-4)
- [ ] User authentication (Supabase Auth)
- [ ] Resume CRUD operations
- [ ] Basic resume editor
- [ ] Resume PDF export

### Phase 3: Job Management (Weeks 5-6)
- [ ] Manual job entry
- [ ] Job list with filters
- [ ] Job detail view
- [ ] OpenAI integration for matching

### Phase 4: AI Features (Weeks 7-8)
- [ ] 9-dimension job analysis
- [ ] Match score visualization
- [ ] Resume optimization suggestions
- [ ] Application tracking system

### Phase 5: Polish & Launch (Week 9+)
- [ ] Dashboard analytics
- [ ] Email notifications
- [ ] Performance optimization
- [ ] Beta testing
- [ ] Production deployment

---

## 🤝 Contributing

This is currently a private project. However, the open-source components listed above will accept contributions once they are published.

---

## 📄 License

**Core Application**: Private (not open source)
**Open Source Components**: MIT License (see individual packages)

---

## 🔗 Links

- **Design Files**: See `paraflow/` directory for original UI designs
- **Database Schema**: `supabase/migrations/`
- **Architecture Docs**: Coming soon

---

## 📞 Support

For questions or issues, please contact the development team.

---

**Built with ❤️ for the New Zealand job market**

*Last updated: 2025-01-11*