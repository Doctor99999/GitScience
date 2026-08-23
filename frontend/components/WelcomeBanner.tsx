"use client";

import React from "react";

interface WelcomeBannerProps {
  t: any;
  setShowOrcidModal: (v: boolean) => void;
  setShowWalletModal: (v: boolean) => void;
}

export default function WelcomeBanner({
  t,
  setShowOrcidModal,
  setShowWalletModal,
}: WelcomeBannerProps) {
  return (
    <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900/80 to-cyan-950/60 border-b border-emerald-500/30 px-3 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="space-y-1 text-center md:text-left">
          <h2 className="text-sm sm:text-base font-bold text-emerald-300 flex items-center justify-center md:justify-start gap-2">
            <span>🛡️</span> {t.welcomeBannerTitle}
          </h2>
          <p className="text-xs text-slate-300 max-w-3xl">
            {t.welcomeBannerSub}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setShowOrcidModal(true)}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl shadow transition hover:opacity-95 font-mono"
          >
            {t.welcomeRegisterBtn}
          </button>
          <button
            onClick={() => setShowWalletModal(true)}
            className="bg-slate-900 hover:bg-slate-800 border border-amber-500/50 text-amber-300 font-bold text-xs px-3.5 py-2 rounded-xl shadow transition font-mono"
          >
            {t.welcomeWalletBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
