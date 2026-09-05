"use client";

import React from "react";
import type { TranslationDict } from "../../lib/translations";
import type { CourtCase } from "../../lib/types";

interface CourtTabProps {
  t: TranslationDict;
  courtCases: CourtCase[];
  courtClaimantName: string;
  setCourtClaimantName: (s: string) => void;
  courtClaimantOrcid: string;
  setCourtClaimantOrcid: (s: string) => void;
  courtTargetCode: string;
  setCourtTargetCode: (s: string) => void;
  courtReason: string;
  setCourtReason: (s: string) => void;
  handleFileDispute: () => void;
  courtDisputeResult: CourtCase | null;
  handleVoteCase: (caseId: string, vote: "valid" | "invalid" | "abstain") => void;
}

export default function CourtTab({
  t,
  courtCases,
  courtClaimantName,
  setCourtClaimantName,
  courtClaimantOrcid,
  setCourtClaimantOrcid,
  courtTargetCode,
  setCourtTargetCode,
  courtReason,
  setCourtReason,
  handleFileDispute,
  courtDisputeResult,
  handleVoteCase,
}: CourtTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-[#0e1726] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-lg sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <span>⚖️</span> {t.courtHeader}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">{t.courtSubheader}</p>
        </div>

        {/* Dispute Filing Form */}
        <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4 text-xs">
          <h3 className="font-bold text-sm text-amber-400">{t.courtFileTitle}</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">{t.courtClaimantName} *</label>
              <input
                type="text"
                value={courtClaimantName}
                onChange={(e) => setCourtClaimantName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">{t.courtClaimantOrcid} *</label>
              <input
                type="text"
                value={courtClaimantOrcid}
                onChange={(e) => setCourtClaimantOrcid(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-emerald-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">{t.courtTargetCode} *</label>
              <input
                type="text"
                value={courtTargetCode}
                onChange={(e) => setCourtTargetCode(e.target.value)}
                placeholder="GS-2026-00001"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-cyan-300 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">{t.courtReasonLabel} *</label>
            <textarea
              rows={2}
              value={courtReason}
              onChange={(e) => setCourtReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 outline-none"
            />
          </div>

          <button
            onClick={handleFileDispute}
            className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-2.5 rounded-xl font-mono text-xs transition shadow"
          >
            {t.courtSubmitBtn}
          </button>

          {courtDisputeResult && (
            <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-xl font-mono text-[11px] space-y-1">
              <div className="text-amber-400 font-bold">⚖️ Дау ісі тіркелді:</div>
              <div>Case ID: <strong className="text-cyan-300">{courtDisputeResult.case_id}</strong></div>
              <div>Status: <span className="text-emerald-400 font-bold">{courtDisputeResult.status}</span></div>
            </div>
          )}
        </div>

        {/* Active Cases */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-slate-100">{t.courtActiveCases}</h3>

          <div className="space-y-3">
            {courtCases.map((c) => (
              <div
                key={c.case_id}
                className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3 text-xs"
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono text-cyan-400 font-bold">{c.case_id}</span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                    {c.status}
                  </span>
                </div>

                <div>
                  <div className="text-slate-300 font-semibold">Оспариваемый манускрипт: {c.target_code}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">Шағымданушы: {c.claimant_name} ({c.claimant_orcid})</div>
                  <p className="text-slate-300 text-xs mt-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    {c.reason}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 font-mono text-[11px]">
                  <div className="flex gap-3 text-slate-400">
                    <span>Valid: <strong className="text-emerald-400">{c.votes_valid}</strong></span>
                    <span>Invalid: <strong className="text-red-400">{c.votes_invalid}</strong></span>
                    <span>Abstain: <strong className="text-slate-300">{c.votes_abstain}</strong></span>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleVoteCase(c.case_id, "valid")}
                      className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 rounded-lg transition"
                    >
                      {t.courtVoteValid}
                    </button>
                    <button
                      onClick={() => handleVoteCase(c.case_id, "invalid")}
                      className="px-2.5 py-1 bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 rounded-lg transition"
                    >
                      {t.courtVoteInvalid}
                    </button>
                    <button
                      onClick={() => handleVoteCase(c.case_id, "abstain")}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded-lg transition"
                    >
                      {t.courtVoteAbstain}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
