"use client";

import React from "react";
import type { TranslationDict } from "../../lib/translations";
import type { ZkCommitResult, ZkRevealResult } from "../../lib/types";

interface ZkDiscoveryTabProps {
  t: TranslationDict;
  zkTitle: string;
  setZkTitle: (s: string) => void;
  zkSecret: string;
  setZkSecret: (s: string) => void;
  zkPayload: string;
  setZkPayload: (s: string) => void;
  zkFormula: string;
  setZkFormula: (s: string) => void;
  handleZkCommit: () => void;
  zkCommitResult: ZkCommitResult | null;
  zkRevealId: string;
  setZkRevealId: (s: string) => void;
  zkRevealSecret: string;
  setZkRevealSecret: (s: string) => void;
  zkRevealPayload: string;
  setZkRevealPayload: (s: string) => void;
  handleZkReveal: () => void;
  zkRevealResult: ZkRevealResult | null;
}

export default function ZkDiscoveryTab({
  t,
  zkTitle,
  setZkTitle,
  zkSecret,
  setZkSecret,
  zkPayload,
  setZkPayload,
  zkFormula,
  setZkFormula,
  handleZkCommit,
  zkCommitResult,
  zkRevealId,
  setZkRevealId,
  zkRevealSecret,
  setZkRevealSecret,
  zkRevealPayload,
  setZkRevealPayload,
  handleZkReveal,
  zkRevealResult,
}: ZkDiscoveryTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-[#0e1726] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-lg sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <span>🔒</span> {t.zkHeader}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">{t.zkSubheader}</p>
        </div>

        {/* ZK Commit Box */}
        <div className="p-4 sm:p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4 text-xs">
          <h3 className="font-bold text-sm text-emerald-400">1. Слепой ZK-коммитмент (Депонирование без раскрытия)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">{t.zkHypothesisTitle} *</label>
              <input
                type="text"
                value={zkTitle}
                onChange={(e) => setZkTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">{t.zkSecretLabel} (Кілт сөз) *</label>
              <input
                type="password"
                value={zkSecret}
                onChange={(e) => setZkSecret(e.target.value)}
                placeholder="Жасырын тұзды сөз (Secret Salt)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-cyan-300 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">{t.zkPayloadLabel} *</label>
            <textarea
              rows={2}
              value={zkPayload}
              onChange={(e) => setZkPayload(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">{t.zkFormulaLabel}</label>
            <input
              type="text"
              value={zkFormula}
              onChange={(e) => setZkFormula(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-cyan-300 focus:border-emerald-500 outline-none"
            />
          </div>

          <button
            onClick={handleZkCommit}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-2.5 rounded-xl font-mono text-xs transition shadow"
          >
            {t.zkCommitBtn}
          </button>

          {zkCommitResult && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl font-mono text-[11px] space-y-1">
              <div className="text-emerald-400 font-bold">✅ ZK Commitment Зафиксирован:</div>
              <div>Commitment ID: <strong className="text-cyan-300">{zkCommitResult.commitment_id}</strong></div>
              <div className="truncate">Blind Hash: <strong className="text-slate-200">{zkCommitResult.blind_commitment_hash}</strong></div>
            </div>
          )}
        </div>

        {/* ZK Reveal Box */}
        <div className="p-4 sm:p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4 text-xs">
          <h3 className="font-bold text-sm text-cyan-400">{t.zkRevealTitle}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">{t.zkRevealCommitId} *</label>
              <input
                type="text"
                value={zkRevealId}
                onChange={(e) => setZkRevealId(e.target.value)}
                placeholder="ZK-..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-cyan-300 focus:border-cyan-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">{t.zkSecretLabel} *</label>
              <input
                type="password"
                value={zkRevealSecret}
                onChange={(e) => setZkRevealSecret(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-cyan-300 focus:border-cyan-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Депозиттелген түпнұсқа мәтін *</label>
            <textarea
              rows={2}
              value={zkRevealPayload}
              onChange={(e) => setZkRevealPayload(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-cyan-500 outline-none"
            />
          </div>

          <button
            onClick={handleZkReveal}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold py-2.5 rounded-xl font-mono text-xs transition shadow"
          >
            {t.zkRevealBtn}
          </button>

          {zkRevealResult && (
            <div className="p-4 bg-cyan-950/40 border border-cyan-500/40 rounded-xl font-mono text-[11px] space-y-1">
              <div className="text-cyan-300 font-bold">🔓 Нәтиже: {zkRevealResult.status}</div>
              <div>Priority Proved: <span className="text-emerald-400 font-bold">{zkRevealResult.is_authentic ? "100% MATCH" : "FAILED"}</span></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
