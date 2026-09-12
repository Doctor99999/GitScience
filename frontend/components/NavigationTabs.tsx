"use client";

import React, { useRef, useState, useEffect } from "react";
import type { TranslationDict } from "../lib/translations";

export type TabKey =
  | "notary"
  | "inspector"
  | "library"
  | "zk"
  | "passport"
  | "review"
  | "maas"
  | "amanat"
  | "court"
  | "vampire"
  | "editorial"
  | "dashboard"
  | "preregistration";

interface NavigationTabsProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  t: TranslationDict;
}

export default function NavigationTabs({
  activeTab,
  setActiveTab,
  t,
}: NavigationTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showFadeRight, setShowFadeRight] = useState(true);
  const [showFadeLeft, setShowFadeLeft] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: "notary", label: t.tabNotary, icon: "shield" },
    { key: "inspector", label: t.tabInspector, icon: "search" },
    { key: "library", label: t.tabLibrary, icon: "inventory_2" },
    { key: "zk", label: t.tabZk, icon: "lock" },
    { key: "passport", label: t.tabPassport, icon: "badge" },
    { key: "review", label: t.tabReview, icon: "rate_review" },
    { key: "editorial", label: t.tabEditorial || "Editorial", icon: "newspaper" },
    { key: "dashboard", label: t.tabDashboard || "Dashboard", icon: "dashboard" },
    { key: "preregistration", label: t.tabPreregistration || "Preregistration", icon: "assignment" },
    { key: "maas", label: t.tabMaas, icon: "bolt" },
    { key: "amanat", label: t.tabAmanat, icon: "account_balance_wallet" },
    { key: "court", label: t.tabCourt, icon: "gavel" },
    { key: "vampire", label: t.tabVampire, icon: "hub" },
  ];

  // Edge-fade state: is there more content to scroll on each side?
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const checkFades = () => {
      const maxLeft = el.scrollWidth - el.clientWidth - 2;
      setShowFadeLeft(el.scrollLeft > 4);
      setShowFadeRight(el.scrollLeft < maxLeft);
    };

    checkFades();
    el.addEventListener("scroll", checkFades, { passive: true });
    window.addEventListener("resize", checkFades);
    window.addEventListener("orientationchange", checkFades);

    return () => {
      el.removeEventListener("scroll", checkFades);
      window.removeEventListener("resize", checkFades);
      window.removeEventListener("orientationchange", checkFades);
    };
  }, []);

  // Close the overflow menu on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return;

    const onDocPointer = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onDocPointer);
    document.addEventListener("touchstart", onDocPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocPointer);
      document.removeEventListener("touchstart", onDocPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // Scroll active tab into view
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeBtn = el.querySelector(`[data-tab="${activeTab}"]`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeTab]);

  return (
    <nav className="relative w-full border-b border-[var(--surface-border)] bg-[var(--background)]">
      <div className="relative mx-auto flex w-full max-w-7xl items-stretch">
        {/* Scrollable tab bar */}
        <div
          ref={scrollRef}
          className="tab-scroll relative flex min-w-0 flex-1 items-center overflow-x-auto px-1 py-2 sm:py-3"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                data-tab={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`sci-focus shrink-0 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 transition-colors relative whitespace-nowrap rounded-none ${
                  isActive
                    ? "text-[var(--sci-red)] border-b-2 border-[var(--sci-red)] font-bold bg-[var(--sci-red)]/5"
                    : "text-[var(--text-low)] hover:text-[var(--foreground)] hover:bg-white/5"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined !text-[14px]" aria-hidden>
                    {tab.icon}
                  </span>
                  <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.08em] uppercase">
                    {tab.label}
                  </span>
                </span>
              </button>
            );
          })}

          {showFadeRight && (
            <div
              className="pointer-events-none absolute top-0 bottom-0 right-0 z-10 w-8 sm:w-10"
              style={{ background: "linear-gradient(to right, transparent, var(--background))" }}
            />
          )}
          {showFadeLeft && (
            <div
              className="pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-8 sm:w-10"
              style={{ background: "linear-gradient(to left, transparent, var(--background))" }}
            />
          )}
        </div>

        {/* Overflow menu — guarantees every tab is one tap away */}
        <div ref={menuRef} className="relative z-20 flex shrink-0 items-stretch border-l border-[var(--surface-border)]">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label={t.allTabsBtn}
            title={t.allTabsBtn}
            className={`sci-focus flex items-center gap-1 px-2.5 sm:px-3 font-mono text-[10px] uppercase tracking-widest transition-colors ${
              menuOpen
                ? "bg-[var(--sci-red)]/10 text-[var(--sci-red)]"
                : "text-[var(--text-low)] hover:bg-white/5 hover:text-[var(--foreground)]"
            }`}
          >
            <span className="material-symbols-outlined !text-[16px]" aria-hidden>more_horiz</span>
            <span className="hidden sm:inline">{t.allTabsBtn}</span>
          </button>

          {menuOpen && (
            <div
              className="absolute top-full right-0 z-50 w-64 border border-[var(--surface-border)] bg-[var(--surface-hi)] shadow-2xl"
              role="menu"
              aria-label={t.allTabsBtn}
            >
              <span
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-[var(--sci-red)]/50 via-white/10 to-transparent"
                aria-hidden
              />
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    role="menuitem"
                    onClick={() => {
                      setActiveTab(tab.key);
                      setMenuOpen(false);
                    }}
                    className={`sci-focus flex w-full items-center gap-2.5 border-l-2 px-3 py-2.5 text-left font-mono text-[11px] uppercase tracking-wide transition-colors ${
                      isActive
                        ? "border-[var(--sci-red)] bg-[var(--sci-red)]/10 text-[var(--sci-red)]"
                        : "border-transparent text-[var(--text-mid)] hover:bg-white/5 hover:text-[var(--foreground)]"
                    }`}
                  >
                    <span className="material-symbols-outlined !text-base" aria-hidden>
                      {tab.icon}
                    </span>
                    <span className="truncate">{tab.label}</span>
                    {isActive && (
                      <span className="ml-auto material-symbols-outlined !text-[14px]" aria-hidden>
                        chevron_right
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}