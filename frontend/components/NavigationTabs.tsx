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
    <nav className="flex items-center justify-center gap-8 overflow-x-auto no-scrollbar py-4 border-b border-[var(--surface-border)] px-6 bg-[var(--background)]">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`py-2 shrink-0 transition-transform scale-95 active:scale-90 relative ${
              isActive
                ? "text-[var(--sci-red)] border-b-2 border-[var(--sci-red)]"
                : "text-[#888888] hover:text-white"
            }`}
          >
            <span className="font-sans text-sm font-semibold tracking-wide">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
