"use client";

import React, { useState } from "react";

interface GuideModalProps {
  show: boolean;
  onClose: () => void;
}

export default function GuideModal({ show, onClose }: GuideModalProps) {
  const [guideSearch, setGuideSearch] = useState("");

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0e1726] border border-purple-500/40 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col p-5 sm:p-7 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
              <span>💡</span> GitScience™ Интерактивті Көмекшісі
            </h3>
            <p className="text-xs text-purple-300 mt-0.5">
              Платформаның барлық модульдері бойынша жылдам нұсқаулық және 4 негізгі құқықтық құрал
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 text-lg font-bold p-1"
          >
            ✕
          </button>
        </div>

        <input
          type="text"
          value={guideSearch}
          onChange={(e) => setGuideSearch(e.target.value)}
          placeholder="Сұрағыңызды жазыңыз (мысалы: сертификат, роялти, формула, патент)..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:border-purple-500 outline-none"
        />

        <div className="overflow-y-auto space-y-4 pr-1 text-xs">
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-emerald-400 text-sm">🏛️ GitScience™ 4 халықаралық құқықтық бағанасы:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <strong className="text-cyan-300 block">1. 📜 Сертификат (WIPO)</strong>
                <span>Париж Конвенциясының 4-бабы және 35 U.S.C. § 102 бойынша басымдық қорғанысы.</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <strong className="text-emerald-300 block">2. ⚖️ Лицензия (B2B MaaS)</strong>
                <span>Creative Commons және клиникалар үшін 55/15/30 формуласымен лицензиялау.</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <strong className="text-purple-300 block">3. 🛡️ Патент (IP-NFT)</strong>
                <span>EIP-2981 стандартындағы токенизация және патенттік тролльдерден қорғау.</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <strong className="text-amber-300 block">4. 🧬 Авторлық құқық (CRediT)</strong>
                <span>14 CASRAI рөлдері және ORCID арқылы негізделген адал үлес бөлінісі.</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
              <strong className="text-slate-200 block text-xs">🔹 1-қадам: Манускриптті қалай бекітемін?</strong>
              <p className="text-slate-400">
                «Нотариат» қойындысына өтіп, PDF жүктеңіз, математикалық формуланы енгізіп, «Тізілімге бекіту» батырмасын басыңыз. Жүйе автоматты түрде ресми PDF Сертификат шығарады.
              </p>
            </div>
            <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
              <strong className="text-slate-200 block text-xs">🔹 2-қадам: Исполняемая Safe AST формула деген не?</strong>
              <p className="text-slate-400">
                Бұл медициналық/онкологиялық гомеостазды тікелей есептейтін қауіпсіз математика. Бөгде шабуылдардан қорғалған және браузерде 1 миллисекундта есептеледі.
              </p>
            </div>
            <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
              <strong className="text-slate-200 block text-xs">🔹 3-қадам: 55 / 15 / 30 роялти қалай бөлінеді?</strong>
              <p className="text-slate-400">
                Клиника төлеген сомадан: 55% тікелей авторларға (CRediT үлесімен), 15% рецензенттер мен инфрақұрылымға, 30% протоколдың Создателіне таза түседі (+20% B2B салықты клиника үстінен төлейді).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
