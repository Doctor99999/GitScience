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
    <footer className="border-t border-slate-800 bg-[#070d18] mt-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase">{t.statManuscripts}</span>
            <strong className="text-emerald-400 text-lg sm:text-xl font-bold">
              {platformStats.total_notarized_manuscripts}
            </strong>
          </div>
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase">{t.statMaas}</span>
            <strong className="text-cyan-400 text-lg sm:text-xl font-bold">
              {platformStats.total_maas_executions.toLocaleString()}
            </strong>
          </div>
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase">{t.statSecuredValue}</span>
            <strong className="text-amber-300 text-lg sm:text-xl font-bold">
              ${platformStats.total_secured_scientific_value_usdt.toLocaleString()}
            </strong>
          </div>
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase">{t.statScholars}</span>
            <strong className="text-purple-400 text-lg sm:text-xl font-bold">
              {platformStats.total_verified_scholars}
            </strong>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-center text-xs text-slate-500 font-mono pt-2 border-t border-slate-900">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[11px] text-slate-400">
            <a href="/about" className="hover:text-emerald-400 transition">About Protocol</a>
            <span>•</span>
            <a href="/terms" className="hover:text-emerald-400 transition">Terms of Service</a>
            <span>•</span>
            <a href="/privacy" className="hover:text-emerald-400 transition">Privacy Policy</a>
            <span>•</span>
            <a href={`${apiBase}/docs`} target="_blank" rel="noreferrer" className="hover:text-cyan-300 transition">Swagger API</a>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>{platformStats.blockchain_attestation_status}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
