"use client";

import React from "react";
import { IPC_CLASSES } from "../../lib/constants";
import type { TranslationDict } from "../../lib/translations";
import type { AiAuditResult, AstVerificationResult, NotarySuccessResult } from "../../lib/types";
import { Panel } from "@/components/ui/Panel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/Field";

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
      <Panel className="space-y-6 p-4 sm:p-7">
        <SectionHeader
          icon="shield"
          kicker="NOTARY"
          title={
            <h2 className="font-display text-lg font-extrabold uppercase tracking-tight text-[var(--foreground)]">
              {t.uploadHeader}
            </h2>
          }
          subtitle={<p>{t.uploadSubheader}</p>}
        />

        {/* Dropzone */}
        <div
          onClick={() => document.getElementById("pdfUploadInput")?.click()}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border-2 border-dashed border-[var(--surface-border)] bg-black/40 p-6 text-center transition hover:border-[var(--ok)]/80 hover:bg-black/60"
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
          <span className="material-symbols-outlined text-[2.5em] text-[var(--text-mid)]" aria-hidden>
            description
          </span>
          <p className="text-xs font-medium text-[var(--text-mid)] sm:text-sm">
            {file ? `Таңдалған файл: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)` : t.dropzoneText}
          </p>
          <span className="font-mono text-[11px] text-[var(--text-low)]">
            ISO 14721 OAIS • SHA-256 CAS Vault • WIPO Legal Proof
          </span>
        </div>

        {/* Metadata Form */}
        <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-2">
          <Input label={`${t.paperTitle} *`} value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input
            label={`${t.leadAuthor} *`}
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Salauat Abiltayevich Yeshimov"
          />
          <Input
            label={`${t.orcidId} *`}
            icon="badge"
            value={orcid}
            onChange={(e) => setOrcid(e.target.value)}
            placeholder="0009-0003-3929-3605"
            className="font-mono"
          />
          <Select label={t.categoryLabel} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="Clinical Oncology & Surgery">Clinical Oncology & Surgery</option>
            <option value="Molecular Biology & Genetics">Molecular Biology & Genetics</option>
            <option value="Healthcare Informatics & AI">Healthcare Informatics & AI</option>
            <option value="Computational Systems & Algorithms">Computational Systems & Algorithms</option>
          </Select>
          <Select label={t.ipcLabel} value={ipcClass} onChange={(e) => setIpcClass(e.target.value)}>
            {IPC_CLASSES.map((c) => (
              <option key={c.code} value={c.code}>
                {lang === "KZ" ? c.name_kz : lang === "RU" ? c.name_ru : c.name_en}
              </option>
            ))}
          </Select>
          <Checkbox
            id="irbCheck"
            label={t.irbCheck}
            checked={hasHumanSubjects}
            onChange={setHasHumanSubjects}
            className="pt-6"
          />
        </div>

        {/* Abstract */}
        <Textarea label={t.abstractLabel} rows={3} value={abstract} onChange={(e) => setAbstract(e.target.value)} />

        {/* Safe AST Formula */}
        <div className="space-y-2 text-xs">
          <span className="sci-label block text-[var(--text-mid)]">{t.formulaLabel}</span>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex-1">
              <Input
                icon="calculate"
                value={formulaMath}
                onChange={(e) => setFormulaMath(e.target.value)}
                placeholder="(Artery + Vein) / (Lymph + 1.0)"
                className="font-mono"
              />
            </div>
            <Button
              variant="secondary"
              onClick={handleVerifyFormula}
              icon={
                <span className="material-symbols-outlined text-[1.1em]" aria-hidden>
                  check_circle
                </span>
              }
              className="self-end sm:self-start"
            >
              {t.verifyFormulaBtn}
            </Button>
          </div>

          {astVerification && (
            <Panel tone="ok" className="space-y-1 p-3 font-mono text-[11px]">
              <Badge variant="ok" icon="check_circle">
                Safe AST Компиляция: {astVerification.status}
              </Badge>
              <div className="truncate text-[var(--text-mid)]">
                AST Merkle Digest: <strong className="text-[var(--info)]">{astVerification.ast_merkle_digest}</strong>
              </div>
            </Panel>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <Button
            variant="secondary"
            onClick={handleRunAiAudit}
            disabled={aiAuditLoading}
            loading={aiAuditLoading}
            className="flex-1"
            icon={
              <span className="material-symbols-outlined text-[1.1em]" aria-hidden>
                smart_toy
              </span>
            }
          >
            {aiAuditLoading ? "ИИ-Аудит жүріп жатыр..." : t.aiAuditBtn}
          </Button>

          <Button
            variant="primary"
            onClick={handleNotarize}
            disabled={notarySubmitting}
            loading={notarySubmitting}
            className="flex-1"
            icon={
              <span className="material-symbols-outlined text-[1.1em]" aria-hidden>
                verified_user
              </span>
            }
          >
            {notarySubmitting ? "Тізілімге бекітілуде..." : t.notarizeBtn}
          </Button>
        </div>

        {/* AI Audit Result */}
        {aiAuditResult && (
          <Panel tone="info" className="space-y-3 p-4 font-mono text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 font-bold text-[var(--info)]">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[1.1em]" aria-hidden>
                  smart_toy
                </span>
                AI Audit Dossier: {aiAuditResult.dossier_id}
              </span>
              <span className="text-[var(--ok)]">
                Score: {aiAuditResult.ai_composite_scores?.composite_quality_index}/10
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
              <div className="rounded-[var(--radius-card)] bg-black/40 p-2">
                Math: {aiAuditResult.ai_composite_scores?.math_rigor_score}/10
              </div>
              <div className="rounded-[var(--radius-card)] bg-black/40 p-2">
                Methodology: {aiAuditResult.ai_composite_scores?.methodology_score}/10
              </div>
              <div className="rounded-[var(--radius-card)] bg-black/40 p-2">
                Novelty: {aiAuditResult.ai_composite_scores?.novelty_score}/10
              </div>
              <div className="rounded-[var(--radius-card)] bg-black/40 p-2">
                Bioethics: {aiAuditResult.ai_composite_scores?.bioethics_score}/10
              </div>
            </div>
          </Panel>
        )}

        {/* Notary Success Banner */}
        {notarySuccess && (
          <Panel tone="ok" className="min-w-0 space-y-3 p-5 font-mono text-xs">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--ok)] sm:text-base">
              <span className="material-symbols-outlined text-[1.1em]" aria-hidden>
                verified_user
              </span>
              {t.notarySuccessTitle}
            </div>
            <div className="min-w-0 space-y-1 text-[11px] text-[var(--text-mid)]">
              <div className="break-all">
                {t.notaryCertId}: <strong className="break-all text-[var(--info)]">{notarySuccess.registration_code}</strong>
              </div>
              <div className="break-all">
                {t.notarySha}: <strong className="break-all text-[var(--ok)]">{notarySuccess.sha256_hash}</strong>
              </div>
              <div className="break-all">
                {t.notaryOid}: <strong className="break-all text-[var(--sci-red)]">{notarySuccess.git_commit_hash}</strong>
              </div>
            </div>
            <a
              href={`${apiBase}/certificate/pdf/${notarySuccess.registration_code}`}
              target="_blank"
              rel="noreferrer"
              className="sci-btn-primary mt-2 inline-block w-full py-2.5 text-center font-sans text-xs"
            >
              {t.downloadCertPdfBtn}
            </a>
          </Panel>
        )}
      </Panel>
    </div>
  );
}