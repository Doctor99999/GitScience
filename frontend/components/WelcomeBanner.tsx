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
    <section className="w-full bg-[var(--background)] py-28 sm:py-36 border-b border-[var(--surface-border)] flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-10 mix-blend-screen pointer-events-none">
        <div className="w-[120%] h-[120%] bg-[url('https://lh3.googleusercontent.com/aida/AEtjO1W0HJ_JXDA1sCzvosa16fajKWT6SZ8bGP58aKn3nOxOT-oF1ZuTmtSd31dMEg0STtWwUi2765U46LFw2Rmhjk0P4xqoBvThlyU-mXCvh3naDal0awLOhlFmT_IsVH-jVsrzrEJww69FbubAkxBJMfzyPXh_PsXOT07PWkw35xZm1HWIYrCAYqCpyVPJh2-URxIR0B-tF3pMwk5Qw6I587-UsByxqATP5ddOdZfNtwnunvDn5PCOQ6SWbg')] bg-no-repeat bg-center bg-contain filter grayscale blur-[2px]"></div>
      </div>
      
      <div className="relative z-10 text-center max-w-7xl mx-auto flex flex-col items-center">
        <div className="inline-flex items-center gap-2 mb-8 border border-[var(--surface-border)] px-4 py-1 bg-[var(--carbon-gray)]/50 backdrop-blur-sm">
          <span className="w-2 h-2 bg-[var(--sci-red)] shadow-[0_0_8px_rgba(241,78,50,1)]"></span>
          <span className="font-mono text-xs text-[var(--foreground)] uppercase tracking-widest">System Operational v2.4</span>
        </div>

        <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tight text-white mb-6 drop-shadow-xl font-display">
          Scientific<br/>Sovereignty.<br/><span className="text-[var(--sci-red)]">Engineered.</span>
        </h1>
        
        <p className="text-sm md:text-lg text-[var(--foreground)] max-w-2xl mx-auto mb-12 font-normal tracking-wide opacity-80">
          Decentralized infrastructure for high-stakes research. Cryptographically secured data provenance, execution, and consensus for the next generation of scientific discovery.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={() => setShowOrcidModal(true)}
            className="sci-btn-primary px-8 py-4 text-xs md:text-sm w-full sm:w-auto"
          >
            {t.welcomeRegisterBtn || "Initialize Protocol"}
          </button>
          <button
            onClick={() => setShowWalletModal(true)}
            className="sci-btn-secondary px-8 py-4 text-xs md:text-sm w-full sm:w-auto"
          >
            {t.welcomeWalletBtn || "Connect Wallet"}
          </button>
        </div>
      </div>
    </section>
  );
}
