"use client";

import React from "react";
import type { TranslationDict } from "../../lib/translations";
import type { FiatInvoiceResult } from "../../lib/types";

interface AmanatTabProps {
  t: TranslationDict;
  baseLicenseFee: number;
  setBaseLicenseFee: (n: number) => void;
  hospitalName: string;
  setHospitalName: (s: string) => void;
  taxBin: string;
  setTaxBin: (s: string) => void;
  handleGenerateFiatInvoice: () => void;
  fiatLoading: boolean;
  fiatInvoiceResult: FiatInvoiceResult | null;
}

export default function AmanatTab({
  t,
  baseLicenseFee,
  setBaseLicenseFee,
  hospitalName,
  setHospitalName,
  taxBin,
  setTaxBin,
  handleGenerateFiatInvoice,
  fiatLoading,
  fiatInvoiceResult,
}: AmanatTabProps) {
  const authorPool = baseLicenseFee * 0.55;
  const infraPool = baseLicenseFee * 0.15;
  const founderPool = baseLicenseFee * 0.30;
  const grossUpTax = baseLicenseFee * 0.20;
  const totalB2bBill = baseLicenseFee + grossUpTax;

  return (
    <div className="space-y-6">
      <div className="bg-[#0e1726] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-lg sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <span>💳</span> {t.amanatHeader}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">{t.amanatSubheader}</p>
        </div>

        {/* Breakdown Visualizer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 bg-slate-900/90 rounded-2xl border border-emerald-500/40 space-y-1">
            <span className="text-slate-400 block text-[11px]">{t.amanatAuthorPool}</span>
            <strong className="text-2xl text-emerald-400 font-bold">${authorPool.toLocaleString()}</strong>
            <p className="text-[10px] text-slate-500">14 CRediT CASRAI рөлдері бойынша бөлінеді</p>
          </div>

          <div className="p-4 bg-slate-900/90 rounded-2xl border border-cyan-500/40 space-y-1">
            <span className="text-slate-400 block text-[11px]">{t.amanatInfraPool}</span>
            <strong className="text-2xl text-cyan-400 font-bold">${infraPool.toLocaleString()}</strong>
            <p className="text-[10px] text-slate-500">Тәуелсіз рецензенттер мен валидаторлар қоры</p>
          </div>

          <div className="p-4 bg-slate-900/90 rounded-2xl border border-purple-500/40 space-y-1">
            <span className="text-slate-400 block text-[11px]">{t.amanatFounderPool}</span>
            <strong className="text-2xl text-purple-400 font-bold">${founderPool.toLocaleString()}</strong>
            <p className="text-[10px] text-slate-500">Протокол Создатель пулы (Salauat Yeshimov)</p>
          </div>
        </div>

        {/* B2B Invoicing Form */}
        <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4 text-xs">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <span>📄</span> Институционалдық B2B Фиат Инвойс жасау (Клиникалар мен Госпитальдар үшін)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Клиниканың ресми атауы</label>
              <input
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">БИН / Салық төлеуші коды</label>
              <input
                type="text"
                value={taxBin}
                onChange={(e) => setTaxBin(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono text-cyan-300 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">{t.amanatBaseFee} (USD)</label>
              <input
                type="number"
                min={100}
                value={baseLicenseFee}
                onChange={(e) => setBaseLicenseFee(parseFloat(e.target.value) || 1000)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono text-emerald-400 outline-none"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs font-mono">
            <div>
              <span className="text-slate-400 block">{t.amanatInvoiceTotal}</span>
              <span className="text-[11px] text-slate-500">Базалық сома (${baseLicenseFee}) + 20% B2B Gross-Up (${grossUpTax})</span>
            </div>
            <strong className="text-2xl sm:text-3xl text-amber-300 font-bold">${totalB2bBill.toLocaleString()} USD</strong>
          </div>

          <button
            onClick={handleGenerateFiatInvoice}
            disabled={fiatLoading}
            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold py-3 rounded-xl font-mono text-xs sm:text-sm transition shadow hover:opacity-95"
          >
            {fiatLoading ? "Инвойс жасалуда..." : t.genFiatInvoiceBtn}
          </button>

          {fiatInvoiceResult && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl font-mono text-[11px] space-y-1">
              <div className="text-emerald-400 font-bold">✅ B2B Инвойс ресми шығарылды:</div>
              <div>Invoice №: <strong className="text-cyan-300">{fiatInvoiceResult.invoice_id}</strong></div>
              <div>Hospital: <span className="text-slate-200">{fiatInvoiceResult.hospital_name}</span></div>
              <div>Gross Total: <strong className="text-amber-300 font-bold">${fiatInvoiceResult.total_gross_invoice_fiat} USD</strong></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
