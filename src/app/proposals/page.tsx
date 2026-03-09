"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Proposal {
  id: string;
  timestamp: string;
  category: string;
  title: string;
  description: string;
  target_swarm: string;
  expected_impact: string;
  priority: string;
  estimated_effort: string;
  auto_executable: boolean;
  status: string;
  model_agreement: number;
  resolution_notes: string;
}

interface Stats {
  proposed: number;
  approved: number;
  rejected: number;
  completed: number;
  deferred: number;
  total: number;
}

const priorityColor: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-green-500/20 text-green-400 border-green-500/30",
};

const categoryIcon: Record<string, string> = {
  cost_optimization: "\u{1F4B0}",
  revenue_growth: "\u{1F4C8}",
  risk_reduction: "\u{1F6E1}\uFE0F",
  architecture: "\u{1F3D7}\uFE0F",
  efficiency: "\u{26A1}",
  feature: "\u{2728}",
};

const statusColor: Record<string, string> = {
  proposed: "bg-blue-500/20 text-blue-400",
  approved: "bg-emerald-500/20 text-emerald-400",
  rejected: "bg-red-500/20 text-red-400",
  completed: "bg-gray-500/20 text-gray-400",
  deferred: "bg-yellow-500/20 text-yellow-400",
};

function timeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function ProposalCard({
  proposal,
  onAction,
  loading,
}: {
  proposal: Proposal;
  onAction: (id: string, action: string) => void;
  loading: string | null;
}) {
  const isActionable = proposal.status === "proposed";
  const isLoading = loading === proposal.id;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 sm:p-5">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-lg">{categoryIcon[proposal.category] || "\u{1F4CB}"}</span>
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
              priorityColor[proposal.priority] || priorityColor.medium
            }`}
          >
            {proposal.priority.toUpperCase()}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${statusColor[proposal.status] || statusColor.proposed}`}
          >
            {proposal.status.toUpperCase()}
          </span>
          {proposal.model_agreement >= 2 && (
            <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-400">
              {proposal.model_agreement}/2 consensus
            </span>
          )}
        </div>
        <span className="text-xs whitespace-nowrap text-gray-500">
          {timeAgo(proposal.timestamp)}
        </span>
      </div>

      {/* Title & Description */}
      <h3 className="mb-1 text-base font-semibold">{proposal.title}</h3>
      <p className="mb-3 line-clamp-3 text-sm text-gray-400">{proposal.description}</p>

      {/* Meta */}
      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <span>Target: {proposal.target_swarm}</span>
        <span>Effort: {proposal.estimated_effort}</span>
        <span>Impact: {proposal.expected_impact.slice(0, 80)}</span>
      </div>

      {/* Resolution notes */}
      {proposal.resolution_notes && (
        <p className="mb-3 text-xs text-gray-500 italic">{proposal.resolution_notes}</p>
      )}

      {/* Action buttons */}
      {isActionable && (
        <div className="flex gap-2">
          <button
            onClick={() => onAction(proposal.id, "approve")}
            disabled={isLoading}
            className="flex-1 rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
          >
            {isLoading ? "..." : "\u2705 Approve"}
          </button>
          <button
            onClick={() => onAction(proposal.id, "reject")}
            disabled={isLoading}
            className="flex-1 rounded-lg bg-red-600/80 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-red-700 active:scale-95 disabled:opacity-50"
          >
            {isLoading ? "..." : "\u274C Reject"}
          </button>
          <button
            onClick={() => onAction(proposal.id, "defer")}
            disabled={isLoading}
            className="flex-1 rounded-lg bg-gray-700 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-gray-600 active:scale-95 disabled:opacity-50"
          >
            {isLoading ? "..." : "\u23F8\uFE0F Defer"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState("proposed");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const fetchProposals = useCallback(async () => {
    try {
      const res = await fetch(`/api/proposals?status=${filter}`);
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();
      setProposals(data.proposals || []);
      setStats(data.stats || null);
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch");
    }
  }, [filter]);

  useEffect(() => {
    fetchProposals();
    const interval = setInterval(fetchProposals, 15000);
    return () => clearInterval(interval);
  }, [fetchProposals]);

  const handleAction = async (proposalId: string, action: string) => {
    setLoading(proposalId);
    try {
      const res = await fetch("/api/proposals/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal_id: proposalId, action }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed: ${res.status}`);
      }
      const result = await res.json();
      setToast(`${action.charAt(0).toUpperCase() + action.slice(1)}d: ${result.proposal_id}`);
      setTimeout(() => setToast(""), 3000);
      // Refresh
      await fetchProposals();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setLoading(null);
    }
  };

  const filterButtons = [
    { key: "proposed", label: "Pending", count: stats?.proposed },
    { key: "approved", label: "Approved", count: stats?.approved },
    { key: "completed", label: "Done", count: stats?.completed },
    { key: "rejected", label: "Rejected", count: stats?.rejected },
    { key: "deferred", label: "Deferred", count: stats?.deferred },
    { key: "all", label: "All", count: stats?.total },
  ];

  return (
    <div className="mx-auto min-h-screen max-w-3xl p-4 sm:p-6">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/" className="mb-1 block text-xs text-gray-500 hover:text-gray-300">
            &larr; Dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">CEO Proposals</h1>
          <p className="text-sm text-gray-500">Review and action improvement proposals</p>
        </div>
        <button
          onClick={fetchProposals}
          className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs hover:bg-gray-700"
        >
          Refresh
        </button>
      </header>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 left-4 z-50 animate-pulse rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg sm:left-auto sm:w-80">
          {toast}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Filter tabs */}
      <div className="-mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-2">
        {filterButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => setFilter(btn.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
              filter === btn.key
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {btn.label}
            {btn.count != null && btn.count > 0 && (
              <span className="ml-1.5 rounded-full bg-black/20 px-1.5 py-0.5 text-[10px]">
                {btn.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="mb-6 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-3 text-center">
            <p className="text-xl font-bold text-blue-400">{stats.proposed}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-3 text-center">
            <p className="text-xl font-bold text-emerald-400">{stats.approved + stats.completed}</p>
            <p className="text-xs text-gray-500">Approved/Done</p>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-3 text-center">
            <p className="text-xl font-bold">{stats.total}</p>
            <p className="text-xs text-gray-500">All Time</p>
          </div>
        </div>
      )}

      {/* Proposals list */}
      <div className="space-y-3">
        {proposals.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p className="mb-1 text-lg">No {filter === "all" ? "" : filter} proposals</p>
            <p className="text-sm">
              {filter === "proposed"
                ? "The improvement engine will generate proposals during its next cycle."
                : "Try a different filter to see proposals."}
            </p>
          </div>
        ) : (
          proposals.map((p) => (
            <ProposalCard key={p.id} proposal={p} onAction={handleAction} loading={loading} />
          ))
        )}
      </div>

      {/* Footer */}
      <footer className="mt-8 border-t border-gray-800 pt-4 text-center text-xs text-gray-600">
        EganForge | CEO Approval Flow | Auto-refreshes every 15s
      </footer>
    </div>
  );
}
