# CLAUDE.md — forge-dashboard

## What This Is

Next.js 16 web dashboard for the Egan Forge empire. Shows real-time status of all swarms, P&L, proposals, and system health. Deployed on Vercel.

## Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: Tailwind CSS v4 + custom components
- **Charts**: Recharts
- **Deploy**: Vercel (auto-deploy from GitHub main branch)
- **Port**: 3001 (local dev)

## Structure

```
src/app/
├── page.tsx              ← Main dashboard (swarm status overview)
├── layout.tsx            ← Root layout (dark mode)
├── assets/page.tsx       ← Portfolio / asset breakdown
├── financials/page.tsx   ← Revenue, costs, P&L
├── proposals/page.tsx    ← AI-generated optimization proposals
├── web3/page.tsx         ← Crypto wallet + on-chain data
├── api/                  ← API routes (health, status, proposals, telegram webhook)
├── globals.css           ← Tailwind imports + custom styles
└── components/           ← Shared UI components (charts, ui)
```

## Dev Commands

```bash
npm run dev                     # Start dev server (port 3001)
npm run build                   # Production build
npm run lint                    # ESLint
npm run format                  # Prettier format
npm run format:check            # Prettier check
npx tsc --noEmit                # Type check
```

## Key Rules

- **Next.js 16**: `params` is a Promise — must use `async function` + `await params` in page components
- **Tailwind v4**: Uses `@import "tailwindcss"` syntax, NOT `@tailwind` directives
- **Tailwind v4**: `@apply` with custom classes requires those classes defined in tailwind config
- Dark mode is default (class on `<html>`)
- API routes proxy to VPS services — check CORS and env vars
- Vercel auto-deploys from `main` branch — push = deploy
