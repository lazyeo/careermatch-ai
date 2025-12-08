# Deployment Guide

## 1. Web Application (Vercel)

The web application is deployed on Vercel.
- **Production URL**: `https://cvto.work`
- **Preview URLs**: Generated automatically for each PR (e.g., `https://careermatch-ai-git-xxx.vercel.app`)

### Environment Variables
Ensure the following environment variables are set in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (or `CLAUDE_API_KEY` depending on configuration)

## 2. Browser Extension

The extension needs to be built specifically for the target environment because it hardcodes the API URL.

### Build for Production (`cvto.work`)
```bash
cd apps/extension
pnpm build:prod
# Output: build/prod/chrome-mv3
```

### Build for Local Development (`localhost:3000`)
```bash
cd apps/extension
pnpm build:dev
# Output: build/dev/chrome-mv3
```

### Build for Vercel Preview
To test the extension with a specific Vercel Preview deployment (e.g., `https://careermatch-ai-git-dev-lazyeo.vercel.app`), you must build it with that URL:

```bash
cd apps/extension
# Replace the URL with your actual preview URL
PLASMO_PUBLIC_API_URL=https://careermatch-ai-git-dev-lazyeo.vercel.app PLASMO_PUBLIC_NAME_SUFFIX=' (Preview)' plasmo build --target chrome-mv3
```
The output will be in `build/chrome-mv3-prod`. Load this folder into Chrome.

> **Note**: We have added `*.vercel.app` to the extension's host permissions, so it can correctly read authentication cookies from any Vercel preview URL.

## 3. Custom Domain Configuration
- **Domain**: `cvto.work`
- **DNS**: Configured in Vercel (A record / CNAME)
- **Supabase**: Auth settings should allow `https://cvto.work` as a redirect URL.
