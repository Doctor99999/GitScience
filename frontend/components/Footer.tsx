"use client";

import React from "react";
import type { TranslationDict } from "../lib/translations";
import type { TabKey } from "./NavigationTabs";
import { StatCard } from "./ui/StatCard";
import { CONTACTS, GITHUB_REPO_URL } from "../lib/constants";

interface FooterProps {
  t: TranslationDict;
  platformStats: {
    total_notarized_manuscripts: number;
    total_ledger_transactions: number;
    total_secured_scientific_value_usdt: number;
    total_court_arbitrations: number;
    blockchain_attestation_status: string;
    total_site_visits?: number;
    active_visitors_online?: number;
  };
  apiBase: string;
  onNavigateTab?: (tab: TabKey) => void;
}

export default function Footer({ t, platformStats, apiBase, onNavigateTab }: FooterProps) {
  const go = (tab: TabKey) => () => {
    onNavigateTab?.(tab);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="border-t border-[var(--surface-border)] bg-[var(--background)] mt-16 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-[var(--sci-red)] opacity-50 shadow-[0_0_20px_rgba(241,78,50,0.5)]"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10 relative z-10">

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          <StatCard
            label={t.statManuscripts}
            value={platformStats.total_notarized_manuscripts.toLocaleString()}
            icon="memory"
            tone="brand"
          />
          <StatCard
            label={t.statTransactions}
            value={platformStats.total_ledger_transactions.toLocaleString()}
            icon="hub"
            tone="brand"
          />
          <StatCard
            label={t.statSecuredValue}
            value={`$${platformStats.total_secured_scientific_value_usdt.toLocaleString()}`}
            icon="account_tree"
            tone="brand"
          />
          <StatCard
            label={t.statCourt}
            value={platformStats.total_court_arbitrations.toLocaleString()}
            icon="verified"
            tone="brand"
          />
          <StatCard
            label={t.statVisits}
            value={(platformStats.total_site_visits ?? 0).toLocaleString()}
            icon="public"
            tone="brand"
          />
          <StatCard
            label={t.statOnline}
            value={(platformStats.active_visitors_online ?? 0).toLocaleString()}
            icon="wifi_tethering"
            tone="ok"
          />
        </div>

        {/* Contact / Feedback CTA block */}
        <div
          className="border border-[var(--surface-border)] rounded-lg p-5 sm:p-7 grid gap-6 md:grid-cols-[1fr_auto] items-start"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          <div>
            <div className="sci-label flex items-center gap-1.5 text-[var(--sci-red)]">
              <span className="material-symbols-outlined !text-base" aria-hidden>forward_to_inbox</span>
              <span>{t.footerContactTitle}</span>
            </div>
            <h3 className="mt-1 font-display text-lg sm:text-xl font-bold uppercase tracking-tight text-[var(--foreground)]">
              {t.footerFeedback}
            </h3>
            <p className="mt-1 text-xs text-[var(--text-mid)] max-w-xl">{t.footerContactSub}</p>
          </div>
          <div className="grid gap-2 min-w-0 sm:min-w-[300px]">
            {CONTACTS.map((c) => (
              <a
                key={c.email}
                href={`mailto:${c.email}`}
                className="sci-focus flex items-center gap-2.5 border border-[var(--surface-border)] bg-[var(--carbon-gray)] px-3 py-2 text-[11px] text-[var(--foreground)] transition-colors hover:bg-[var(--surface-hi)]"
                style={{ borderRadius: "var(--radius-card)" }}
              >
                <span className="material-symbols-outlined !text-base text-[var(--sci-red)]" aria-hidden>
                  {c.icon}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-[10px] text-[var(--text-low)] uppercase tracking-wider">{c.label}</span>
                  <span className="block font-mono truncate">{c.email}</span>
                </span>
                <span className="ml-auto material-symbols-outlined !text-base text-[var(--text-low)]" aria-hidden>
                  arrow_forward
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Apple-style footer columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-[11px] text-[var(--text-mid)]">
          <div>
            <h4 className="font-mono uppercase tracking-widest text-[var(--text-low)] mb-3">{t.footerExplore}</h4>
            <ul className="space-y-2">
              <li><button onClick={go("notary")} className="sci-focus hover:text-[var(--sci-red)] transition-colors">{t.tabNotary}</button></li>
              <li><button onClick={go("zk")} className="sci-focus hover:text-[var(--sci-red)] transition-colors">{t.tabZk}</button></li>
              <li><button onClick={go("library")} className="sci-focus hover:text-[var(--sci-red)] transition-colors">{t.tabLibrary}</button></li>
              <li><button onClick={go("inspector")} className="sci-focus hover:text-[var(--sci-red)] transition-colors">{t.tabInspector}</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-mono uppercase tracking-widest text-[var(--text-low)] mb-3">{t.footerSovereign}</h4>
            <ul className="space-y-2">
              <li><button onClick={go("court")} className="sci-focus hover:text-[var(--sci-red)] transition-colors">{t.tabCourt}</button></li>
              <li><button onClick={go("review")} className="sci-focus hover:text-[var(--sci-red)] transition-colors">{t.tabReview}</button></li>
              <li><button onClick={go("editorial")} className="sci-focus hover:text-[var(--sci-red)] transition-colors">{t.tabEditorial || "Editorial"}</button></li>
              <li><button onClick={go("vampire")} className="sci-focus hover:text-[var(--sci-red)] transition-colors">{t.tabVampire}</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-mono uppercase tracking-widest text-[var(--text-low)] mb-3">{t.footerFeedback}</h4>
            <ul className="space-y-2">
              {CONTACTS.slice(0, 2).map((c) => (
                <li key={c.email}>
                  <a href={`mailto:${c.email}`} className="sci-focus hover:text-[var(--sci-red)] transition-colors">{c.email}</a>
                </li>
              ))}
              <li>
                <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer" className="sci-focus hover:text-[var(--sci-red)] transition-colors">GitHub</a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-mono uppercase tracking-widest text-[var(--text-low)] mb-3">API & Legal</h4>
            <ul className="space-y-2">
              <li><a href="/about" className="sci-focus hover:text-[var(--sci-red)] transition-colors">About Protocol</a></li>
              <li><a href="/terms" className="sci-focus hover:text-[var(--sci-red)] transition-colors">Terms of Service</a></li>
              <li><a href="/privacy" className="sci-focus hover:text-[var(--sci-red)] transition-colors">Privacy Policy</a></li>
              <li><a href={`${apiBase}/docs`} target="_blank" rel="noreferrer" className="sci-focus hover:text-[var(--sci-red)] transition-colors">Swagger API</a></li>
            </ul>
          </div>
        </div>

        {/* Attestation + footnote */}
        <div className="border-t border-[var(--surface-border)] pt-6 space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[var(--text-low)]">
            <span className="w-2 h-2 bg-[var(--sci-red)] shadow-[0_0_8px_rgba(241,78,50,1)] animate-pulse"></span>
            <span>{platformStats.blockchain_attestation_status}</span>
            <a href={`${apiBase}/docs`} target="_blank" rel="noreferrer" className="ml-auto hover:text-[var(--sci-red)] transition-colors">Protocol Telemetry</a>
          </div>
          <p className="text-[10px] text-[var(--text-faint)]">{t.footerFeedbackText}</p>
        </div>
      </div>

      {/* Legal bar */}
      <div className="border-t border-[var(--surface-border)] bg-[var(--carbon-gray)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono tracking-widest text-[var(--text-faint)]">
          <span>Copyright © 2026 GitScience Scuderia Protocol. All rights reserved.</span>
          <span className="text-[var(--text-low)]">SCIENCE WITH EVIDENCE</span>
        </div>
      </div>
    </footer>
  );
}