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
    <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs font-mono select-none">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl shrink-0 transition-all font-semibold flex items-center gap-1.5 ${
              isActive
                ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 scale-[1.02]"
                : "bg-[#0e1726]/90 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800"
            }`}
          >
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
