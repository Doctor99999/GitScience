"use client";

import React from "react";
import type { TranslationDict } from "../../lib/translations";
import type { ZkCommitResult, ZkRevealResult } from "../../lib/types";
import { Panel } from "@/components/ui/Panel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Textarea } from "@/components/ui/Field";

interface ZkDiscoveryTabProps {
  t: TranslationDict;
  zkTitle: string;
  setZkTitle: (s: string) => void;
  zkSecret: string;
  setZkSecret: (s: string) => void;
  zkPayload: string;
  setZkPayload: (s: string) => void;
  zkFormula: string;
  setZkFormula: (s: string) => void;
  handleZkCommit: () => void;
  zkCommitResult: ZkCommitResult | null;
  zkRevealId: string;
  setZkRevealId: (s: string) => void;
  zkRevealSecret: string;
  setZkRevealSecret: (s: string) => void;
  zkRevealPayload: string;
  setZkRevealPayload: (s: string) => void;
  handleZkReveal: () => void;
  zkRevealResult: ZkRevealResult | null;
}

export default function ZkDiscoveryTab({
  t,
  zkTitle,
  setZkTitle,
  zkSecret,
  setZkSecret,
  zkPayload,
  setZkPayload,
  zkFormula,
  setZkFormula,
  handleZkCommit,
  zkCommitResult,
  zkRevealId,
  setZkRevealId,
  zkRevealSecret,
  setZkRevealSecret,
  zkRevealPayload,
  setZkRevealPayload,
  handleZkReveal,
  zkRevealResult,
}: ZkDiscoveryTabProps) {
  return (
    <div className="space-y-6">
      <Panel className="p-4 sm:p-7 space-y-6">
        <SectionHeader
          icon="lock"
          title={t.zkHeader}
          subtitle={t.zkSubheader}
        />

        {/* ZK Commit Box */}
        <div className="p-4 sm:p-5 bg-black/40 border border-[var(--surface-border)] space-y-4 text-xs">
          <h3 className="font-bold text-sm text-[var(--ok)]">{t.zkCommitStepTitle}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label={`${t.zkHypothesisTitle} *`}
              value={zkTitle}
              onChange={(e) => setZkTitle(e.target.value)}
            />
            <Input
              label={`${t.zkSecretLabel} *`}
              type="password"
              value={zkSecret}
              onChange={(e) => setZkSecret(e.target.value)}
              placeholder={t.zkSecretSaltPlaceholder}
              className="font-mono"
            />
          </div>

          <Textarea
            label={`${t.zkPayloadLabel} *`}
            rows={2}
            value={zkPayload}
            onChange={(e) => setZkPayload(e.target.value)}
          />

          <Input
            label={t.zkFormulaLabel}
            value={zkFormula}
            onChange={(e) => setZkFormula(e.target.value)}
            className="font-mono"
          />

          <Button
            variant="primary"
            className="w-full font-mono"
            onClick={handleZkCommit}
          >
            {t.zkCommitBtn}
          </Button>

          {zkCommitResult && (
            <Panel tone="ok" className="font-mono text-[11px] space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="ok" icon="check_circle">{t.zkCommitBadge}</Badge>
              </div>
              <div>Commitment ID: <strong className="text-[var(--info)]">{zkCommitResult.commitment_id}</strong></div>
              <div className="truncate">Blind Hash: <strong className="text-[var(--foreground)]">{zkCommitResult.blind_commitment_hash}</strong></div>
            </Panel>
          )}
        </div>

        {/* ZK Reveal Box */}
        <div className="p-4 sm:p-5 bg-black/40 border border-[var(--surface-border)] space-y-4 text-xs">
          <h3 className="font-bold text-sm text-[var(--info)]">{t.zkRevealTitle}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label={`${t.zkRevealCommitId} *`}
              value={zkRevealId}
              onChange={(e) => setZkRevealId(e.target.value)}
              placeholder="ZK-..."
              className="font-mono"
            />
            <Input
              label={`${t.zkSecretLabel} *`}
              type="password"
              value={zkRevealSecret}
              onChange={(e) => setZkRevealSecret(e.target.value)}
              className="font-mono"
            />
          </div>

          <Textarea
            label={`${t.zkRevealPayloadLabel} *`}
            rows={2}
            value={zkRevealPayload}
            onChange={(e) => setZkRevealPayload(e.target.value)}
          />

          <Button
            variant="secondary"
            className="w-full font-mono"
            onClick={handleZkReveal}
          >
            {t.zkRevealBtn}
          </Button>

          {zkRevealResult && (
            <Panel tone="info" className="font-mono text-[11px] space-y-1">
              <div className="text-[var(--info)] font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[1.1em]" aria-hidden>lock_open</span>
                {t.zkResultLabel} {zkRevealResult.status}
              </div>
              <div>Priority Proved: <span className="text-[var(--ok)] font-bold">{zkRevealResult.is_authentic ? "100% MATCH" : "FAILED"}</span></div>
            </Panel>
          )}
        </div>
      </Panel>
    </div>
  );
}
