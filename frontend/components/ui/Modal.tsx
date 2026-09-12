"use client";

import type { ReactNode, MouseEvent } from "react";

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function Modal({ onClose, children, className }: ModalProps) {
  const handleBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={handleBackdrop}
    >
      <div
        className={`relative flex w-full max-h-[85vh] flex-col overflow-hidden border border-[var(--surface-border)] bg-[var(--surface-hi)] p-5 sm:p-7 ${className ?? "max-w-lg"}`}
      >
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-[var(--sci-red)]/50 via-white/10 to-transparent"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute right-0 top-0 h-12 w-12 bg-gradient-to-bl from-white/[0.05] to-transparent"
          aria-hidden
        />
        <button
          onClick={onClose}
          aria-label="Close"
          className="sci-focus absolute right-4 top-4 z-10 p-1 text-[var(--text-low)] transition-colors hover:text-[var(--foreground)]"
        >
          <span className="material-symbols-outlined !text-lg" aria-hidden>
            close
          </span>
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}