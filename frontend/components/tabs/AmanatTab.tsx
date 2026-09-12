"use client";

import React from "react";
import type { TranslationDict } from "../../lib/translations";
import type { FiatInvoiceResult } from "../../lib/types";
import { Panel } from "@/components/ui/Panel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

interface AmanatTabProps {
  t: TranslationDict;
  baseLicenseFee: number;
  setBaseLicenseFee: (n: number) => void;
  hospitalName: string;
  setHospitalName: (s: string) => void;
  taxBin: string;
  setTaxBin: (s: string) => void;
  handleGenerateFiatInvoice: () => void;
  fiatLoading: boolean;
  fiatInvoiceResult: FiatInvoiceResult | null;
}

export default function AmanatTab({
  t,
  baseLicenseFee,
  setBaseLicenseFee,
  hospitalName,
  setHospitalName,
  taxBin,
  setTaxBin,
  handleGenerateFiatInvoice,
  fiatLoading,
  fiatInvoiceResult,
}: AmanatTabProps) {
  const authorPool = baseLicenseFee * 0.55;
  const infraPool = baseLicenseFee * 0.15;
  const founderPool = baseLicenseFee * 0.30;
  const grossUpTax = baseLicenseFee * 0.20;
  const totalB2bBill = baseLicenseFee + grossUpTax;

  return (
    <div className="space-y-6">
      <Panel className="space-y-6 p-4 sm:p-7">
        <SectionHeader
          icon="credit_card"
          title={
            <h2 className="font-display text-lg font-extrabold uppercase tracking-tight text-[var(--foreground)]">
              {t.amanatHeader}
            </h2>
          }
          subtitle={<p>{t.amanatSubheader}</p>}
        />

        {/* Breakdown Visualizer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <Panel className="space-y-1 p-4">
            <span className="text-[var(--text-mid)] block text-[11px]">{t.amanatAuthorPool}</span>
            <strong className="text-2xl font-bold text-[var(--ok)]">${authorPool.toLocaleString()}</strong>
            <p className="text-[10px] text-[var(--text-low)]">14 CRediT CASRAI рөлдері бойынша бөлінеді</p>
          </Panel>

          <Panel className="space-y-1 p-4">
            <span className="text-[var(--text-mid)] block text-[11px]">{t.amanatInfraPool}</span>
            <strong className="text-2xl font-bold text-[var(--info)]">${infraPool.toLocaleString()}</strong>
            <p className="text-[10px] text-[var(--text-low)]">Тәуелсіз рецензенттер мен валидаторлар қоры</p>
          </Panel>

          <Panel className="space-y-1 p-4">
            <span className="text-[var(--text-mid)] block text-[11px]">{t.amanatFounderPool}</span>
            <strong className="text-2xl font-bold text-[var(--sci-red)]">${founderPool.toLocaleString()}</strong>
            <p className="text-[10px] text-[var(--text-low)]">Протокол Создатель пулы (Salauat Yeshimov)</p>
          </Panel>
        </div>

        {/* B2B Invoicing Form */}
        <Panel className="space-y-4 p-5 text-xs bg-black/40">
          <h3 className="font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
            <span className="material-symbols-outlined text-[1.1em]" aria-hidden>
              description
            </span>{" "}
            Институционалдық B2B Фиат Инвойс жасау (Клиникалар мен Госпитальдар үшін)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Input
                label="Клиниканың ресми атауы"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
              />
            </div>
            <div>
              <Input
                label="БИН / Салық төлеуші коды"
                value={taxBin}
                onChange={(e) => setTaxBin(e.target.value)}
                className="font-mono text-[var(--info)]"
              />
            </div>
            <div>
              <Input
                label={`${t.amanatBaseFee} (USD)`}
                type="number"
                min={100}
                value={baseLicenseFee}
                onChange={(e) => setBaseLicenseFee(parseFloat(e.target.value) || 1000)}
                className="font-mono text-[var(--ok)]"
              />
            </div>
          </div>

          <Panel className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-4 text-xs font-mono bg-black/40">
            <div>
              <span className="text-[var(--text-mid)] block">{t.amanatInvoiceTotal}</span>
              <span className="text-[11px] text-[var(--text-low)]">Базалық сома (${baseLicenseFee}) + 20% B2B Gross-Up (${grossUpTax})</span>
            </div>
            <strong className="text-2xl sm:text-3xl font-bold text-[var(--warn)]">${totalB2bBill.toLocaleString()} USD</strong>
          </Panel>

          <Button
            variant="primary"
            size="md"
            onClick={handleGenerateFiatInvoice}
            disabled={fiatLoading}
            loading={fiatLoading}
            className="w-full py-3"
            icon={
              <span className="material-symbols-outlined text-[1.1em]" aria-hidden>
                description
              </span>
            }
          >
            {fiatLoading ? "Инвойс жасалуда..." : t.genFiatInvoiceBtn}
          </Button>

          {fiatInvoiceResult && (
            <Panel tone="ok" className="p-4 font-mono text-[11px] space-y-1">
              <div className="font-bold text-[var(--ok)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[1.1em]" aria-hidden>
                  check_circle
                </span>{" "}
                B2B Инвойс ресми шығарылды:
              </div>
              <div>Invoice №: <strong className="text-[var(--info)]">{fiatInvoiceResult.invoice_id}</strong></div>
              <div>Hospital: <span className="text-[var(--foreground)]">{fiatInvoiceResult.hospital_name}</span></div>
              <div>Gross Total: <strong className="font-bold text-[var(--warn)]">${fiatInvoiceResult.total_gross_invoice_fiat} USD</strong></div>
            </Panel>
          )}
        </Panel>
      </Panel>
    </div>
  );
}