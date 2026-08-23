"use client";

import React from "react";

interface ReviewTabProps {
  t: any;
  revCode: string;
  setRevCode: (s: string) => void;
  revOrcid: string;
  setRevOrcid: (s: string) => void;
  revMath: number;
  setRevMath: (n: number) => void;
  revMethod: number;
  setRevMethod: (n: number) => void;
  revEthics: number;
  setRevEthics: (n: number) => void;
  revNovelty: number;
  setRevNovelty: (n: number) => void;
  revComments: string;
  setRevComments: (s: string) => void;
  handleSubmitReview: () => void;
  reviewResult: any;
}

export default function ReviewTab({
  t,
  revCode,
  setRevCode,
  revOrcid,
  setRevOrcid,
  revMath,
  setRevMath,
  revMethod,
  setRevMethod,
  revEthics,
  setRevEthics,
  revNovelty,
  setRevNovelty,
  revComments,
  setRevComments,
  handleSubmitReview,
  reviewResult,
}: ReviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-[#0e1726] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-lg sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <span>📝</span> {t.revHeader}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">{t.revSubheader}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">{t.revTargetLabel} *</label>
            <input
              type="text"
              value={revCode}
              onChange={(e) => setRevCode(e.target.value)}
              placeholder="GS-2026-00001"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono text-cyan-300 focus:border-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-semibold mb-1">{t.revReviewerLabel} *</label>
            <input
              type="text"
              value={revOrcid}
              onChange={(e) => setRevOrcid(e.target.value)}
              placeholder="0009-0001-2234-5678"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono text-emerald-400 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* 4 Scores */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
            <label className="text-slate-400 block font-semibold">{t.revMathScore}</label>
            <input
              type="number"
              min={1}
              max={10}
              value={revMath}
              onChange={(e) => setRevMath(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 font-mono text-cyan-300 outline-none"
            />
          </div>
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
            <label className="text-slate-400 block font-semibold">{t.revMethodScore}</label>
            <input
              type="number"
              min={1}
              max={10}
              value={revMethod}
              onChange={(e) => setRevMethod(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 font-mono text-emerald-300 outline-none"
            />
          </div>
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
            <label className="text-slate-400 block font-semibold">{t.revEthicsScore}</label>
            <input
              type="number"
              min={1}
              max={10}
              value={revEthics}
              onChange={(e) => setRevEthics(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 font-mono text-purple-300 outline-none"
            />
          </div>
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
            <label className="text-slate-400 block font-semibold">{t.revNoveltyScore}</label>
            <input
              type="number"
              min={1}
              max={10}
              value={revNovelty}
              onChange={(e) => setRevNovelty(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 font-mono text-amber-300 outline-none"
            />
          </div>
        </div>

        <div className="text-xs">
          <label className="block text-slate-400 font-semibold mb-1">{t.revCommentsLabel} *</label>
          <textarea
            rows={3}
            value={revComments}
            onChange={(e) => setRevComments(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
          />
        </div>

        <button
          onClick={handleSubmitReview}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-3 rounded-xl font-mono text-xs sm:text-sm transition shadow"
        >
          {t.revSubmitBtn}
        </button>

        {reviewResult && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl font-mono text-[11px] space-y-1">
            <div className="text-emerald-400 font-bold">✅ Рецензия бекітілді & 15% сыйақы есептелді:</div>
            <div>Review ID: <span className="text-cyan-300">{reviewResult.review_id}</span></div>
            <div>Reviewer Payout: <span className="text-emerald-300 font-bold">+{reviewResult.reviewer_reward_usdt || 50.0} USDT</span></div>
          </div>
        )}
      </div>
    </div>
  );
}
