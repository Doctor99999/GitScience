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
    <header className="border-b border-white/10 bg-black/80 backdrop-blur-xl sticky top-0 z-40 w-full">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-black text-lg tracking-tighter shrink-0">
            GS
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-lg sm:text-xl text-white tracking-tight truncate">{t.brand}</h1>
              <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20 font-medium shrink-0">
                PRO
              </span>
            </div>
            <p className="text-[12px] text-[#86868b] hidden md:block truncate tracking-tight">{t.tagline}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* AI Guide Button */}
          <button
            onClick={() => setShowGuideModal(true)}
            className="apple-btn-secondary px-3 py-1.5 text-xs font-medium transition"
          >
            {t.guideBtn}
          </button>

          {/* Biometric Touch ID */}
          <button
            onClick={handleBiometricAuth}
            className="hidden lg:inline-flex apple-btn-secondary px-3 py-1.5 text-xs font-medium transition items-center gap-1.5"
          >
            <span>Touch ID</span>
          </button>

          {/* Language Selector: KZ FIRST */}
          <div className="flex bg-[#1d1d1f] rounded-full p-1 text-xs font-medium border border-white/10">
            {(["KZ", "RU", "EN"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1 rounded-full transition ${
                  lang === l
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "text-[#86868b] hover:text-white"
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
