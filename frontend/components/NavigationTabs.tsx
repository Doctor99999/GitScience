"use client";

import React from "react";

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
  | "vampire";

interface NavigationTabsProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  t: any;
}

export default function NavigationTabs({
  activeTab,
  setActiveTab,
  t,
}: NavigationTabsProps) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: "notary", label: t.tabNotary },
    { key: "inspector", label: t.tabInspector },
    { key: "library", label: t.tabLibrary },
    { key: "zk", label: t.tabZk },
    { key: "passport", label: t.tabPassport },
    { key: "review", label: t.tabReview },
    { key: "maas", label: t.tabMaas },
    { key: "amanat", label: t.tabAmanat },
    { key: "court", label: t.tabCourt },
    { key: "vampire", label: t.tabVampire },
  ];

  return (
    <nav className="w-full border-b border-[var(--surface-border)] bg-[var(--background)]">
      <div className="w-full max-w-7xl mx-auto overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-0 sm:gap-1 min-w-0 px-1 sm:px-2 py-2 sm:py-3">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 px-2.5 sm:px-4 py-1.5 sm:py-2 transition-colors relative whitespace-nowrap rounded-none ${
                  isActive
                    ? "text-[var(--sci-red)] border-b-2 border-[var(--sci-red)] font-bold bg-[var(--sci-red)]/5"
                    : "text-[#888888] hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="font-sans text-[10px] sm:text-xs md:text-sm tracking-wide">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
