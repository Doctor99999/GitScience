"use client";

import React from "react";

interface MaasTabProps {
  t: any;
  maasFormula: string;
  setMaasFormula: (s: string) => void;
  handleRunMaasSimulation: () => void;
  maasLoading: boolean;
  maasResult: any;
  handleClinicalFhirTest: () => void;
  fhirLoading: boolean;
  fhirResult: any;
}

export default function MaasTab({
  t,
  maasFormula,
  setMaasFormula,
  handleRunMaasSimulation,
  maasLoading,
  maasResult,
  handleClinicalFhirTest,
  fhirLoading,
  fhirResult,
}: MaasTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-[#0e1726] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-lg sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <span>⚡</span> {t.maasHeader}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">{t.maasSubheader}</p>
        </div>

        <div className="space-y-3 text-xs">
          <label className="block text-slate-400 font-semibold">{t.maasFormulaLabel}</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={maasFormula}
              onChange={(e) => setMaasFormula(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 font-mono text-cyan-300 focus:border-emerald-500 outline-none"
            />
            <button
              onClick={handleRunMaasSimulation}
              disabled={maasLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl font-mono text-xs transition"
            >
              {maasLoading ? "Есептелуде..." : t.maasRunBtn}
            </button>
            <button
              onClick={handleClinicalFhirTest}
              disabled={fhirLoading}
              className="bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-purple-200 font-bold px-4 py-2.5 rounded-xl font-mono text-xs transition"
            >
              {fhirLoading ? "FHIR..." : t.fhirGatewayBtn}
            </button>
          </div>
        </div>

        {/* 2D Interactive Response Visualizer */}
        <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <strong className="text-cyan-300 font-mono flex items-center gap-2">
              <span>📈</span> {t.maasVisualCurveTitle}
            </strong>
            <span className="text-[10px] font-mono text-emerald-400">Deterministic WASM Runtime</span>
          </div>

          <div className="h-40 sm:h-48 w-full bg-[#070d18] rounded-xl border border-slate-800/80 flex items-end justify-between p-4 gap-1 sm:gap-2">
            {[24, 38, 52, 68, 85, 96, 110, 125, 142, 160].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div
                  style={{ height: `${(h / 160) * 100}%` }}
                  className="w-full bg-gradient-to-t from-emerald-600 to-cyan-400 rounded-t-md opacity-80 group-hover:opacity-100 transition shadow"
                />
                <span className="text-[9px] font-mono text-slate-500">t{i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FHIR Result */}
        {fhirResult && (
          <div className="p-4 bg-purple-950/30 border border-purple-500/40 rounded-2xl text-xs font-mono space-y-2">
            <div className="text-purple-300 font-bold">🏥 HL7 / FHIR R4 Bundle Observation:</div>
            <pre className="bg-slate-950 p-3 rounded-xl overflow-x-auto text-[11px] text-slate-300">
              {JSON.stringify(fhirResult, null, 2)}
            </pre>
          </div>
        )}

        {/* WASM Result */}
        {maasResult && (
          <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl text-xs font-mono space-y-2">
            <div className="text-emerald-400 font-bold">⚡ WASM Stream Output:</div>
            <pre className="bg-slate-950 p-3 rounded-xl overflow-x-auto text-[11px] text-slate-300">
              {JSON.stringify(maasResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
