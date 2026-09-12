"use client";

import React, { useState } from "react";
import type { TranslationDict } from "../../lib/translations";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Field";

interface GuideModalProps {
  show: boolean;
  onClose: () => void;
  t: TranslationDict;
}

const PILLARS = [
  { key: "guidePillarCertificate", icon: "verified" },
  { key: "guidePillarLicense", icon: "receipt_long" },
  { key: "guidePillarPatent", icon: "shield" },
  { key: "guidePillarCopyright", icon: "copyright" },
] as const;

export default function GuideModal({ show, onClose, t }: GuideModalProps) {
  const [guideSearch, setGuideSearch] = useState("");

  if (!show) return null;

  return (
    <Modal onClose={onClose} className="max-w-2xl">
      <div className="space-y-4">
        <div>
          <div className="sci-label flex items-center gap-1.5 text-[var(--sci-red)]">
            <span className="material-symbols-outlined !text-base" aria-hidden>support_agent</span>
            <span>GUIDE // QUICKSTART</span>
          </div>
          <h3 className="mt-1 font-display text-xl sm:text-2xl font-bold uppercase tracking-tight text-[var(--foreground)]">
            {t.guideTitle}
          </h3>
          <p className="mt-0.5 text-xs text-[var(--text-mid)]">{t.guideSub}</p>
        </div>

        <Input
          type="text"
          value={guideSearch}
          onChange={(e) => setGuideSearch(e.target.value)}
          placeholder={t.guideSearchPlaceholder}
          icon="search"
        />

        <div className="space-y-4 pr-1 text-xs">
          <div className="border border-[var(--surface-border)] bg-black/30 p-4 space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-tight text-[var(--foreground)] flex items-center gap-2">
              <span className="material-symbols-outlined !text-[18px] text-[var(--sci-red)]" aria-hidden>gavel</span>
              {t.guidePillarTitle}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
              {PILLARS.map((pillar) => (
                <div key={pillar.key} className="border border-[var(--surface-border)] bg-black/40 p-2.5">
                  <strong className="flex items-center gap-1.5 text-[var(--foreground)]">
                    <span className="material-symbols-outlined !text-sm text-[var(--sci-red)]" aria-hidden>
                      {pillar.icon}
                    </span>
                    {t[pillar.key]}
                  </strong>
                  <span className="mt-1 block text-[var(--text-low)]">{t[`${pillar.key}Desc`]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {(
              [
                { titleKey: "guideStep1Title", bodyKey: "guideStep1Body" },
                { titleKey: "guideStep2Title", bodyKey: "guideStep2Body" },
                { titleKey: "guideStep3Title", bodyKey: "guideStep3Body" },
              ] as const
            ).map((step) => (
              <div key={step.titleKey} className="border border-[var(--surface-border)] bg-black/40 p-3.5 space-y-1">
                <strong className="flex items-center gap-1.5 text-xs text-[var(--foreground)]">
                  <span className="material-symbols-outlined !text-sm text-[var(--sci-red)]" aria-hidden>
                    chevron_right
                  </span>
                  {t[step.titleKey]}
                </strong>
                <p className="text-[var(--text-mid)]">{t[step.bodyKey]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}