"use client";

import React from "react";
import { Modal } from "../ui/Modal";

interface LicenseModalProps {
  content: string | null;
  onClose: () => void;
}

export default function LicenseModal({ content, onClose }: LicenseModalProps) {
  if (!content) return null;

  return (
    <Modal onClose={onClose} className="max-w-3xl">
      <div>
        <div className="sci-label flex items-center gap-1.5 text-[var(--sci-red)]">
          <span className="material-symbols-outlined !text-base" aria-hidden>contract</span>
          <span>LEGAL // LICENSE AGREEMENT</span>
        </div>
        <h3 className="mt-1 font-display text-lg sm:text-xl font-bold uppercase tracking-tight text-[var(--foreground)]">
          GitScience™ Official License Agreement
        </h3>
        <p className="mt-0.5 text-xs text-[var(--text-mid)]">35 U.S.C. § 102 • WIPO Paris Convention • RUO Class I CDSS</p>

        <pre className="mt-4 border border-[var(--surface-border)] bg-black/40 p-4 font-mono text-[11px] text-[var(--text-mid)] whitespace-pre-wrap leading-relaxed">
          {content}
        </pre>
      </div>
    </Modal>
  );
}