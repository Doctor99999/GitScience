"use client";

import React, { useState } from "react";
import { DEFAULT_FOUNDER_PROFILE, getApiBase } from "../../lib/constants";
import type { TranslationDict } from "../../lib/translations";
import type { ScholarProfile } from "../../lib/types";

interface OrcidModalProps {
  show: boolean;
  onClose: () => void;
  t: TranslationDict;
  activeScholar: ScholarProfile | null;
  onLogin: (profile: ScholarProfile) => void;
  onLogout: () => void;
}

export default function OrcidModal({
  show,
  onClose,
  t,
  activeScholar,
  onLogin,
  onLogout,
}: OrcidModalProps) {
  const [inputOrcid, setInputOrcid] = useState(activeScholar?.orcid || "");
  const [inputScholarName, setInputScholarName] = useState(activeScholar?.name || "");
  const [inputInstitution, setInputInstitution] = useState(activeScholar?.institution || "");
  const [inputDiscipline, setInputDiscipline] = useState(activeScholar?.discipline || "Clinical Oncology & Surgery");

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0e1726] border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-5 sm:p-7 space-y-5">
        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
              <span>🧬</span> {t.loginOrcid}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {t.orcidModalSub}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 text-lg font-bold p-1"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">{t.orcidIdLabel}</label>
            <input
              type="text"
              value={inputOrcid}
              onChange={(e) => setInputOrcid(e.target.value)}
              placeholder="0009-0003-3929-3605"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">{t.fullNameLabel}</label>
            <input
              type="text"
              value={inputScholarName}
              onChange={(e) => setInputScholarName(e.target.value)}
              placeholder="Салауат Абильтаевич Ешимов"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">{t.institutionLabel}</label>
            <input
              type="text"
              value={inputInstitution}
              onChange={(e) => setInputInstitution(e.target.value)}
              placeholder="National Scientific Oncology Center"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">{t.disciplineLabel}</label>
            <select
              value={inputDiscipline}
              onChange={(e) => setInputDiscipline(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 outline-none"
            >
              <option value="Clinical Oncology & Surgery">Clinical Oncology & Surgery</option>
              <option value="Molecular Biology & Genetics">Molecular Biology & Genetics</option>
              <option value="Healthcare Informatics & AI">Healthcare Informatics & AI</option>
              <option value="Computational Systems & Algorithms">Computational Systems & Algorithms</option>
            </select>
          </div>

          <div className="pt-2 space-y-2">
            <button
              onClick={async () => {
                if (!inputOrcid || !inputScholarName) {
                  alert(t.orcidFormAlert);
                  return;
                }
                const localProfile = {
                  orcid: inputOrcid.trim(),
                  name: inputScholarName.trim(),
                  institution: inputInstitution.trim() || "Independent Scientific Institute",
                  discipline: inputDiscipline,
                  git_impact_score: 120.0,
                  platform_tier: "Verified Sovereign Scholar",
                };
                try {
                  // Реальная JWT-аутентификация: токен нужен для Court/Review (Sybil protection)
                  const res = await fetch(`${getApiBase()}/api/v1/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      orcid: localProfile.orcid,
                      name: localProfile.name,
                      institution: localProfile.institution,
                      discipline: localProfile.discipline,
                    }),
                  });
                  if (res.ok) {
                    const data = (await res.json()) as { profile?: ScholarProfile; access_token?: string };
                    onLogin({ ...(data.profile || localProfile), access_token: data.access_token });
                    return;
                  }
                } catch {}
                // Offline fallback: локальный профиль без токена
                onLogin(localProfile);
              }}
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold py-3 rounded-xl text-xs sm:text-sm shadow transition hover:opacity-90 font-mono"
            >
              {t.loginSubmitBtn}
            </button>

            <button
              onClick={() => onLogin(DEFAULT_FOUNDER_PROFILE)}
              className="w-full bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-mono text-xs py-2 rounded-xl transition"
            >
              {t.loginAsFounderBtn}
            </button>

            {activeScholar && (
              <button
                onClick={onLogout}
                className="w-full bg-red-950/40 hover:bg-red-900/40 border border-red-500/40 text-red-300 font-mono text-xs py-2 rounded-xl transition"
              >
                {t.logoutProfileBtn}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
