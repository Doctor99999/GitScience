"use client";

import React from "react";
import type { TranslationDict } from "../lib/translations";
import { StatCard } from "./ui/StatCard";

interface FooterProps {
  t: TranslationDict;
  platformStats: {
    total_notarized_manuscripts: number;
    total_ledger_transactions: number;
    total_secured_scientific_value_usdt: number;
    total_court_arbitrations: number;
    blockchain_attestation_status: string;
  };
  apiBase: string;
}

export default function Footer({ t, platformStats, apiBase }: FooterProps) {
  return (
    <footer className="border-t border-[var(--surface-border)] bg-[var(--background)] mt-16 pt-12 pb-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-[var(--sci-red)] opacity-50 shadow-[0_0_20px_rgba(241,78,50,0.5)]"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12 relative z-10">
        
        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
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
        </div>

        {/* Links & Attestation */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-mono uppercase tracking-widest border-t border-[var(--surface-border)] pt-8">
          <div className="flex flex-wrap items-center justify-center gap-6 text-[var(--text-low)]">
            <a href="/about" className="hover:text-[var(--sci-red)] transition-colors">About Protocol</a>
            <a href="/terms" className="hover:text-[var(--sci-red)] transition-colors">Terms of Service</a>
            <a href="/privacy" className="hover:text-[var(--sci-red)] transition-colors">Privacy Policy</a>
            <a href={`${apiBase}/docs`} target="_blank" rel="noreferrer" className="hover:text-[var(--sci-red)] transition-colors">Swagger API</a>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-low)]">
            <span className="w-2 h-2 bg-[var(--sci-red)] shadow-[0_0_8px_rgba(241,78,50,1)] animate-pulse"></span>
            <span>{platformStats.blockchain_attestation_status}</span>
          </div>
        </div>
        
        <div className="text-center text-[10px] font-mono tracking-widest text-[var(--text-faint)] mt-4">
          Copyright © 2026 GitScience Scuderia Protocol. All rights reserved.
        </div>
      </div>
    </footer>
  );
}