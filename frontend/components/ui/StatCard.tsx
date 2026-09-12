"use client";

import type { ReactNode } from "react";

type StatTone = "default" | "brand" | "ok" | "warn" | "err" | "info";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: string;
  tone?: StatTone;
  className?: string;
}

const VALUE_COLOR: Record<StatTone, string> = {
  default: "text-[var(--foreground)]",
  brand: "text-[var(--sci-red)]",
  ok: "text-[var(--ok)]",
  warn: "text-[var(--warn)]",
  err: "text-[var(--err)]",
  info: "text-[var(--info)]",
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
  className,
}: StatCardProps) {
  return (
    <div className={`sci-panel relative p-4 sm:p-5 ${className ?? ""}`}>
      <div className="sci-label flex items-center gap-1.5 text-[var(--text-low)]">
        {icon && (
          <span className="material-symbols-outlined !text-sm" aria-hidden>
            {icon}
          </span>
        )}
        <span>{label}</span>
      </div>
      <div
        className={`mt-2 font-mono text-2xl font-bold tracking-tight ${VALUE_COLOR[tone]}`}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </div>
      {hint && (
        <div className="mt-1 text-[11px] text-[var(--text-low)]">{hint}</div>
      )}
    </div>
  );
}
