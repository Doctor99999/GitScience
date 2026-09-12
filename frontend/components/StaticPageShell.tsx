"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { ReactNode } from "react";

export type StaticLang = "KZ" | "RU" | "EN";

export function useStaticLang(): [StaticLang, (l: StaticLang) => void] {
  const [lang, setLang] = useState<StaticLang>("KZ");
  return [lang, setLang];
}

const BACK_LABEL: Record<StaticLang, string> = {
  KZ: "Басты бетке қайту",
  RU: "На главную",
  EN: "Return Home",
};

interface StaticPageShellProps {
  lang: StaticLang;
  setLang: (l: StaticLang) => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function StaticPageShell({
  lang,
  setLang,
  title,
  subtitle,
  children,
}: StaticPageShellProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--surface-border)] pb-4">
          <Link
            href="/"
            className="sci-focus inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[var(--text-low)] transition-colors hover:text-[var(--sci-red)]"
          >
            <span className="material-symbols-outlined !text-[14px]" aria-hidden>
              arrow_back
            </span>
            {BACK_LABEL[lang]}
          </Link>

          <div className="flex shrink-0 items-center border border-[var(--surface-border)]">
            {(["KZ", "RU", "EN"] as const).map((l) => {
              const isActive = lang === l;
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  aria-pressed={isActive}
                  className={`sci-focus px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors ${
                    isActive
                      ? "bg-[var(--sci-red)] font-bold text-black"
                      : "text-[var(--text-low)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-8">
          <div className="sci-label mb-2 text-[var(--sci-red)]">GitScience™ Sovereign Protocol</div>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-[var(--foreground)] sm:text-3xl">
            {title}
          </h1>
          {subtitle && <p className="mt-2 font-mono text-[11px] text-[var(--text-low)]">{subtitle}</p>}
          <span
            className="mt-4 block h-px w-full bg-gradient-to-r from-[var(--sci-red)] via-white/10 to-transparent"
            aria-hidden
          />
        </div>

        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}