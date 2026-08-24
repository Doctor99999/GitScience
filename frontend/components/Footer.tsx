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
    <footer className="border-t border-white/10 bg-black mt-16 pt-8 pb-12">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-2xl bg-[#1d1d1f] border border-white/5">
            <span className="text-[#86868b] block text-xs font-semibold mb-1">{t.statManuscripts}</span>
            <strong className="text-white text-2xl font-bold tracking-tight">
              {platformStats.total_notarized_manuscripts}
            </strong>
          </div>
          <div className="p-4 rounded-2xl bg-[#1d1d1f] border border-white/5">
            <span className="text-[#86868b] block text-xs font-semibold mb-1">{t.statMaas}</span>
            <strong className="text-white text-2xl font-bold tracking-tight">
              {platformStats.total_maas_executions.toLocaleString()}
            </strong>
          </div>
          <div className="p-4 rounded-2xl bg-[#1d1d1f] border border-white/5">
            <span className="text-[#86868b] block text-xs font-semibold mb-1">{t.statSecuredValue}</span>
            <strong className="text-white text-2xl font-bold tracking-tight">
              ${platformStats.total_secured_scientific_value_usdt.toLocaleString()}
            </strong>
          </div>
          <div className="p-4 rounded-2xl bg-[#1d1d1f] border border-white/5">
            <span className="text-[#86868b] block text-xs font-semibold mb-1">{t.statScholars}</span>
            <strong className="text-white text-2xl font-bold tracking-tight">
              {platformStats.total_verified_scholars}
            </strong>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium border-t border-white/10 pt-6">
          <div className="flex flex-wrap items-center justify-center gap-4 text-[#86868b]">
            <a href="/about" className="hover:text-white transition-colors">About Protocol</a>
            <span className="hidden sm:inline">|</span>
            <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
            <span className="hidden sm:inline">|</span>
            <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
            <span className="hidden sm:inline">|</span>
            <a href={`${apiBase}/docs`} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Swagger API</a>
          </div>
          <div className="flex items-center gap-2 text-[#86868b]">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            <span>{platformStats.blockchain_attestation_status}</span>
          </div>
        </div>
        
        <div className="text-center text-[10px] text-[#86868b] mt-4">
          Copyright © 2026 GitScience Sovereign Protocol. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
