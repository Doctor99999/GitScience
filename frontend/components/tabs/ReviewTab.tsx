"use client";

import React from "react";
import type { TranslationDict } from "../../lib/translations";
import type { ReviewResult } from "../../lib/types";
import { Panel } from "@/components/ui/Panel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Textarea } from "@/components/ui/Field";

interface ReviewTabProps {
  t: TranslationDict;
  revCode: string;
  setRevCode: (s: string) => void;
  revOrcid: string;
  setRevOrcid: (s: string) => void;
  revMath: number;
  setRevMath: (n: number) => void;
  revMethod: number;
  setRevMethod: (n: number) => void;
  revEthics: number;
  setRevEthics: (n: number) => void;
  revNovelty: number;
  setRevNovelty: (n: number) => void;
  revComments: string;
  setRevComments: (s: string) => void;
  handleSubmitReview: () => void;
  reviewResult: ReviewResult | null;
  reviewerReputation: Record<string, unknown> | null;
  claimResult: Record<string, unknown> | null;
  handleClaimAttestation: () => void;
}

interface ReputationShape {
  reviews_submitted?: number;
  mean_composite_score?: number | null;
  accepted_recommendations?: number;
  total_reward_disbursed_usdt?: number;
  claimed_attestations_count?: number;
  reviewer_verified?: boolean;
}

interface ClaimShape {
  status?: string;
  attestation?: { attestation_sha256?: string; review_id?: string };
}

export default function ReviewTab({
  t,
  revCode,
  setRevCode,
  revOrcid,
  setRevOrcid,
  revMath,
  setRevMath,
  revMethod,
  setRevMethod,
  revEthics,
  setRevEthics,
  revNovelty,
  setRevNovelty,
  revComments,
  setRevComments,
  handleSubmitReview,
  reviewResult,
  reviewerReputation,
  claimResult,
  handleClaimAttestation,
}: ReviewTabProps) {
  const rep = reviewerReputation as ReputationShape | null;
  const claim = claimResult as ClaimShape | null;
  const reviewId = (reviewResult as { review_id?: string } | null)?.review_id;
  return (
    <div className="space-y-6">
      <Panel className="p-4 sm:p-7 space-y-6">
        <SectionHeader
          icon="edit_note"
          title={t.revHeader}
          subtitle={t.revSubheader}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <Input
            label={`${t.revTargetLabel} *`}
            value={revCode}
            onChange={(e) => setRevCode(e.target.value)}
            placeholder="GS-2026-00001"
            className="font-mono"
          />
          <Input
            label={`${t.revReviewerLabel} *`}
            value={revOrcid}
            onChange={(e) => setRevOrcid(e.target.value)}
            placeholder="0009-0001-2234-5678"
            className="font-mono"
          />
        </div>

        {/* 4 Scores */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-black/40 border border-[var(--surface-border)]">
            <Input
              label={t.revMathScore}
              type="number"
              min={1}
              max={10}
              value={revMath}
              onChange={(e) => setRevMath(parseInt(e.target.value) || 1)}
              className="font-mono text-[var(--info)]"
            />
          </div>
          <div className="p-3 bg-black/40 border border-[var(--surface-border)]">
            <Input
              label={t.revMethodScore}
              type="number"
              min={1}
              max={10}
              value={revMethod}
              onChange={(e) => setRevMethod(parseInt(e.target.value) || 1)}
              className="font-mono text-[var(--ok)]"
            />
          </div>
          <div className="p-3 bg-black/40 border border-[var(--surface-border)]">
            <Input
              label={t.revEthicsScore}
              type="number"
              min={1}
              max={10}
              value={revEthics}
              onChange={(e) => setRevEthics(parseInt(e.target.value) || 1)}
              className="font-mono text-[var(--info)]"
            />
          </div>
          <div className="p-3 bg-black/40 border border-[var(--surface-border)]">
            <Input
              label={t.revNoveltyScore}
              type="number"
              min={1}
              max={10}
              value={revNovelty}
              onChange={(e) => setRevNovelty(parseInt(e.target.value) || 1)}
              className="font-mono text-[var(--warn)]"
            />
          </div>
        </div>

        <div className="text-xs">
          <Textarea
            label={`${t.revCommentsLabel} *`}
            rows={3}
            value={revComments}
            onChange={(e) => setRevComments(e.target.value)}
          />
        </div>

        <Button
          variant="primary"
          className="w-full font-mono"
          onClick={handleSubmitReview}
        >
          {t.revSubmitBtn}
        </Button>

        {reviewResult && (
          <Panel tone="ok" className="font-mono text-[11px] space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="ok" icon="check_circle">Рецензия бекітілді:</Badge>
            </div>
            <div>Review ID: <span className="text-[var(--info)]">{reviewResult.review_id}</span></div>
            <div>
              Reviewer Payout:{" "}
              <span className="text-[var(--ok)] font-bold">
                {(reviewResult as { reviewer_payout?: string }).reviewer_payout || "$0.00 USDT"}
              </span>
            </div>
            <div>Consensus: <span className="text-[var(--info)]">{(reviewResult as { consensus_status?: string }).consensus_status}</span></div>

            {reviewId && (
              <Button
                variant="secondary"
                className="w-full mt-2 font-mono"
                size="sm"
                onClick={handleClaimAttestation}
              >
                <span className="material-symbols-outlined text-[1.1em]" aria-hidden>verified_user</span>
                Привязать рецензию к профилю (claim attestation)
              </Button>
            )}

            {claim && (
              <Panel tone="info" className="font-mono text-[10px] space-y-1">
                <div>Status: <span className="text-[var(--info)]">{claim.status}</span></div>
                {claim.attestation && (
                  <div className="break-all">
                    Attestation SHA-256:{" "}
                    <span className="text-[var(--ok)]">{claim.attestation.attestation_sha256}</span>
                  </div>
                )}
              </Panel>
            )}
          </Panel>
        )}

        {rep && (
          <Panel tone="info" className="font-mono text-[11px] space-y-1">
            <div className="text-[var(--info)] font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[1.1em]" aria-hidden>science</span>
              Репутация рецензента
              {rep.reviewer_verified && <Badge variant="ok" icon="check_circle">Verified</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span>Reviews: <b className="text-[var(--foreground)]">{rep.reviews_submitted}</b></span>
              <span>Avg grade: <b className="text-[var(--foreground)]">{rep.mean_composite_score ?? "—"}</b></span>
              <span>Accepted: <b className="text-[var(--foreground)]">{rep.accepted_recommendations}</b></span>
              <span>Attestations: <b className="text-[var(--foreground)]">{rep.claimed_attestations_count}</b></span>
            </div>
            <span>
              Заработано: <b className="text-[var(--ok)]">{rep.total_reward_disbursed_usdt} USDT</b>
            </span>
          </Panel>
        )}
      </Panel>
    </div>
  );
}
