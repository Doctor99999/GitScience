"use client";

import React from "react";

interface PassportTabProps {
  t: any;
  activeScholar: any;
  passportData: any;
  targetOrcid: string;
  setTargetOrcid: (s: string) => void;
  handleFetchPassport: (orcid: string) => void;
}

export default function PassportTab({
  t,
  activeScholar,
  passportData,
  targetOrcid,
  setTargetOrcid,
  handleFetchPassport,
}: PassportTabProps) {
  const profile = passportData || activeScholar;

  return (
    <div className="space-y-6">
      <div className="bg-[#0e1726] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl space-y-6">
        <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
              <span>🧬</span> {t.passHeader}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">{t.passSubheader}</p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={targetOrcid}
              onChange={(e) => setTargetOrcid(e.target.value)}
              placeholder="ORCID iD бойынша іздеу..."
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-mono outline-none"
            />
            <button
              onClick={() => handleFetchPassport(targetOrcid)}
              className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs font-mono"
            >
              Көру
            </button>
          </div>
        </div>

        {profile ? (
          <div className="space-y-6">
            {/* Main Badge */}
            <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-emerald-950/40 to-slate-950 rounded-3xl border border-emerald-500/40 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">👨‍🔬</span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-50">{profile.name}</h3>
                </div>
                <div className="text-xs font-mono text-emerald-400">
                  ORCID: <strong className="text-slate-100">{profile.orcid}</strong>
                </div>
                <div className="text-xs text-slate-400">
                  {profile.institution} • <span className="text-cyan-300">{profile.discipline}</span>
                </div>
              </div>

              <div className="text-center bg-slate-900/90 border border-emerald-500/50 p-4 rounded-2xl shrink-0 w-full md:w-auto">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">{t.passScoreLabel}</span>
                <strong className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">
                  {profile.git_impact_score || 184.0}
                </strong>
                <span className="block text-[10px] text-amber-300 font-mono mt-1">
                  {profile.platform_tier || "Protocol Architect"}
                </span>
              </div>
            </div>

            {/* Score Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs font-mono">
              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">{t.passWorksPts}</span>
                <strong className="text-emerald-400 text-lg font-bold">12</strong>
              </div>
              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">{t.passMaasPts}</span>
                <strong className="text-cyan-400 text-lg font-bold">48</strong>
              </div>
              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">{t.passCreditPts}</span>
                <strong className="text-purple-400 text-lg font-bold">34</strong>
              </div>
              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">{t.passCourtPts}</span>
                <strong className="text-amber-300 text-lg font-bold">5</strong>
              </div>
              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-slate-500 block text-[10px] uppercase">{t.passCitationsPts}</span>
                <strong className="text-slate-100 text-lg font-bold">85</strong>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 font-mono text-xs">
            Профиль таңдалмаған. Жоғарғы оң жақтан ORCID арқылы кіріңіз.
          </div>
        )}
      </div>
    </div>
  );
}
