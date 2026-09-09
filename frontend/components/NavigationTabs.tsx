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
  const [showFade, setShowFade] = useState(false);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "notary", label: t.tabNotary },
    { key: "inspector", label: t.tabInspector },
    { key: "library", label: t.tabLibrary },
    { key: "zk", label: t.tabZk },
    { key: "passport", label: t.tabPassport },
    { key: "review", label: t.tabReview },
    { key: "editorial", label: t.tabEditorial || "Editorial" },
    { key: "dashboard", label: t.tabDashboard || "Dashboard" },
    { key: "preregistration", label: t.tabPreregistration || "Preregistration" },
    { key: "maas", label: t.tabMaas },
    { key: "amanat", label: t.tabAmanat },
    { key: "court", label: t.tabCourt },
    { key: "vampire", label: t.tabVampire },
  ];

  // Check if there's content to scroll right
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const checkFade = () => {
      const canScrollRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
      setShowFade(canScrollRight);
    };

    checkFade();
    el.addEventListener("scroll", checkFade, { passive: true });
    window.addEventListener("resize", checkFade);

    return () => {
      el.removeEventListener("scroll", checkFade);
      window.removeEventListener("resize", checkFade);
    };
  }, []);

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
    <nav className="w-full border-b border-[var(--surface-border)] bg-[var(--background)]">
      <div className="w-full max-w-7xl mx-auto relative">
        {/* Scrollable tab bar */}
        <div
          ref={scrollRef}
          className="tab-scroll flex items-center gap-0 overflow-x-auto px-1 py-2 sm:py-3"
          style={{ scrollSnapType: "x proximity" }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                data-tab={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 transition-colors relative whitespace-nowrap rounded-none ${
                  isActive
                    ? "text-[var(--sci-red)] border-b-2 border-[var(--sci-red)] font-bold bg-[var(--sci-red)]/5"
                    : "text-[#888888] hover:text-white hover:bg-white/5"
                }`}
                style={{ scrollSnapAlign: "start" }}
              >
                <span className="font-sans text-[10px] sm:text-xs md:text-sm tracking-wide">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right fade indicator */}
        {showFade && (
          <div className="absolute top-0 right-0 bottom-0 w-8 sm:w-10 pointer-events-none z-10"
            style={{ background: "linear-gradient(to right, transparent, var(--background))" }}
          />
        )}
      </div>
    </nav>
  );
}
