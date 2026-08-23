"use client";

import React from "react";

interface LicenseModalProps {
  content: string | null;
  onClose: () => void;
}

export default function LicenseModal({ content, onClose }: LicenseModalProps) {
  if (!content) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0e1726] border border-slate-700 rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col p-5 sm:p-7 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>📄</span> GitScience™ Official License Agreement
            </h3>
            <p className="text-xs text-slate-400">35 U.S.C. § 102 • WIPO Paris Convention • RUO Class I CDSS</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 text-lg font-bold p-1"
          >
            ✕
          </button>
        </div>

        <pre className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed">
          {content}
        </pre>
      </div>
    </div>
  );
}
