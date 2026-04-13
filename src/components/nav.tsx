"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/* ═══════════════════════════════════════════════════════════════════
   NAV ITEMS — all pages in the empire dashboard
   ═══════════════════════════════════════════════════════════════════ */

const NAV_ITEMS = [
  { href: "/", label: "Command Center", icon: "⚡", section: "core" },
  { href: "/constellation", label: "Constellation", icon: "◉", section: "core" },
  { href: "/orchestrator", label: "Orchestrator", icon: "⬡", section: "core" },
  { href: "/financials", label: "Financials", icon: "◈", section: "money" },
  { href: "/revenue", label: "Revenue Intel", icon: "◆", section: "money" },
  { href: "/agents", label: "Agent Roster", icon: "◎", section: "ops" },
  { href: "/teams", label: "Teams", icon: "⬢", section: "ops" },
  { href: "/executive-log", label: "Exec Log", icon: "◇", section: "ops" },
  { href: "/proposals", label: "Proposals", icon: "▷", section: "ops" },
  { href: "/activity", label: "Activity Feed", icon: "◌", section: "ops" },
  { href: "/seo", label: "SEO Hub", icon: "✧", section: "ops" },
  { href: "/assets", label: "Assets", icon: "◍", section: "web3" },
  { href: "/web3", label: "Web3 & DeFi", icon: "◉", section: "web3" },
] as const;

const SECTION_LABELS: Record<string, string> = {
  core: "OVERVIEW",
  money: "FINANCIALS",
  ops: "OPERATIONS",
  web3: "ON-CHAIN",
};

const SECTION_ORDER = ["core", "money", "ops", "web3"];

/* ═══════════════════════════════════════════════════════════════════
   SIDEBAR NAV — full sidebar for desktop, horizontal for mobile
   ═══════════════════════════════════════════════════════════════════ */

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass-elevated sidebar-nav fixed top-0 left-0 z-40 hidden h-screen w-56 flex-col overflow-y-auto border-r border-[var(--border-dim)] lg:flex">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-[var(--border-dim)] px-5 py-5">
        <div className="gradient-border flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--surface-2)]">
          <span className="text-base font-black tracking-tighter text-cyan-400">EF</span>
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-white">Egan Forge</p>
          <p className="text-[10px] font-medium tracking-wider text-[var(--text-tertiary)] uppercase">
            CEO Dashboard
          </p>
        </div>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 px-3 py-4">
        {SECTION_ORDER.map((section) => (
          <div key={section} className="mb-4">
            <p className="mb-1.5 px-2 text-[10px] font-semibold tracking-[0.15em] text-[var(--text-muted)]">
              {SECTION_LABELS[section]}
            </p>
            {NAV_ITEMS.filter((i) => i.section === section).map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group mb-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150 ${
                    active
                      ? "bg-cyan-500/10 text-cyan-400 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.15)]"
                      : "text-[var(--text-secondary)] hover:bg-white/[0.03] hover:text-white"
                  }`}
                >
                  <span
                    className={`text-sm transition-transform duration-150 group-hover:scale-110 ${active ? "text-cyan-400" : "text-[var(--text-tertiary)]"}`}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                  {active && (
                    <span className="pulse-dot ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--border-dim)] px-4 py-3">
        <p className="text-[10px] text-[var(--text-muted)]">Egan Forge v3.0</p>
        <p className="text-[10px] text-[var(--text-muted)]">4-Model Consensus</p>
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MOBILE NAV — horizontal scrollable pill nav
   ═══════════════════════════════════════════════════════════════════ */

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="hide-scrollbar flex items-center gap-1.5 overflow-x-auto">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 ${
              active
                ? "bg-cyan-500/10 text-cyan-400 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.15)]"
                : "text-[var(--text-secondary)] hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            <span className="text-[11px]">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PAGE WRAPPER — handles sidebar offset
   ═══════════════════════════════════════════════════════════════════ */

export function PageShell({
  children,
  title,
  subtitle,
  lastUpdate,
  error,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  lastUpdate?: string;
  error?: string;
}) {
  return (
    <>
      <DashboardSidebar />
      <div className="bg-mesh min-h-screen lg:pl-56">
        <div className="mx-auto max-w-[1440px] p-4 md:p-6">
          {/* Header */}
          <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">{title}</h1>
              {subtitle && (
                <p className="mt-0.5 text-sm text-[var(--text-tertiary)]">
                  {subtitle}
                  {lastUpdate && (
                    <span className="ml-2 text-[var(--text-muted)]">Updated {lastUpdate}</span>
                  )}
                  {error && <span className="ml-2 text-xs text-red-400">({error})</span>}
                </p>
              )}
            </div>
            {/* Mobile nav */}
            <div className="lg:hidden">
              <DashboardNav />
            </div>
          </header>

          {children}
        </div>
      </div>
    </>
  );
}
