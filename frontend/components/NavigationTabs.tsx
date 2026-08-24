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
    <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 text-sm font-medium border-b border-white/10 px-4">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full shrink-0 transition-colors ${
              isActive
                ? "bg-white text-black font-semibold"
                : "text-[#86868b] hover:text-white hover:bg-[#1d1d1f]"
            }`}
          >
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
