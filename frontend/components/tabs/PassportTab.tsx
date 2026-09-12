"use client";

import React from "react";
import type { TranslationDict } from "../../lib/translations";
import type { ScholarProfile } from "../../lib/types";
import { Panel } from "@/components/ui/Panel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";

interface PassportTabProps {
  t: TranslationDict;
  activeScholar: ScholarProfile | null;
  passportData: ScholarProfile | null;
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
      <Panel className="p-4 sm:p-7 space-y-6">
        <SectionHeader
          icon="biotech"
          title={t.passHeader}
          subtitle={t.passSubheader}
          right={
            <div className="flex gap-2">
              <Input
                value={targetOrcid}
                onChange={(e) => setTargetOrcid(e.target.value)}
                placeholder={t.passSearchPlaceholder}
                className="text-xs font-mono"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleFetchPassport(targetOrcid)}
              >
                {t.passViewBtn}
              </Button>
            </div>
          }
        />

        {profile ? (
          <div className="space-y-6">
            {/* Main Badge */}
            <div className="p-5 sm:p-6 relative border border-[var(--surface-border)] bg-[var(--surface-hi)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[1.1em]" aria-hidden>biotech</span>
                  <h3 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">{profile.name}</h3>
                </div>
                <div className="text-xs font-mono text-[var(--text-mid)]">
                  ORCID: <strong className="text-[var(--foreground)]">{profile.orcid}</strong>
                </div>
                <div className="text-xs text-[var(--text-mid)]">
                  {profile.institution} • <span className="text-[var(--info)]">{profile.discipline}</span>
                </div>
              </div>

              <div className="text-center border border-[var(--surface-border)] bg-black/40 p-4 shrink-0 w-full md:w-auto">
                <span className="text-[10px] font-mono uppercase text-[var(--text-mid)] block">{t.passScoreLabel}</span>
                <strong className="text-3xl sm:text-4xl font-black text-[var(--sci-red)] font-mono">
                  {profile.git_impact_score || 184.0}
                </strong>
                <span className="block text-[10px] text-[var(--text-mid)] font-mono mt-1">
                  {profile.platform_tier || "Protocol Architect"}
                </span>
              </div>
            </div>

            {/* Score Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs font-mono">
              <div className="p-3 bg-black/40 border border-[var(--surface-border)]">
                <span className="text-[var(--text-low)] block text-[10px] uppercase">{t.passWorksPts}</span>
                <strong className="text-[var(--ok)] text-lg font-bold">12</strong>
              </div>
              <div className="p-3 bg-black/40 border border-[var(--surface-border)]">
                <span className="text-[var(--text-low)] block text-[10px] uppercase">{t.passMaasPts}</span>
                <strong className="text-[var(--info)] text-lg font-bold">48</strong>
              </div>
              <div className="p-3 bg-black/40 border border-[var(--surface-border)]">
                <span className="text-[var(--text-low)] block text-[10px] uppercase">{t.passCreditPts}</span>
                <strong className="text-[var(--info)] text-lg font-bold">34</strong>
              </div>
              <div className="p-3 bg-black/40 border border-[var(--surface-border)]">
                <span className="text-[var(--text-low)] block text-[10px] uppercase">{t.passCourtPts}</span>
                <strong className="text-[var(--warn)] text-lg font-bold">5</strong>
              </div>
              <div className="p-3 bg-black/40 border border-[var(--surface-border)] col-span-2 sm:col-span-1">
                <span className="text-[var(--text-low)] block text-[10px] uppercase">{t.passCitationsPts}</span>
                <strong className="text-[var(--foreground)] text-lg font-bold">85</strong>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            icon="person"
            title={t.passEmptyTitle}
            body={<p>{t.passEmptyBody}</p>}
          />
        )}
      </Panel>
    </div>
  );
}
