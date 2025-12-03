# 🚀 CareerMatch AI Deployment Guide

You have registered **`cvto.work`**. Here is your specific configuration checklist.

## 1. 🌍 Vercel (The Web App)
*   **Action**: Go to Vercel Project Settings > Domains.
*   **Add Domain**: Add `cvto.work` (and optionally `www.cvto.work`).
*   **DNS**: Follow Vercel's instructions to update your DNS records (usually A record or CNAME) at your domain registrar.
*   **Environment Variables**:
    *   Update `NEXT_PUBLIC_APP_URL` to `https://cvto.work`.

## 2. ⚡ Supabase (Authentication)
*   **Action**: Go to Supabase Dashboard > Authentication > URL Configuration.
*   **Site URL**: Set to `https://cvto.work`.
*   **Redirect URLs**: Add the following:
    *   `https://cvto.work/auth/callback`
    *   `https://cvto.work/**` (Wildcard for safety)
    *   *Keep `http://localhost:3000/**` for local development.*

## 3. 🧩 Browser Extension (The Connector)
*   **Action**: Update the build script to point to your new stable domain.
    1.  Open `apps/extension/package.json`.
    2.  Update the `build:prod` script:
        ```json
        "build:prod": "PLASMO_PUBLIC_API_URL=https://cvto.work plasmo build --dist-dir build/prod"
        ```
    3.  **Rebuild**: Run `pnpm build:prod`.
    4.  **Distribute**: Load the new `build/prod/chrome-mv3` folder into Chrome.

## ✅ Verification
1.  Deploy Web App to Vercel.
2.  Wait for DNS propagation (usually minutes, up to 24h).
3.  Visit `https://cvto.work` and login.
4.  Install the new Extension build.
5.  Open a job page -> Click Save -> Check if it appears on `https://cvto.work/dashboard`.

## 💡 Pro Tip: Use a Stable Domain
To avoid this "Configuration Hell", **buy a custom domain early** (e.g., `$10/year`).
*   Point Vercel to `app.yourdomain.com`.
*   Configure Supabase once.
*   Configure Extension once.
*   Even if you switch from Vercel to AWS later, the domain stays the same, and you don't need to update the extension users!

## 🔄 CI/CD Automation (Advanced)
You can automate the extension build in GitHub Actions:
1.  Set `PLASMO_PUBLIC_API_URL` as a GitHub Secret.
2.  On push to `main`, run the build script.
3.  Upload the `build/prod/chrome-mv3` folder as a Release Artifact.
