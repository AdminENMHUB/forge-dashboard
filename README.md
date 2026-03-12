# forge-dashboard

Next.js web dashboard for the Egan Forge empire. Shows real-time status of all swarms, P&L, proposals, and system health. All data proxied from VPS API. Deployed on Vercel.

## Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **UI**: Tailwind CSS v4 + custom components
- **Charts**: Recharts v3
- **Deploy**: Vercel (auto-deploy from GitHub `main` branch)

## Quick Start

```bash
npm install
npm run dev          # http://localhost:3001
```

## Architecture

All pages are client-side (`"use client"`) with polling-based data via `useApiPoller(url, intervalMs)`. API routes proxy to the VPS backend with ISR caching.

### API Routes

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

## Environment

Create `.env.local`:

```
HETZNER_API_URL=http://89.167.82.184:8080
```

**Required** — the app will throw a clear error at request time if this is missing.

## Development

```bash
npm run dev              # Dev server (port 3001)
npm run build            # Production build
npm run lint             # ESLint
npm run format           # Prettier
npx tsc --noEmit         # Type check
```

## Deploy

Push to `main` branch — Vercel auto-deploys.

## License

Proprietary — EganForge LLC
