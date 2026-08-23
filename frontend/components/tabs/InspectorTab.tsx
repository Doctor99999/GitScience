"use client";

import React from "react";

interface InspectorTabProps {
  t: any;
  searchInspectCode: string;
  setSearchInspectCode: (s: string) => void;
  handleInspect: (code: string) => void;
  inspectedDoc: any;
  handleViewLicense: (code: string) => void;
  handleMintIpNft: (code: string) => void;
  ipNftMinting: boolean;
  ipNftResult: any;
  apiBase: string;
}

export default function InspectorTab({
  t,
  searchInspectCode,
  setSearchInspectCode,
  handleInspect,
  inspectedDoc,
  handleViewLicense,
  handleMintIpNft,
  ipNftMinting,
  ipNftResult,
  apiBase,
}: InspectorTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-[#0e1726] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl space-y-5">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <span>🔍</span> {t.inspectHeader}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">{t.inspectSubheader}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={searchInspectCode}
            onChange={(e) => setSearchInspectCode(e.target.value)}
            placeholder={t.inspectSearchPlaceholder}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:border-emerald-500 outline-none font-mono"
          />
          <button
            onClick={() => handleInspect(searchInspectCode)}
            className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs px-6 py-2.5 rounded-xl transition font-mono"
          >
            {t.inspectSearchBtn}
          </button>
        </div>

        {inspectedDoc && (
          <div className="space-y-4 pt-2">
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono uppercase text-emerald-400 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40">
                {inspectedDoc.registration_code}
              </span>
              <h3 className="font-bold text-base sm:text-lg text-slate-100">{inspectedDoc.title}</h3>
              <p className="text-xs text-slate-400">
                Автор: <strong className="text-slate-200">{inspectedDoc.author_name}</strong> (ORCID: {inspectedDoc.orcid})
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Layer 1 */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs font-mono">
                <strong className="text-emerald-400 block font-bold text-xs">{t.layer1Title}</strong>
                <div className="text-[11px] text-slate-400 space-y-1">
                  <div>WIPO IPC: <span className="text-slate-200">{inspectedDoc.ipc_class}</span></div>
                  <div>Лицензия: <span className="text-slate-200">{inspectedDoc.license_type}</span></div>
                  <div>Закон: <span className="text-slate-200">35 U.S.C. § 102(a)(1)</span></div>
                </div>
              </div>

              {/* Layer 2 */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs font-mono">
                <strong className="text-cyan-400 block font-bold text-xs">{t.layer2Title}</strong>
                <div className="text-[11px] text-slate-400 space-y-1">
                  <div className="truncate">SHA-256: <span className="text-slate-200">{inspectedDoc.sha256_hash}</span></div>
                  <div className="truncate">Git OID: <span className="text-slate-200">{inspectedDoc.git_commit_hash}</span></div>
                  <div>Anchor: <span className="text-emerald-400">Bitcoin OTS Anchored</span></div>
                </div>
              </div>

              {/* Layer 3 */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs font-mono">
                <strong className="text-purple-400 block font-bold text-xs">{t.layer3Title}</strong>
                <div className="text-[11px] text-slate-400 space-y-1">
                  <div>Формула: <span className="text-cyan-300">{inspectedDoc.formula_math}</span></div>
                  <div className="truncate">AST Merkle: <span className="text-slate-200">{inspectedDoc.ast_merkle_digest}</span></div>
                  <div>Режим: <span className="text-amber-300">RUO Class I CDSS</span></div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => handleViewLicense(inspectedDoc.registration_code)}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs px-4 py-2 rounded-xl font-mono transition"
              >
                {t.downloadLicenseBtn}
              </button>
              <button
                onClick={() => handleMintIpNft(inspectedDoc.registration_code)}
                disabled={ipNftMinting}
                className="bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-purple-300 text-xs px-4 py-2 rounded-xl font-mono transition"
              >
                {ipNftMinting ? "Токенизация..." : t.mintIpNftBtn}
              </button>
              <a
                href={`${apiBase}/certificate/pdf/${inspectedDoc.registration_code}`}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition font-sans inline-block"
              >
                {t.downloadCertPdfBtn}
              </a>
            </div>

            {ipNftResult && (
              <div className="p-4 bg-purple-950/40 border border-purple-500/40 rounded-2xl text-xs font-mono space-y-1">
                <div className="text-purple-300 font-bold">🧬 Sovereign IP-NFT Патент токенизирован:</div>
                <div>Standard: <span className="text-slate-200">{ipNftResult.contract_standard}</span></div>
                <div>Royalty to Founder: <span className="text-emerald-400 font-bold">{ipNftResult.founder_royalty_pct}</span></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
