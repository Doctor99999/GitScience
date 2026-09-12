"use client";

import type { ReactNode } from "react";

interface SectionHeaderProps {
  icon?: string;
  kicker?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  className?: string;
}

export function SectionHeader({
  icon,
  kicker,
  title,
  subtitle,
  right,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={`flex items-start justify-between gap-4 border-b border-[var(--surface-border)] pb-4 ${className ?? ""}`}
    >
      <div className="min-w-0">
        {(icon || kicker) && (
          <div className="sci-label mb-1.5 flex items-center gap-2 text-[var(--sci-red)]">
            {icon && (
              <span className="material-symbols-outlined !text-sm" aria-hidden>
                {icon}
              </span>
            )}
            {kicker && <span>{kicker}</span>}
          </div>
        )}
        <h2 className="font-display text-lg font-extrabold uppercase tracking-tight text-[var(--foreground)] sm:text-xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-[var(--text-low)] text-[13px]">{subtitle}</p>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}
