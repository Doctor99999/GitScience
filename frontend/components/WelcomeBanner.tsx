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
    <section className="relative w-full min-h-[90vh] bg-[var(--background)] border-b border-[var(--surface-border)] flex items-center justify-center px-6 py-20 overflow-hidden">
      {/* Background Grid Pattern */}
      <div 
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      ></div>
      
      <div className="relative z-10 w-full max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Column: Text & CTA */}
        <div className="flex flex-col items-start text-left">
          <div className="inline-flex items-center gap-3 mb-6">
            <span className="w-2 h-2 bg-[var(--sci-red)] shadow-[0_0_8px_rgba(241,78,50,1)]"></span>
            <span className="font-mono text-[10px] text-[var(--sci-red)] uppercase tracking-widest font-bold">System Online // v 2.4</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-black uppercase tracking-tight text-white mb-6 leading-[1.1]">
            Scientific<br/>Sovereignty.<br/><span className="text-white">Engineered.</span>
          </h1>
          
          <p className="text-sm md:text-base text-[#aaaaaa] max-w-lg mb-10 font-sans tracking-wide leading-relaxed">
            GitScience provides a rigorous, high-performance cryptographic substrate for verifiable research, decentralized consensus, and immutable execution.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button
              onClick={() => setShowOrcidModal(true)}
              className="sci-btn-primary px-8 py-4 text-[11px] w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <span>Initialize Sequence</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>
            <button
              onClick={() => setShowWalletModal(true)}
              className="sci-btn-secondary px-8 py-4 text-[11px] w-full sm:w-auto"
            >
              Read Manifesto
            </button>
          </div>
          
          {/* Status micro-data */}
          <div className="mt-12 flex items-center gap-12 border-t border-[var(--surface-border)] pt-6 w-full max-w-sm">
            <div>
              <div className="text-[9px] text-[#666666] font-mono tracking-widest uppercase mb-1">Node Count</div>
              <div className="text-white font-mono font-bold text-sm">12,453</div>
            </div>
            <div>
              <div className="text-[9px] text-[#666666] font-mono tracking-widest uppercase mb-1">Verified TX</div>
              <div className="text-white font-mono font-bold text-sm">8.4M+</div>
            </div>
          </div>
        </div>

        {/* Right Column: Vitruvian Logo */}
        <div className="flex items-center justify-center lg:justify-end relative">
          {/* Crosshair lines behind logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="w-full h-[1px] bg-white absolute"></div>
            <div className="h-full w-[1px] bg-white absolute"></div>
          </div>
          
          <img 
            src="/GitScience/vitruvian-logo.jpg" 
            alt="GitScience Vitruvian Protocol" 
            className="w-full max-w-[500px] h-auto object-contain relative z-10 drop-shadow-[0_0_30px_rgba(0,150,255,0.2)] mix-blend-screen"
          />
        </div>

      </div>
    </section>
  );
}
