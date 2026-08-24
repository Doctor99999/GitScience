"use client";

import React from "react";
import { ConnectKitButton } from "connectkit";

interface HeaderProps {
  lang: "KZ" | "RU" | "EN";
  setLang: (l: "KZ" | "RU" | "EN") => void;
  t: any;
  walletConnected: boolean;
  walletAddress: string | null;
  walletBalance: number;
  setShowWalletModal: (v: boolean) => void;
  activeScholar: any;
  setShowOrcidModal: (v: boolean) => void;
  setShowGuideModal: (v: boolean) => void;
  handleBiometricAuth: () => void;
  passkeyNotice: string | null;
}

export default function Header({
  lang,
  setLang,
  t,
  walletConnected,
  walletAddress,
  walletBalance,
  setShowWalletModal,
  activeScholar,
  setShowOrcidModal,
  setShowGuideModal,
  handleBiometricAuth,
  passkeyNotice,
}: HeaderProps) {
  return (
    <header className="border-b border-[var(--surface-border)] bg-[var(--background)]/80 backdrop-blur-xl sticky top-0 z-40 w-full h-[80px] flex items-center">
      <div className="w-full max-w-[1200px] mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="min-w-0 flex items-center gap-2">
            <h1 className="font-display font-bold text-2xl text-[var(--sci-red)] uppercase tracking-tight leading-none truncate">
              GitScience<span className="text-[var(--foreground)]">.</span>
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 border border-[var(--surface-border)] text-[var(--foreground)] bg-[var(--carbon-gray)] tracking-widest shrink-0">
              SCUDERIA
            </span>
          </div>
        </div>

        {/* Actions & Language */}
        <div className="flex items-center gap-4 shrink-0">
          {/* AI Guide Button */}
          <button
            onClick={() => setShowGuideModal(true)}
            className="sci-btn-secondary px-4 py-2 text-[10px]"
          >
            {t.guideBtn}
          </button>

          {/* Biometric Touch ID */}
          <button
            onClick={handleBiometricAuth}
            className="hidden lg:inline-flex sci-btn-secondary px-4 py-2 text-[10px] items-center gap-2"
          >
            <span className="material-symbols-outlined text-[14px]">fingerprint</span>
            <span>Touch ID</span>
          </button>

          {/* Language Selector: KZ FIRST */}
          <div className="flex bg-[var(--carbon-gray)] p-1 border border-[var(--surface-border)]">
            {(["KZ", "RU", "EN"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1 font-mono text-[10px] tracking-widest uppercase transition-colors ${
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
          <ConnectKitButton />

          {/* ORCID Scholar Login/Status Button */}
          {activeScholar ? (
            <div className="flex items-center gap-1.5 bg-emerald-950/50 border border-emerald-600/50 px-2.5 sm:px-3 py-1 rounded-lg text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-mono text-emerald-300 font-semibold text-[11px] sm:text-xs truncate max-w-[110px] sm:max-w-[160px]">
                {activeScholar.name}
              </span>
              <button
                onClick={() => setShowOrcidModal(true)}
                className="text-[10px] text-slate-400 hover:text-cyan-300 underline ml-1 font-mono"
                title={t.switchScholar}
              >
                ⚙
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowOrcidModal(true)}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg shadow transition hover:opacity-90 font-mono"
            >
              {t.loginOrcid}
            </button>
          )}
        </div>
      </div>

      {passkeyNotice && (
        <div className="bg-emerald-950/90 border-b border-emerald-500/50 px-4 py-2 text-center text-xs text-emerald-300 font-mono">
          {passkeyNotice}
        </div>
      )}
    </header>
  );
}
