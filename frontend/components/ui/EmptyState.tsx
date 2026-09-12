"use client";

import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: string;
  title: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-10 text-center ${className ?? ""}`}
    >
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center border border-[var(--surface-border-strong)] bg-[var(--sci-red-dim)] text-[var(--sci-red)]">
          <span className="material-symbols-outlined text-xl" aria-hidden>
            {icon}
          </span>
        </div>
      )}
      {title && (
        <p className="font-display text-sm font-bold uppercase tracking-wide text-[var(--foreground)]">
          {title}
        </p>
      )}
      {body && (
        <p className="max-w-md text-[13px] leading-relaxed text-[var(--text-low)]">
          {body}
        </p>
      )}
      {action}
    </div>
  );
}
