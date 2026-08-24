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
    <section className="w-full bg-[#050505] py-28 sm:py-36 border-b border-[#222222] flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
      {/* Decorative slant */}
      <div className="absolute top-0 left-0 w-full h-1 bg-[var(--ferrari-red)]"></div>
      
      <h2 className="text-5xl md:text-8xl font-black uppercase tracking-widest text-[#ffffff] mb-6 drop-shadow-xl">
        GitScience
      </h2>
      <p className="text-sm md:text-lg font-bold tracking-[0.2em] text-[#da291c] mb-6 uppercase">
        {t.welcomeBannerTitle || "Performance Driven Science."}
      </p>
      <p className="text-sm md:text-base text-[#aaaaaa] max-w-2xl mx-auto mb-10 font-normal tracking-wide">
        {t.welcomeBannerSub || "UNCOMPROMISING DECENTRALIZED NOTARY. ABSOLUTE TRANSPARENCY. INSTANT ROYALTY DISTRIBUTION."}
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <button
          onClick={() => setShowOrcidModal(true)}
          className="ferrari-btn-primary px-10 py-4 text-xs md:text-sm w-full sm:w-auto shadow-2xl"
        >
          {t.welcomeRegisterBtn || "Register ORCID"}
        </button>
        <button
          onClick={() => setShowWalletModal(true)}
          className="ferrari-btn-secondary px-10 py-4 text-xs md:text-sm w-full sm:w-auto"
        >
          {t.welcomeWalletBtn || "Connect Wallet"}
        </button>
      </div>
    </section>
  );
}
