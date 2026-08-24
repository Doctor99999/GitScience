"use client";

import React from "react";

interface WelcomeBannerProps {
  t: any;
  setShowOrcidModal: (v: boolean) => void;
  setShowWalletModal: (v: boolean) => void;
}

export default function WelcomeBanner({
  t,
  setShowOrcidModal,
  setShowWalletModal,
}: WelcomeBannerProps) {
  return (
    <section className="w-full bg-black py-24 sm:py-32 flex flex-col items-center justify-center text-center px-4">
      <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-[#f5f5f7] mb-4">
        GitScience Pro.
      </h2>
      <p className="text-xl md:text-2xl font-semibold text-[#f5f5f7] mb-4">
        {t.welcomeBannerTitle || "Наука без посредников."}
      </p>
      <p className="text-lg md:text-xl text-[#86868b] max-w-2xl mx-auto mb-8 font-medium">
        {t.welcomeBannerSub || "Децентрализованный нотариат и исполняемые рукописи. Абсолютная прозрачность. Мгновенные выплаты роялти."}
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <button
          onClick={() => setShowOrcidModal(true)}
          className="apple-btn-primary px-6 py-3 text-sm md:text-base w-full sm:w-auto"
        >
          {t.welcomeRegisterBtn || "Регистрация ORCID"}
        </button>
        <button
          onClick={() => setShowWalletModal(true)}
          className="apple-btn-secondary px-6 py-3 text-sm md:text-base w-full sm:w-auto"
        >
          {t.welcomeWalletBtn || "Подключить кошелек"}
        </button>
      </div>
    </section>
  );
}
