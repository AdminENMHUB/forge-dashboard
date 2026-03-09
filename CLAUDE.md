# CLAUDE.md — forge-dashboard

## What This Is

Next.js 16 web dashboard for the Egan Forge empire. Shows real-time status of all swarms, P&L, proposals, and system health. All data proxied from VPS API. Deployed on Vercel.

## Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **UI**: Tailwind CSS v4 + custom components
- **Charts**: Recharts v3
- **Deploy**: Vercel (auto-deploy from GitHub main branch)
- **Port**: 3001 (local dev)

## Structure

```
src/
├── app/
│   ├── page.tsx              ← Main dashboard (swarm status, KPIs, 30s auto-refresh)
│   ├── layout.tsx            ← Root layout (dark mode default, Geist font)
│   ├── assets/page.tsx       ← Multi-chain wallet view, allocation bars
│   ├── financials/page.tsx   ← Revenue by swarm, API costs, budget status
│   ├── proposals/page.tsx    ← CEO approval interface for AI optimization proposals
│   ├── web3/page.tsx         ← Base + Polygon wallets, AAVE yield, NFTs
│   ├── api/                  ← API routes (proxy to VPS, see table below)
│   └── globals.css           ← Tailwind imports + dark mode CSS variables
├── components/
│   ├── charts.tsx            ← PnlAreaChart, SwarmCostChart, CostDonutChart
│   └── ui.tsx                ← MetricCard (reusable KPI card)
└── lib/
    ├── hooks.ts              ← useApiPoller(url, intervalMs) — generic polling hook
    └── formatters.ts         ← formatUSD(), formatPct(), timeAgo(), truncateAddress()
```

## API Routes (proxy to VPS)

| Route                   | VPS Endpoint                 | Cache | Purpose                         |
| ----------------------- | ---------------------------- | ----- | ------------------------------- |
| `/api/health`           | `/api/health`                | 5s    | System health                   |
| `/api/status`           | `/api/status`                | 10s   | Swarm + empire overview         |
| `/api/financials`       | `/api/financials`            | 30s   | P&L, MRR, per-swarm metrics     |
| `/api/assets`           | `/api/assets`                | 30s   | Wallet balances, DeFi positions |
| `/api/costs`            | `/api/costs`                 | 60s   | API costs, budget tracking      |
| `/api/web3`             | `/api/web3`                  | 30s   | On-chain assets, gas            |
| `/api/proposals`        | `/api/proposals`             | 5s    | AI optimization proposals       |
| `/api/proposals/action` | POST `/api/proposals/action` | —     | Approve/reject/defer            |
| `/api/telegram/webhook` | POST `/api/telegram/webhook` | —     | Telegram forwarder              |

## Environment Variables (.env.local)

```
NEXT_PUBLIC_API_URL=http://89.167.82.184:8080
```

API routes also hardcode fallback: `process.env.HETZNER_API_URL || "http://89.167.82.184:8080"`

## Dev Commands

```bash
npm run dev                     # Start dev server (port 3001)
npm run build                   # Production build
npm run lint                    # ESLint
npm run format                  # Prettier format
npm run format:check            # Prettier check
npx tsc --noEmit                # Type check
```

## Key Patterns

- **All pages `"use client"`** — browser-only state, no SSR
- **`useApiPoller(url, 30000)`** — generic polling hook with abort controller, returns `{ data, error, loading, lastUpdate, refresh }`
- **ISR caching** — all GET routes use `revalidate` for incremental static regeneration
- **Color-coded metrics** — green (profit), red (loss), gray (neutral)
- **Progress bar** — tracks toward $15K/month revenue target

## Key Rules

- **Next.js 16**: `params` is a Promise — must use `async function` + `await params` in page components
- **Tailwind v4**: Uses `@import "tailwindcss"` syntax, NOT `@tailwind` directives
- **Tailwind v4**: `@apply` with custom classes requires those classes defined in tailwind config
- Dark mode is default (class on `<html>`)
- API routes proxy to VPS — check CORS and env vars if data isn't loading
- Vercel auto-deploys from `main` branch — push = deploy
- Telegram webhook always returns 200 (fire-and-forget)

## Never

- Hardcode VPS IP in client-side code (use env vars or API routes)
- Remove ISR caching from API routes (prevents VPS overload)
- Use SSR for dashboard pages (all data is dynamic, polling-based)
