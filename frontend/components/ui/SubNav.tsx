"use client";

import type { ReactNode } from "react";

interface SubNavItem {
  key: string;
  label: ReactNode;
}

interface SubNavProps {
  items: SubNavItem[];
  active: string | null | undefined;
  onChange: (key: string) => void;
  className?: string;
}

export function SubNav({ items, active, onChange, className }: SubNavProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-0 border-b border-[var(--surface-border)] ${className ?? ""}`}
      role="tablist"
    >
      {items.map((item) => {
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.key)}
            className={`sci-focus relative px-3.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${
              isActive
                ? "text-[var(--sci-red)]"
                : "text-[var(--text-low)] hover:text-[var(--foreground)]"
            }`}
          >
            {item.label}
            {isActive && (
              <span
                className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--sci-red)] shadow-[0_0_12px_var(--sci-red-glow)]"
                aria-hidden
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
