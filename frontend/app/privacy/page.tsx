"use client";

import React from "react";
import StaticPageShell, {
  useStaticLang,
  type StaticLang,
} from "../../components/StaticPageShell";
import { Panel } from "../../components/ui/Panel";
import { SectionHeader } from "../../components/ui/SectionHeader";

interface PrivacySection {
  icon: string;
  title: string;
  body: string;
}

interface PrivacyContent {
  title: string;
  subtitle: string;
  sections: PrivacySection[];
}

const CONTENT: Record<StaticLang, PrivacyContent> = {
  KZ: {
    title: "GitScience™ Құпиялылық және деректер басқаруы",
    subtitle: "ISO 14721 OAIS, GDPR 89-бабы (ғылыми зерттеулер) және HIPAA деидентификациясына сәйкестік",
    sections: [
      {
        icon: "lock",
        title: "1. Zero-Knowledge дәлелдер және құпиялылық",
        body: "GitScience зерттеушілерге формулаларды немесе жабық гипотеза мәтіндерін ашпай-ақ, арнайы құлпын ашпайынша, слепой SHA-256 міндеттемелері арқылы жариялау алдындағы жаңалықтарды депозиттеуге мүмкіндік береді.",
      },
      {
        icon: "badge",
        title: "2. ORCID және ғалым идентификаторлары",
        body: "ORCID iD, институционалдық тиесіліктер және жарияланым метадеректері тек өзгермейтін ғылыми басымдық орнату және заңды роялти бөлінісі үшін индекстеледі. Біз зерттеушілердің жеке телеметриясын сатпаймыз және монетизацияламаймыз.",
      },
      {
        icon: "health_and_safety",
        title: "3. Зерттелушілер және биоэтика талаптары",
        body: "Пациенттердің клиникалық деректері бар кез келген қолжазба ВМА Хельсинки декларациясына сәйкес этикалық мақұлдауды (IRB/LEK коды) көрсетуге міндетті. Науқасты анықтайтын деректер ашық депозитарлық жүктемелерге қатаң тыйым салынған.",
      },
    ],
  },
  RU: {
    title: "Политика конфиденциальности GitScience™ и управление данными",
    subtitle: "Соответствует ISO 14721 OAIS, статье 89 GDPR (научные исследования) и деидентификации HIPAA",
    sections: [
      {
        icon: "lock",
        title: "1. Zero-Knowledge доказательства и конфиденциальность",
        body: "GitScience позволяет исследователям депонировать до-публикационные открытия через слепые SHA-256 обязательства, не раскрывая формулы или закрытые тексты гипотез до явной разблокировки.",
      },
      {
        icon: "badge",
        title: "2. ORCID и идентификаторы учёных",
        body: "ORCID iD, институциональная принадлежность и метаданные публикаций индексируются исключительно для установления неизменного научного приоритета и легитимного распределения роялти. Мы не продаём и не монетизируем персональную телеметрию исследователей.",
      },
      {
        icon: "health_and_safety",
        title: "3. Испытуемые и соблюдение норм биоэтики",
        body: "Любая рукопись с клиническими данными пациентов должна содержать одобрение этического комитета (код IRB/LEK) в соответствии с Хельсинкской декларацией ВМА. Данные, позволяющие идентифицировать пациента, строго запрещены в публичных депозитарных загрузках.",
      },
    ],
  },
  EN: {
    title: "GitScience™ Privacy & Data Governance",
    subtitle: "Compliant with ISO 14721 OAIS, GDPR Article 89 (Scientific Research), and HIPAA De-Identification",
    sections: [
      {
        icon: "lock",
        title: "1. Zero-Knowledge Proofs & Confidentiality",
        body: "GitScience allows researchers to deposit pre-publication discoveries via blind SHA-256 commitments without revealing underlying formulas or proprietary hypothesis texts until explicitly unlocked.",
      },
      {
        icon: "badge",
        title: "2. ORCID & Scholar Identifiers",
        body: "ORCID iDs, institutional affiliations, and publication metadata are indexed solely to establish immutable scientific priority and legitimate royalty distribution. We do not sell or monetize personal researcher telemetry.",
      },
      {
        icon: "health_and_safety",
        title: "3. Human Subjects & Bioethics Compliance",
        body: "Any manuscript involving patient clinical data must declare ethical approval (IRB/LEK approval code) in compliance with the WMA Declaration of Helsinki. Patient identifiable data is strictly forbidden from public depository payloads.",
      },
    ],
  },
};

export default function PrivacyPolicyPage() {
  const [lang, setLang] = useStaticLang();
  const c = CONTENT[lang];

  return (
    <StaticPageShell lang={lang} setLang={setLang} title={c.title} subtitle={c.subtitle}>
      <Panel className="p-5 sm:p-7">
        <SectionHeader
          icon="shield"
          kicker="PRIVACY // GOVERNANCE"
          title={<span className="text-[var(--sci-red)]">Data Governance</span>}
        />
        <div className="mt-5 space-y-6">
          {c.sections.map((s) => (
            <div key={s.title} className="border border-[var(--surface-border)] bg-black/40 p-4">
              <strong className="mb-1.5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-[var(--sci-red)]">
                <span className="material-symbols-outlined !text-sm" aria-hidden>
                  {s.icon}
                </span>
                {s.title}
              </strong>
              <p className="text-[13px] leading-relaxed text-[var(--text-mid)]">{s.body}</p>
            </div>
          ))}
        </div>
      </Panel>
    </StaticPageShell>
  );
}