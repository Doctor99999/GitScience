"use client";

import React from "react";
import { IPC_CLASSES } from "../../lib/constants";
import type { TranslationDict } from "../../lib/translations";
import type { AiAuditResult, AstVerificationResult, NotarySuccessResult } from "../../lib/types";

interface NotaryTabProps {
  t: TranslationDict;
  lang: "KZ" | "RU" | "EN";
  file: File | null;
  setFile: (f: File | null) => void;
  title: string;
  setTitle: (s: string) => void;
  authorName: string;
  setAuthorName: (s: string) => void;
  orcid: string;
  setOrcid: (s: string) => void;
  category: string;
  setCategory: (s: string) => void;
  ipcClass: string;
  setIpcClass: (s: string) => void;
  hasHumanSubjects: boolean;
  setHasHumanSubjects: (b: boolean) => void;
  abstract: string;
  setAbstract: (s: string) => void;
  formulaMath: string;
  setFormulaMath: (s: string) => void;
  handleVerifyFormula: () => void;
  astVerification: AstVerificationResult | null;
  handleRunAiAudit: () => void;
  aiAuditLoading: boolean;
  aiAuditResult: AiAuditResult | null;
  handleNotarize: () => void;
  notarySubmitting: boolean;
  notarySuccess: NotarySuccessResult | null;
  apiBase: string;
}

export default function NotaryTab({
  t,
  lang,
  file,
  setFile,
  title,
  setTitle,
  authorName,
  setAuthorName,
  orcid,
  setOrcid,
  category,
  setCategory,
  ipcClass,
  setIpcClass,
  hasHumanSubjects,
  setHasHumanSubjects,
  abstract,
  setAbstract,
  formulaMath,
  setFormulaMath,
  handleVerifyFormula,
  astVerification,
  handleRunAiAudit,
  aiAuditLoading,
  aiAuditResult,
  handleNotarize,
  notarySubmitting,
  notarySuccess,
  apiBase,
}: NotaryTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-[#0e1726] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-lg sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <span>🛡️</span> {t.uploadHeader}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">{t.uploadSubheader}</p>
        </div>

        {/* Dropzone */}
        <div
          onClick={() => document.getElementById("pdfUploadInput")?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-emerald-500/80 bg-slate-900/60 hover:bg-slate-900/90 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
        >
          <input
            id="pdfUploadInput"
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setFile(e.target.files[0]);
              }
            }}
          />
          <span className="text-3xl">📄</span>
          <p className="text-xs sm:text-sm font-medium text-slate-300">
            {file ? `Таңдалған файл: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)` : t.dropzoneText}
          </p>
          <span className="text-[11px] text-slate-500 font-mono">
            ISO 14721 OAIS • SHA-256 CAS Vault • WIPO Legal Proof
          </span>
        </div>

        {/* Metadata Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">{t.paperTitle} *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">{t.leadAuthor} *</label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Salauat Abiltayevich Yeshimov"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">{t.orcidId} *</label>
            <input
              type="text"
              value={orcid}
              onChange={(e) => setOrcid(e.target.value)}
              placeholder="0009-0003-3929-3605"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-emerald-400 focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">{t.categoryLabel}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
            >
              <option value="Clinical Oncology & Surgery">Clinical Oncology & Surgery</option>
              <option value="Molecular Biology & Genetics">Molecular Biology & Genetics</option>
              <option value="Healthcare Informatics & AI">Healthcare Informatics & AI</option>
              <option value="Computational Systems & Algorithms">Computational Systems & Algorithms</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">{t.ipcLabel}</label>
            <select
              value={ipcClass}
              onChange={(e) => setIpcClass(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
            >
              {IPC_CLASSES.map((c) => (
                <option key={c.code} value={c.code}>
                  {lang === "KZ" ? c.name_kz : lang === "RU" ? c.name_ru : c.name_en}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="irbCheck"
              checked={hasHumanSubjects}
              onChange={(e) => setHasHumanSubjects(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-700"
            />
            <label htmlFor="irbCheck" className="text-slate-300 select-none cursor-pointer">
              {t.irbCheck}
            </label>
          </div>
        </div>

        {/* Abstract */}
        <div className="text-xs">
          <label className="block text-slate-400 font-semibold mb-1">{t.abstractLabel}</label>
          <textarea
            rows={3}
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
          />
        </div>

        {/* Safe AST Formula */}
        <div className="text-xs space-y-2">
          <label className="block text-slate-400 font-semibold">{t.formulaLabel}</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={formulaMath}
              onChange={(e) => setFormulaMath(e.target.value)}
              placeholder="(Artery + Vein) / (Lymph + 1.0)"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono text-cyan-300 focus:border-emerald-500 outline-none"
            />
            <button
              onClick={handleVerifyFormula}
              className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 px-4 py-2 rounded-xl font-mono text-xs transition"
            >
              {t.verifyFormulaBtn}
            </button>
          </div>

          {astVerification && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1 text-slate-300">
              <div className="text-emerald-400 font-bold">✅ Safe AST Компиляция: {astVerification.status}</div>
              <div className="truncate">AST Merkle Digest: <strong className="text-cyan-300">{astVerification.ast_merkle_digest}</strong></div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleRunAiAudit}
            disabled={aiAuditLoading}
            className="flex-1 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/60 text-purple-200 font-bold py-3 rounded-xl text-xs sm:text-sm transition shadow"
          >
            {aiAuditLoading ? "ИИ-Аудит жүріп жатыр..." : t.aiAuditBtn}
          </button>

          <button
            onClick={handleNotarize}
            disabled={notarySubmitting}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold py-3 rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-500/20 hover:opacity-95 transition"
          >
            {notarySubmitting ? "Тізілімге бекітілуде..." : t.notarizeBtn}
          </button>
        </div>

        {/* AI Audit Result */}
        {aiAuditResult && (
          <div className="p-4 bg-purple-950/30 border border-purple-500/40 rounded-2xl space-y-3 text-xs font-mono">
            <div className="flex justify-between items-center text-purple-300 font-bold">
              <span>🤖 AI Audit Dossier: {aiAuditResult.dossier_id}</span>
              <span className="text-emerald-400">Score: {aiAuditResult.ai_composite_scores?.composite_quality_index}/10</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 bg-slate-900 rounded-lg">Math: {aiAuditResult.ai_composite_scores?.math_rigor_score}/10</div>
              <div className="p-2 bg-slate-900 rounded-lg">Methodology: {aiAuditResult.ai_composite_scores?.methodology_score}/10</div>
              <div className="p-2 bg-slate-900 rounded-lg">Novelty: {aiAuditResult.ai_composite_scores?.novelty_score}/10</div>
              <div className="p-2 bg-slate-900 rounded-lg">Bioethics: {aiAuditResult.ai_composite_scores?.bioethics_score}/10</div>
            </div>
          </div>
        )}

        {/* Notary Success Banner */}
        {notarySuccess && (
          <div className="p-5 bg-emerald-950/40 border border-emerald-500/50 rounded-2xl space-y-3 text-xs font-mono shadow-xl min-w-0 overflow-hidden">
            <div className="text-emerald-400 font-bold text-sm sm:text-base flex items-center gap-2">
              <span>🛡️</span> {t.notarySuccessTitle}
            </div>
            <div className="space-y-1 text-slate-300 text-[11px] min-w-0">
              <div className="break-all">{t.notaryCertId}: <strong className="text-cyan-300 break-all">{notarySuccess.registration_code}</strong></div>
              <div className="break-all">{t.notarySha}: <strong className="text-emerald-300 break-all">{notarySuccess.sha256_hash}</strong></div>
              <div className="break-all">{t.notaryOid}: <strong className="text-purple-300 break-all">{notarySuccess.git_commit_hash}</strong></div>
            </div>
            <a
              href={`${apiBase}/certificate/pdf/${notarySuccess.registration_code}`}
              target="_blank"
              rel="noreferrer"
              className="inline-block w-full text-center bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl transition text-xs font-sans mt-2"
            >
              {t.downloadCertPdfBtn}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
