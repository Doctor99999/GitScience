"use client";

import React from "react";

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
    <header className="border-b border-slate-800/80 bg-[#0b1322]/95 backdrop-blur sticky top-0 z-40 shadow-md w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 font-bold text-slate-950 text-lg sm:text-xl tracking-tighter border border-emerald-300/30 shrink-0">
            GS
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg text-slate-50 tracking-tight truncate">{t.brand}</h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold shrink-0">
                v3.3
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block truncate">{t.tagline}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* AI Guide Button */}
          <button
            onClick={() => setShowGuideModal(true)}
            className="inline-flex items-center gap-1 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono text-purple-300 transition shadow"
          >
            <span>{t.guideBtn}</span>
          </button>

          {/* Biometric Touch ID */}
          <button
            onClick={handleBiometricAuth}
            className="hidden lg:inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-300 transition shadow"
          >
            <span>{t.passkeyBtn}</span>
          </button>

          {/* Language Selector: KZ FIRST */}
          <div className="flex bg-slate-900/90 border border-slate-700/80 rounded-lg p-0.5 text-xs font-mono">
            {(["KZ", "RU", "EN"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2 sm:px-2.5 py-1 rounded-md transition font-semibold ${
                  lang === l
                    ? "bg-emerald-500 text-slate-950 font-bold shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Web3 Wallet Connection Button */}
          {walletConnected && walletAddress ? (
            <button
              onClick={() => setShowWalletModal(true)}
              className="flex items-center gap-1.5 bg-cyan-950/60 border border-cyan-500/60 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-mono text-cyan-300 hover:bg-cyan-900/60 transition shadow"
            >
              <span>🦊</span>
              <span className="truncate max-w-[85px] sm:max-w-[110px]">
                {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
              </span>
              <span className="hidden sm:inline text-amber-300 font-bold">
                | ${walletBalance.toLocaleString()}
              </span>
            </button>
          ) : (
            <button
              onClick={() => setShowWalletModal(true)}
              className="bg-slate-900 hover:bg-slate-800 border border-amber-500/50 text-amber-300 font-bold text-xs px-3 py-1.5 rounded-lg shadow transition font-mono flex items-center gap-1"
            >
              <span>{t.connectWallet}</span>
            </button>
          )}

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
