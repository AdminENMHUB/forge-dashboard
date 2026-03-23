"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/constellation", label: "Constellation" },
  { href: "/financials", label: "Financials" },
  { href: "/agents", label: "Agents", accent: true },
  { href: "/revenue", label: "Revenue", accent: true },
  { href: "/executive-log", label: "Exec Log", accent: true },
  { href: "/assets", label: "Assets" },
  { href: "/web3", label: "Web3" },
  { href: "/proposals", label: "Proposals" },
  { href: "/activity", label: "Activity" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-2 overflow-x-auto">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        const base = item.accent
          ? "border border-cyan-800/50 bg-cyan-950/30 text-cyan-400 hover:bg-cyan-900/40 hover:text-cyan-300"
          : active
            ? "bg-gray-700 text-white"
            : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white";
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${base}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
