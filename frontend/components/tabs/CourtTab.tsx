"use client";

import React from "react";
import type { TranslationDict } from "../../lib/translations";
import type { CourtCase } from "../../lib/types";
import { Panel } from "@/components/ui/Panel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Textarea } from "@/components/ui/Field";

interface CourtTabProps {
  t: TranslationDict;
  courtCases: CourtCase[];
  courtClaimantName: string;
  setCourtClaimantName: (s: string) => void;
  courtClaimantOrcid: string;
  setCourtClaimantOrcid: (s: string) => void;
  courtTargetCode: string;
  setCourtTargetCode: (s: string) => void;
  courtReason: string;
  setCourtReason: (s: string) => void;
  handleFileDispute: () => void;
  courtDisputeResult: CourtCase | null;
  handleVoteCase: (caseId: string, vote: "valid" | "invalid" | "abstain") => void;
}

export default function CourtTab({
  t,
  courtCases,
  courtClaimantName,
  setCourtClaimantName,
  courtClaimantOrcid,
  setCourtClaimantOrcid,
  courtTargetCode,
  setCourtTargetCode,
  courtReason,
  setCourtReason,
  handleFileDispute,
  courtDisputeResult,
  handleVoteCase,
}: CourtTabProps) {
  return (
    <div className="space-y-6">
      <Panel className="space-y-6 p-4 sm:p-7">
        <SectionHeader
          icon="balance"
          title={
            <h2 className="font-display text-lg font-extrabold uppercase tracking-tight text-[var(--foreground)]">
              {t.courtHeader}
            </h2>
          }
          subtitle={<p>{t.courtSubheader}</p>}
        />

        {/* Dispute Filing Form */}
        <Panel className="space-y-4 p-5 text-xs bg-black/40">
          <h3 className="font-bold text-sm text-[var(--warn)] flex items-center gap-2">
            <span className="material-symbols-outlined text-[1.1em]" aria-hidden>
              balance
            </span>{" "}
            {t.courtFileTitle}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Input
                label={`${t.courtClaimantName} *`}
                value={courtClaimantName}
                onChange={(e) => setCourtClaimantName(e.target.value)}
              />
            </div>
            <div>
              <Input
                label={`${t.courtClaimantOrcid} *`}
                value={courtClaimantOrcid}
                onChange={(e) => setCourtClaimantOrcid(e.target.value)}
                className="font-mono text-[var(--ok)]"
              />
            </div>
            <div>
              <Input
                label={`${t.courtTargetCode} *`}
                value={courtTargetCode}
                onChange={(e) => setCourtTargetCode(e.target.value)}
                placeholder="GS-2026-00001"
                className="font-mono text-[var(--info)]"
              />
            </div>
          </div>

          <div>
            <Textarea
              label={`${t.courtReasonLabel} *`}
              rows={2}
              value={courtReason}
              onChange={(e) => setCourtReason(e.target.value)}
            />
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handleFileDispute}
            className="w-full"
            icon={
              <span className="material-symbols-outlined text-[1.1em]" aria-hidden>
                balance
              </span>
            }
          >
            {t.courtSubmitBtn}
          </Button>

          {courtDisputeResult && (
            <Panel tone="ok" className="p-4 font-mono text-[11px] space-y-1">
              <div className="font-bold text-[var(--ok)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[1.1em]" aria-hidden>
                  balance
                </span>{" "}
                Дау ісі тіркелді:
              </div>
              <div>Case ID: <strong className="text-[var(--info)]">{courtDisputeResult.case_id}</strong></div>
              <div>Status: <span className="font-bold text-[var(--ok)]">{courtDisputeResult.status}</span></div>
            </Panel>
          )}
        </Panel>

        {/* Active Cases */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-[var(--foreground)]">{t.courtActiveCases}</h3>

          <div className="space-y-3">
            {courtCases.map((c) => (
              <Panel key={c.case_id} className="space-y-3 p-4 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-[var(--info)]">{c.case_id}</span>
                  <Badge
                    variant={
                      /approved|granted|resolved/i.test(c.status) ? "ok" : /pending|review/i.test(c.status) ? "warn" : "default"
                    }
                    icon="gavel"
                  >
                    {c.status}
                  </Badge>
                </div>

                <div>
                  <div className="font-semibold text-[var(--text-mid)]">Оспариваемый манускрипт: {c.target_code}</div>
                  <div className="text-[11px] text-[var(--text-low)] mt-0.5">Шағымданушы: {c.claimant_name} ({c.claimant_orcid})</div>
                  <p className="text-xs text-[var(--text-mid)] mt-1 bg-black/40 p-2.5 border border-[var(--surface-border)]">
                    {c.reason}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--surface-border)] font-mono text-[11px]">
                  <div className="flex gap-3 text-[var(--text-mid)]">
                    <span>Valid: <strong className="text-[var(--ok)]">{c.votes_valid}</strong></span>
                    <span>Invalid: <strong className="text-[var(--err)]">{c.votes_invalid}</strong></span>
                    <span>Abstain: <strong className="text-[var(--text-mid)]">{c.votes_abstain}</strong></span>
                  </div>

                  <div className="flex gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-[var(--ok)] border-[var(--ok)]/40 bg-[var(--ok-dim)] hover:bg-[var(--ok)]/20"
                      onClick={() => handleVoteCase(c.case_id, "valid")}
                      icon={
                        <span className="material-symbols-outlined text-[1.1em]" aria-hidden>
                          check_circle
                        </span>
                      }
                    >
                      {t.courtVoteValid}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleVoteCase(c.case_id, "invalid")}
                      icon={
                        <span className="material-symbols-outlined text-[1.1em]" aria-hidden>
                          cancel
                        </span>
                      }
                    >
                      {t.courtVoteInvalid}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleVoteCase(c.case_id, "abstain")}
                      icon={
                        <span className="material-symbols-outlined text-[1.1em]" aria-hidden>
                          remove
                        </span>
                      }
                    >
                      {t.courtVoteAbstain}
                    </Button>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  );
}