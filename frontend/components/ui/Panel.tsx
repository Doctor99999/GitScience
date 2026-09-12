"use client";

import type { ReactNode } from "react";

export type PanelTone = "default" | "ok" | "warn" | "err" | "info";

interface PanelProps {
  tone?: PanelTone;
  className?: string;
  children: ReactNode;
}

const ACCENT: Record<PanelTone, string | null> = {
  default: null,
  ok: "bg-[var(--ok)]",
  warn: "bg-[var(--warn)]",
  err: "bg-[var(--err)]",
  info: "bg-[var(--info)]",
};

export function Panel({ tone = "default", className, children }: PanelProps) {
  return (
    <div className={`sci-panel ${className ?? ""}`}>
      {ACCENT[tone] && (
        <span
          className={`absolute left-0 top-0 bottom-0 w-0.5 ${ACCENT[tone]}`}
          aria-hidden
        />
      )}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-[var(--sci-red)]/50 via-white/10 to-transparent opacity-60"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute right-0 top-0 h-12 w-12 bg-gradient-to-bl from-white/[0.05] to-transparent"
        aria-hidden
      />
      {children}
    </div>
  );
}
