"use client";

import React from "react";
import { IPC_CLASSES } from "../../lib/constants";
import type { TranslationDict } from "../../lib/translations";
import type { LibraryArticle } from "../../lib/types";
import type { TabKey } from "../NavigationTabs";

interface LibraryTabProps {
  t: TranslationDict;
  lang: "KZ" | "RU" | "EN";
  filteredLibrary: LibraryArticle[];
  libSearch: string;
  setLibSearch: (s: string) => void;
  libIpcFilter: string;
  setLibIpcFilter: (s: string) => void;
  activePdfUrl: string | null;
  setActivePdfUrl: (s: string | null) => void;
  setSearchInspectCode: (s: string) => void;
  setActiveTab: (tab: TabKey) => void;
  handleInspect: (code: string) => void;
  apiBase: string;
}

export default function LibraryTab({
  t,
  lang,
  filteredLibrary,
  libSearch,
  setLibSearch,
  libIpcFilter,
  setLibIpcFilter,
  activePdfUrl,
  setActivePdfUrl,
  setSearchInspectCode,
  setActiveTab,
  handleInspect,
  apiBase,
}: LibraryTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-[#0e1726] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
              <span>🏛️</span> {t.libHeader}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">{t.libSubheader}</p>
          </div>
          <div className="text-xs font-mono text-emerald-400 px-3 py-1 bg-emerald-950/60 rounded-xl border border-emerald-500/40">
            Total: {filteredLibrary.length} works
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={libSearch}
            onChange={(e) => setLibSearch(e.target.value)}
            placeholder={t.libSearchPlaceholder}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-100 focus:border-emerald-500 outline-none"
          />
          <select
            value={libIpcFilter}
            onChange={(e) => setLibIpcFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 outline-none"
          >
            {IPC_CLASSES.map((c) => (
              <option key={c.code} value={c.code}>
                {lang === "KZ" ? c.name_kz : lang === "RU" ? c.name_ru : c.name_en}
              </option>
            ))}
          </select>
        </div>

        {/* Embedded PDF Viewer Modal */}
        {activePdfUrl && (
          <div className="bg-slate-950 border border-slate-700 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-cyan-300 font-bold">📄 PDF Viewer (ISO 14721 CAS Stream)</span>
              <button
                onClick={() => setActivePdfUrl(null)}
                className="text-xs text-red-400 hover:text-red-300 font-mono font-bold"
              >
                {t.closePdfBtn}
              </button>
            </div>
            <iframe src={activePdfUrl} className="w-full h-[550px] rounded-xl border border-slate-800" />
          </div>
        )}

        {/* Library Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLibrary.map((art) => (
            <div
              key={art.registration_code}
              className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 sm:p-5 space-y-3 transition flex flex-col justify-between shadow-lg min-w-0 overflow-hidden"
            >
              <div className="space-y-2 min-w-0">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs font-mono text-cyan-400 font-bold truncate">{art.registration_code}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 shrink-0">
                    {art.license_type || "CC-BY-4.0"}
                  </span>
                </div>
                <h3 className="font-bold text-sm sm:text-base text-slate-100 line-clamp-2 break-words">{art.title}</h3>
                <p className="text-xs text-slate-400 truncate">
                  Автор: <strong className="text-slate-200">{art.author_name}</strong>
                </p>
                <div className="text-[11px] text-slate-500 font-mono space-y-0.5 min-w-0">
                  <div className="truncate">IPFS CID: <span className="text-cyan-400 truncate">{art.ipfs_cid || "bafyafybeid6..."}</span></div>
                  <div>Дереккөз: <span className="text-amber-300">{art.source_archive || "Sovereign Notary"}</span></div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => {
                    setSearchInspectCode(art.registration_code);
                    setActiveTab("inspector");
                    handleInspect(art.registration_code);
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2 rounded-xl font-mono transition"
                >
                  {t.viewDetailsBtn}
                </button>
                <button
                  onClick={() => setActivePdfUrl(`${apiBase}/certificate/pdf/${art.registration_code}`)}
                  className="flex-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs py-2 rounded-xl font-mono transition font-bold"
                >
                  {t.readPdfBtn}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
