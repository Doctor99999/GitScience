"use client";

import React from "react";
import { ConnectKitButton } from "connectkit";
import type { TranslationDict } from "../lib/translations";
import type { ScholarProfile } from "../lib/types";

interface HeaderProps {
  lang: "KZ" | "RU" | "EN";
  setLang: (l: "KZ" | "RU" | "EN") => void;
  t: TranslationDict;
  activeScholar: ScholarProfile | null;
  setShowOrcidModal: (v: boolean) => void;
  setShowGuideModal: (v: boolean) => void;
  handleBiometricAuth: () => void;
  passkeyNotice: string | null;
}

export default function Header({
  lang,
  setLang,
  t,
  activeScholar,
  setShowOrcidModal,
  setShowGuideModal,
  handleBiometricAuth,
  passkeyNotice,
}: HeaderProps) {
  return (
    <header className="border-b border-[var(--surface-border)] bg-[var(--background)]/95 backdrop-blur-xl w-full">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <h1 className="font-display font-bold text-xl sm:text-2xl text-[var(--sci-red)] uppercase tracking-tight leading-none truncate">
            GitScience<span className="text-[var(--foreground)]">.</span>
          </h1>
          <span className="text-[9px] sm:text-[10px] font-mono uppercase px-1.5 sm:px-2 py-0.5 border border-[var(--surface-border)] text-[var(--foreground)] bg-[var(--carbon-gray)] tracking-widest shrink-0">
            SCUDERIA
          </span>
        </div>

        {/* Actions & Language */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto sm:ml-0">
          {/* AI Guide Button */}
          <button
            onClick={() => setShowGuideModal(true)}
            className="sci-btn-secondary px-2.5 sm:px-4 py-1.5 sm:py-2 text-[10px] whitespace-nowrap"
          >
            {t.guideBtn}
          </button>

          {/* Biometric Touch ID */}
          <button
            onClick={handleBiometricAuth}
            className="hidden md:inline-flex sci-btn-secondary px-3 py-1.5 text-[10px] items-center gap-1.5 shrink-0"
          >
            <span className="material-symbols-outlined text-[14px]">fingerprint</span>
            <span>Touch ID</span>
          </button>

          {/* Language Selector: KZ FIRST */}
          <div className="flex bg-[var(--carbon-gray)] p-0.5 sm:p-1 border border-[var(--surface-border)] shrink-0">
            {(["KZ", "RU", "EN"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2 sm:px-3 py-0.5 sm:py-1 font-mono text-[9px] sm:text-[10px] tracking-widest uppercase transition-colors ${
                  lang === l
                    ? "bg-[var(--sci-red)] text-white shadow-[0_0_10px_rgba(241,78,50,0.4)]"
                    : "text-[#888888] hover:text-white hover:bg-[#222222]"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Web3 Wallet Connection Button (ConnectKit) */}
          <div className="shrink-0 max-w-[140px] sm:max-w-none overflow-hidden">
            <ConnectKitButton />
          </div>

          {/* ORCID Scholar Login/Status Button */}
          {activeScholar ? (
            <div className="flex items-center gap-1 sm:gap-1.5 bg-emerald-950/50 border border-emerald-600/50 px-2 sm:px-3 py-1 rounded-lg text-xs shrink-0 max-w-[130px] sm:max-w-[180px]">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              <span className="font-mono text-emerald-300 font-semibold text-[10px] sm:text-xs truncate">
                {activeScholar.name}
              </span>
              <button
                onClick={() => setShowOrcidModal(true)}
                className="text-[10px] text-slate-400 hover:text-cyan-300 underline ml-0.5 sm:ml-1 font-mono shrink-0"
                title={t.switchScholar}
              >
                ⚙
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowOrcidModal(true)}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-lg shadow transition hover:opacity-90 font-mono shrink-0 whitespace-nowrap"
            >
              {t.loginOrcid}
            </button>
          )}
        </div>
      </div>

      {passkeyNotice && (
        <div className="bg-emerald-950/90 border-b border-emerald-500/50 px-4 py-1.5 text-center text-[11px] sm:text-xs text-emerald-300 font-mono break-words">
          {passkeyNotice}
        </div>
      )}
    </header>
  );
}
