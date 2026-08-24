"use client";

import React from "react";

interface FooterProps {
  t: any;
  platformStats: {
    total_notarized_manuscripts: number;
    total_maas_executions: number;
    total_secured_scientific_value_usdt: number;
    total_verified_scholars: number;
    blockchain_attestation_status: string;
  };
  apiBase: string;
}

export default function Footer({ t, platformStats, apiBase }: FooterProps) {
  return (
    <footer className="border-t border-[#222222] bg-[#050505] mt-16 pt-12 pb-12">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-6 ferrari-panel relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[var(--ferrari-red)] opacity-80"></div>
            <span className="text-[#888888] block text-[10px] uppercase font-bold tracking-widest mb-2">{t.statManuscripts}</span>
            <strong className="text-white text-3xl font-black tracking-tight">
              {platformStats.total_notarized_manuscripts}
            </strong>
          </div>
          <div className="p-6 ferrari-panel relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[var(--ferrari-red)] opacity-80"></div>
            <span className="text-[#888888] block text-[10px] uppercase font-bold tracking-widest mb-2">{t.statMaas}</span>
            <strong className="text-white text-3xl font-black tracking-tight">
              {platformStats.total_maas_executions.toLocaleString()}
            </strong>
          </div>
          <div className="p-6 ferrari-panel relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[var(--ferrari-red)] opacity-80"></div>
            <span className="text-[#888888] block text-[10px] uppercase font-bold tracking-widest mb-2">{t.statSecuredValue}</span>
            <strong className="text-white text-3xl font-black tracking-tight">
              ${platformStats.total_secured_scientific_value_usdt.toLocaleString()}
            </strong>
          </div>
          <div className="p-6 ferrari-panel relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[var(--ferrari-red)] opacity-80"></div>
            <span className="text-[#888888] block text-[10px] uppercase font-bold tracking-widest mb-2">{t.statScholars}</span>
            <strong className="text-white text-3xl font-black tracking-tight">
              {platformStats.total_verified_scholars}
            </strong>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold uppercase tracking-widest border-t border-[#222222] pt-8">
          <div className="flex flex-wrap items-center justify-center gap-6 text-[#888888]">
            <a href="/about" className="hover:text-[var(--ferrari-red)] transition-colors">About Protocol</a>
            <a href="/terms" className="hover:text-[var(--ferrari-red)] transition-colors">Terms of Service</a>
            <a href="/privacy" className="hover:text-[var(--ferrari-red)] transition-colors">Privacy Policy</a>
            <a href={`${apiBase}/docs`} target="_blank" rel="noreferrer" className="hover:text-[var(--ferrari-red)] transition-colors">Swagger API</a>
          </div>
          <div className="flex items-center gap-2 text-[#888888]">
            <span className="w-2 h-2 bg-[var(--ferrari-red)] animate-pulse"></span>
            <span>{platformStats.blockchain_attestation_status}</span>
          </div>
        </div>
        
        <div className="text-center text-[10px] uppercase tracking-widest text-[#555555] mt-4">
          Copyright © 2026 GitScience Scuderia Protocol. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
