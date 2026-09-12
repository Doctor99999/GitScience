"use client";

import type { ReactNode } from "react";

export type BadgeVariant =
  | "default"
  | "brand"
  | "ok"
  | "warn"
  | "err"
  | "info";

interface BadgeProps {
  variant?: BadgeVariant;
  icon?: string;
  className?: string;
  children: ReactNode;
}

const BADGE: Record<BadgeVariant, string> = {
  default: "border-[var(--surface-border)] bg-white/[0.03] text-[var(--text-mid)]",
  brand: "border-[var(--sci-red)]/40 bg-[var(--sci-red-dim)] text-[var(--sci-red)]",
  ok: "border-[var(--ok)]/40 bg-[var(--ok-dim)] text-[var(--ok)]",
  warn: "border-[var(--warn)]/40 bg-[var(--warn-dim)] text-[var(--warn)]",
  err: "border-[var(--err)]/40 bg-[var(--err-dim)] text-[var(--err)]",
  info: "border-[var(--info)]/40 bg-[var(--info-dim)] text-[var(--info)]",
};

export function Badge({
  variant = "default",
  icon,
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={`sci-label inline-flex items-center gap-1.5 border px-2 py-0.5 ${BADGE[variant]} ${className ?? ""}`}
      style={{ borderRadius: "var(--radius-chip)" }}
    >
      {icon && (
        <span className="material-symbols-outlined !text-[1em]" aria-hidden>
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}
