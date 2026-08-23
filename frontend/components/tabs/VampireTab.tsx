"use client";

import React from "react";

interface VampireTabProps {
  t: any;
  vampireQuery: string;
  setVampireQuery: (s: string) => void;
  vampireSource: "all" | "openalex" | "arxiv" | "pubmed";
  setVampireSource: (s: "all" | "openalex" | "arxiv" | "pubmed") => void;
  handleMultiSourceSearch: () => void;
  vampireSearching: boolean;
  vampireResults: any[];
  handleImportWork: (work: any) => void;
  vampireImporting: boolean;
  handleTriggerBatchHarvest: () => void;
  batchHarvesting: boolean;
  daemonRunning: boolean;
  daemonStats: any;
  handleToggleDaemon: (action: "start" | "stop") => void;
}

export default function VampireTab({
  t,
  vampireQuery,
  setVampireQuery,
  vampireSource,
  setVampireSource,
  handleMultiSourceSearch,
  vampireSearching,
  vampireResults,
  handleImportWork,
  vampireImporting,
  handleTriggerBatchHarvest,
  batchHarvesting,
  daemonRunning,
  daemonStats,
  handleToggleDaemon,
}: VampireTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-[#0e1726] border border-purple-500/40 rounded-3xl p-4 sm:p-7 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
              <span>🧛</span> {t.vampireHeader}
            </h2>
            <p className="text-xs sm:text-sm text-purple-300 mt-1">{t.vampireSubheader}</p>
          </div>

          <div className="flex items-center gap-2">
            {daemonRunning ? (
              <button
                onClick={() => handleToggleDaemon("stop")}
                className="bg-red-950/80 hover:bg-red-900 border border-red-500/60 text-red-200 font-bold px-3.5 py-1.5 rounded-xl font-mono text-xs transition"
              >
                {t.stopDaemonBtn}
              </button>
            ) : (
              <button
                onClick={() => handleToggleDaemon("start")}
                className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-200 font-bold px-3.5 py-1.5 rounded-xl font-mono text-xs transition"
              >
                {t.startDaemonBtn}
              </button>
            )}
          </div>
        </div>

        {/* Daemon Live Status */}
        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${daemonRunning ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`}></span>
            <span className={daemonRunning ? "text-emerald-300" : "text-slate-400"}>
              {daemonRunning ? t.daemonStatusRunning : t.daemonStatusStopped}
            </span>
          </div>
          {daemonStats && (
            <div className="text-[11px] text-slate-400 flex gap-3">
              <span>Total Harvested: <strong className="text-cyan-300">{daemonStats.total_harvested || 0}</strong></span>
              <span>Errors: <strong className="text-red-400">{daemonStats.errors_count || 0}</strong></span>
            </div>
          )}
        </div>

        {/* Source Pills */}
        <div className="flex flex-wrap gap-2 text-xs font-mono">
          {[
            { id: "all", label: t.sourceAll },
            { id: "openalex", label: t.sourceOpenAlex },
            { id: "arxiv", label: t.sourceArxiv },
            { id: "pubmed", label: t.sourcePubMed },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setVampireSource(s.id as any)}
              className={`px-3 py-1.5 rounded-xl transition ${
                vampireSource === s.id
                  ? "bg-purple-600 text-white font-bold shadow"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Search and Batch Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={vampireQuery}
            onChange={(e) => setVampireQuery(e.target.value)}
            placeholder={t.vampireSearchLabel}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:border-purple-500 outline-none"
          />
          <button
            onClick={handleMultiSourceSearch}
            disabled={vampireSearching}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition font-mono"
          >
            {vampireSearching ? "Ізделуде..." : t.vampireSearchBtn}
          </button>
          <button
            onClick={handleTriggerBatchHarvest}
            disabled={batchHarvesting}
            className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition font-mono"
          >
            {batchHarvesting ? "Жинақталуда..." : t.vampireHarvestBtn}
          </button>
        </div>

        <p className="text-[11px] text-slate-400 italic">
          {t.vampireLicenseNotice}
        </p>

        {/* Search Results */}
        {vampireResults.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-sm text-slate-200">Табылған манускрипттер ({vampireResults.length}):</h3>
            <div className="space-y-3">
              {vampireResults.map((work, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
                >
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40 font-bold">
                        {work.source || "Archive"}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {work.license || "Open Access"}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-100">{work.title}</h4>
                    <p className="text-slate-400 text-[11px]">
                      Авторлар: {work.authors || work.author_name || "Independent Researchers"}
                    </p>
                    {work.doi && (
                      <span className="text-[10px] font-mono text-cyan-400 block">DOI: {work.doi}</span>
                    )}
                  </div>

                  <button
                    onClick={() => handleImportWork(work)}
                    disabled={vampireImporting}
                    className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs font-mono transition shadow"
                  >
                    {vampireImporting ? "Импорт..." : t.vampireImportBtn}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
