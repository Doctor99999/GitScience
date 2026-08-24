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
    <header className="border-b border-[#222222] bg-[#111111] sticky top-0 z-40 w-full">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 bg-[var(--ferrari-red)] flex items-center justify-center font-bold text-white text-lg tracking-widest shrink-0 skew-x-[-10deg]">
            <span className="skew-x-[10deg]">GS</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="font-bold text-lg text-white uppercase tracking-[0.15em] truncate">{t.brand}</h1>
              <span className="text-[10px] uppercase px-2 py-0.5 border border-[var(--ferrari-red)] text-[var(--ferrari-red)] font-bold tracking-widest shrink-0">
                SCUDERIA
              </span>
            </div>
            <p className="text-[10px] uppercase text-[#aaaaaa] hidden md:block truncate tracking-widest">{t.tagline}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {/* AI Guide Button */}
          <button
            onClick={() => setShowGuideModal(true)}
            className="ferrari-btn-secondary px-4 py-2 text-[10px]"
          >
            {t.guideBtn}
          </button>

          {/* Biometric Touch ID */}
          <button
            onClick={handleBiometricAuth}
            className="hidden lg:inline-flex ferrari-btn-secondary px-4 py-2 text-[10px] items-center gap-2"
          >
            <span>Touch ID</span>
          </button>

          {/* Language Selector: KZ FIRST */}
          <div className="flex bg-[#000000] p-1 border border-[#333333]">
            {(["KZ", "RU", "EN"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1 text-[10px] font-bold tracking-widest uppercase transition-colors ${
                  lang === l
                    ? "bg-[var(--ferrari-red)] text-white"
                    : "text-[#aaaaaa] hover:text-white hover:bg-[#222222]"
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
