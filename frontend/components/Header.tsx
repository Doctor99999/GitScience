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
        <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-2 sm:gap-3 min-w-0">
          {/* AI Guide Button */}
          <button
            onClick={() => setShowGuideModal(true)}
            className="sci-btn-secondary px-2.5 sm:px-4 py-1.5 sm:py-2 text-[10px] whitespace-nowrap"
          >
            {t.guideBtn}
          </button>

          {/* Biometric Passkey */}
          <button
            onClick={handleBiometricAuth}
            className="hidden md:inline-flex sci-btn-secondary px-3 py-1.5 text-[10px] items-center gap-1.5 shrink-0"
          >
            <span className="material-symbols-outlined text-[14px]" aria-hidden>fingerprint</span>
            <span>{t.passkeyBtn}</span>
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
                    : "text-[var(--text-low)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hi)]"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Web3 Wallet Connection Button (ConnectKit) */}
          <div className="shrink-0 max-w-[130px] sm:max-w-none overflow-hidden">
            <ConnectKitButton />
          </div>

          {/* ORCID Scholar Login/Status Button */}
          {activeScholar ? (
            <div className="flex items-center gap-2 border border-[var(--ok)]/40 bg-[var(--ok-dim)] px-2 sm:px-3 py-1 shrink-0 max-w-[130px] sm:max-w-[190px]">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 shrink-0 rounded-full bg-[var(--ok)] animate-pulse"></span>
              <span className="font-mono text-[var(--ok)] font-semibold text-[10px] sm:text-xs truncate">
                {activeScholar.name}
              </span>
              <button
                onClick={() => setShowOrcidModal(true)}
                className="sci-focus ml-0.5 shrink-0 text-[var(--text-low)] hover:text-[var(--foreground)] transition-colors"
                title={t.switchScholar}
              >
                <span className="material-symbols-outlined !text-sm" aria-hidden>settings</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowOrcidModal(true)}
              className="sci-btn-primary px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-[11px] whitespace-nowrap"
            >
              {t.loginOrcid}
            </button>
          )}
        </div>
      </div>

      {passkeyNotice && (
        <div className="bg-[var(--ok-dim)] border-b border-[var(--ok)]/40 px-4 py-1.5 text-center text-[11px] sm:text-xs text-[var(--ok)] font-mono break-words">
          {passkeyNotice}
        </div>
      )}
    </header>
  );
}