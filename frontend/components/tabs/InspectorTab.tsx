"use client";

import React from "react";
import type { TranslationDict } from "../../lib/translations";
import type { InspectedDoc, IpNftResult } from "../../lib/types";
import { Panel } from "@/components/ui/Panel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Field";

interface InspectorTabProps {
  t: TranslationDict;
  searchInspectCode: string;
  setSearchInspectCode: (s: string) => void;
  handleInspect: (code: string) => void;
  inspectedDoc: InspectedDoc | null;
  handleViewLicense: (code: string) => void;
  handleMintIpNft: (code: string) => void;
  ipNftMinting: boolean;
  ipNftResult: IpNftResult | null;
  apiBase: string;
}

export default function InspectorTab({
  t,
  searchInspectCode,
  setSearchInspectCode,
  handleInspect,
  inspectedDoc,
  handleViewLicense,
  handleMintIpNft,
  ipNftMinting,
  ipNftResult,
  apiBase,
}: InspectorTabProps) {
  return (
    <div className="space-y-6">
      <Panel className="space-y-5 p-4 sm:p-7">
        <SectionHeader
          icon="search"
          kicker="INSPECTOR"
          title={
            <h2 className="font-display text-lg font-extrabold uppercase tracking-tight text-[var(--foreground)]">
              {t.inspectHeader}
            </h2>
          }
          subtitle={<p>{t.inspectSubheader}</p>}
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Input
              icon="search"
              value={searchInspectCode}
              onChange={(e) => setSearchInspectCode(e.target.value)}
              placeholder={t.inspectSearchPlaceholder}
              className="font-mono"
            />
          </div>
          <Button
            variant="primary"
            onClick={() => handleInspect(searchInspectCode)}
            className="w-full justify-center sm:w-auto"
            icon={
              <span className="material-symbols-outlined text-[1.1em]" aria-hidden>
                search
              </span>
            }
          >
            {t.inspectSearchBtn}
          </Button>
        </div>

        {inspectedDoc && (
          <div className="space-y-4 pt-2">
            <Panel className="space-y-2 p-4">
              <Badge variant="ok">{inspectedDoc.registration_code}</Badge>
              <h3 className="text-base font-bold text-[var(--foreground)] sm:text-lg">{inspectedDoc.title}</h3>
              <p className="text-xs text-[var(--text-mid)]">
                Автор: <strong className="text-[var(--foreground)]">{inspectedDoc.author_name}</strong> (ORCID:{" "}
                {inspectedDoc.orcid})
              </p>
            </Panel>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Layer 1 */}
              <Panel className="min-w-0 space-y-2 p-4 font-mono text-xs">
                <strong className="block text-xs font-bold text-[var(--ok)]">{t.layer1Title}</strong>
                <div className="space-y-1 text-[11px] text-[var(--text-mid)]">
                  <div>
                    WIPO IPC: <span className="text-[var(--foreground)]">{inspectedDoc.ipc_class}</span>
                  </div>
                  <div>
                    Лицензия: <span className="text-[var(--foreground)]">{inspectedDoc.license_type}</span>
                  </div>
                  <div>
                    Закон: <span className="text-[var(--foreground)]">35 U.S.C. § 102(a)(1)</span>
                  </div>
                </div>
              </Panel>

              {/* Layer 2 */}
              <Panel className="min-w-0 space-y-2 p-4 font-mono text-xs">
                <strong className="block text-xs font-bold text-[var(--info)]">{t.layer2Title}</strong>
                <div className="space-y-1 text-[11px] text-[var(--text-mid)]">
                  <div className="break-all">
                    SHA-256: <span className="break-all text-[var(--foreground)]">{inspectedDoc.sha256_hash}</span>
                  </div>
                  <div className="break-all">
                    Git OID: <span className="break-all text-[var(--foreground)]">{inspectedDoc.git_commit_hash}</span>
                  </div>
                  <div>
                    Anchor: <span className="text-[var(--ok)]">Bitcoin OTS Anchored</span>
                  </div>
                </div>
              </Panel>

              {/* Layer 3 */}
              <Panel className="min-w-0 space-y-2 p-4 font-mono text-xs">
                <strong className="block text-xs font-bold text-[var(--sci-red)]">{t.layer3Title}</strong>
                <div className="space-y-1 text-[11px] text-[var(--text-mid)]">
                  <div className="break-all">
                    Формула: <span className="break-all text-[var(--info)]">{inspectedDoc.formula_math}</span>
                  </div>
                  <div className="break-all">
                    AST Merkle: <span className="break-all text-[var(--foreground)]">{inspectedDoc.ast_merkle_digest}</span>
                  </div>
                  <div>
                    Режим: <span className="text-[var(--warn)]">RUO Class I CDSS</span>
                  </div>
                </div>
              </Panel>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => handleViewLicense(inspectedDoc.registration_code)}
                icon={
                  <span className="material-symbols-outlined text-[1.1em]" aria-hidden>
                    download
                  </span>
                }
              >
                {t.downloadLicenseBtn}
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleMintIpNft(inspectedDoc.registration_code)}
                disabled={ipNftMinting}
                loading={ipNftMinting}
                icon={
                  <span className="material-symbols-outlined text-[1.1em]" aria-hidden>
                    biotech
                  </span>
                }
              >
                {ipNftMinting ? "Токенизация..." : t.mintIpNftBtn}
              </Button>
              <a
                href={`${apiBase}/certificate/pdf/${inspectedDoc.registration_code}`}
                target="_blank"
                rel="noreferrer"
                className="sci-btn-primary inline-block px-4 py-2 text-xs"
              >
                {t.downloadCertPdfBtn}
              </a>
            </div>

            {ipNftResult && (
              <Panel tone="info" className="space-y-1 p-4 font-mono text-xs">
                <div className="flex items-center gap-2 font-bold text-[var(--info)]">
                  <span className="material-symbols-outlined text-[1.1em]" aria-hidden>
                    biotech
                  </span>
                  Sovereign IP-NFT Патент токенизирован:
                </div>
                <div>
                  Standard: <span className="text-[var(--foreground)]">{ipNftResult.contract_standard}</span>
                </div>
                <div>
                  Royalty to Founder:{" "}
                  <span className="font-bold text-[var(--ok)]">{ipNftResult.founder_royalty_pct}</span>
                </div>
              </Panel>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}