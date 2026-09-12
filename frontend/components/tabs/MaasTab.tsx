"use client";

import React from "react";
import type { TranslationDict } from "../../lib/translations";
import { Panel } from "@/components/ui/Panel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Field";

interface MaasTabProps {
  t: TranslationDict;
  maasFormula: string;
  setMaasFormula: (s: string) => void;
  handleRunMaasSimulation: () => void;
  maasLoading: boolean;
  maasResult: unknown;
  handleClinicalFhirTest: () => void;
  fhirLoading: boolean;
  fhirResult: unknown;
}

export default function MaasTab({
  t,
  maasFormula,
  setMaasFormula,
  handleRunMaasSimulation,
  maasLoading,
  maasResult,
  handleClinicalFhirTest,
  fhirLoading,
  fhirResult,
}: MaasTabProps) {
  return (
    <div className="space-y-6">
      <Panel className="space-y-6 p-4 sm:p-7">
        <SectionHeader
          icon="bolt"
          title={
            <h2 className="font-display text-lg font-extrabold uppercase tracking-tight text-[var(--foreground)]">
              {t.maasHeader}
            </h2>
          }
          subtitle={<p>{t.maasSubheader}</p>}
        />

        <div className="space-y-3 text-xs">
          <Input
            label={t.maasFormulaLabel}
            icon="calculate"
            placeholder="AST"
            value={maasFormula}
            onChange={(e) => setMaasFormula(e.target.value)}
            className="flex-1 font-mono text-[var(--info)]"
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="primary"
              onClick={handleRunMaasSimulation}
              disabled={maasLoading}
              loading={maasLoading}
              icon={
                <span className="material-symbols-outlined text-[1.1em]" aria-hidden>
                  bolt
                </span>
              }
            >
              {maasLoading ? "Есептелуде..." : t.maasRunBtn}
            </Button>
            <Button
              variant="secondary"
              onClick={handleClinicalFhirTest}
              disabled={fhirLoading}
              loading={fhirLoading}
              icon={
                <span className="material-symbols-outlined text-[1.1em]" aria-hidden>
                  policy
                </span>
              }
            >
              {fhirLoading ? "FHIR..." : t.fhirGatewayBtn}
            </Button>
          </div>
        </div>

        {/* 2D Interactive Response Visualizer */}
        <Panel className="space-y-3 p-5 bg-black/40">
          <div className="flex justify-between items-center text-xs">
            <strong className="text-[var(--info)] font-mono flex items-center gap-2">
              <span className="material-symbols-outlined text-[1.1em]" aria-hidden>
                analytics
              </span>{" "}
              {t.maasVisualCurveTitle}
            </strong>
            <Badge variant="info">Deterministic WASM Runtime</Badge>
          </div>

          <div className="h-40 sm:h-48 w-full bg-black/40 border border-[var(--surface-border)] flex items-end justify-between p-4 gap-1 sm:gap-2">
            {[24, 38, 52, 68, 85, 96, 110, 125, 142, 160].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div
                  style={{ height: `${(h / 160) * 100}%` }}
                  className="w-full bg-gradient-to-t from-[var(--ok)] to-[var(--info)] opacity-80 group-hover:opacity-100 transition shadow"
                />
                <span className="text-[9px] font-mono text-[var(--text-low)]">t{i + 1}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* FHIR Result */}
        {fhirResult != null && (
          <Panel className="space-y-2 p-4 font-mono text-xs">
            <div className="text-[var(--info)] font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[1.1em]" aria-hidden>
                local_hospital
              </span>{" "}
              HL7 / FHIR R4 Bundle Observation:
            </div>
            <pre className="bg-black/40 p-3 overflow-x-auto text-[11px] text-[var(--text-mid)]">
              {JSON.stringify(fhirResult, null, 2)}
            </pre>
          </Panel>
        )}

        {/* WASM Result */}
        {maasResult != null && (
          <Panel tone="ok" className="space-y-2 p-4 font-mono text-xs">
            <div className="text-[var(--ok)] font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[1.1em]" aria-hidden>
                bolt
              </span>{" "}
              WASM Stream Output:
            </div>
            <pre className="bg-black/40 p-3 overflow-x-auto text-[11px] text-[var(--text-mid)]">
              {JSON.stringify(maasResult, null, 2)}
            </pre>
          </Panel>
        )}
      </Panel>
    </div>
  );
}