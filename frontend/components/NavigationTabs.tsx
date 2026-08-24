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
    <nav className="flex items-center gap-6 overflow-x-auto no-scrollbar py-3 text-xs font-bold uppercase tracking-widest border-b border-[#222222] px-6 bg-[#0a0a0a]">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`py-3 shrink-0 transition-colors relative ${
              isActive
                ? "text-[var(--ferrari-red)]"
                : "text-[#888888] hover:text-white"
            }`}
          >
            <span>{tab.label}</span>
            {isActive && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--ferrari-red)]"></span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
