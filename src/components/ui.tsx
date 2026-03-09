"use client";

export function MetricCard({
  label,
  value,
  subtext,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  subtext?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <p className="mb-1 text-xs tracking-wider text-gray-500 uppercase">{label}</p>
      <p className={`text-2xl font-bold ${accent || ""}`}>{value}</p>
      {subtext && <p className="mt-1 text-xs text-gray-500">{subtext}</p>}
    </div>
  );
}
