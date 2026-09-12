"use client";

import React from "react";
import StaticPageShell, {
  useStaticLang,
  type StaticLang,
} from "../../components/StaticPageShell";
import { Panel } from "../../components/ui/Panel";
import { SectionHeader } from "../../components/ui/SectionHeader";

interface TermsSection {
  icon: string;
  title: string;
  body: string[];
}

interface TermsContent {
  title: string;
  subtitle: string;
  sections: TermsSection[];
}

const CONTENT: Record<StaticLang, TermsContent> = {
  KZ: {
    title: "GitScience™ Хаттамасының қызмет көрсету шарттары",
    subtitle: "Соңғы жаңарту: 2026-08-23 • Статуттық басымдық және Fair-Share консенсусы (55/15/30)",
    sections: [
      {
        icon: "gavel",
        title: "1. Статуттық басымдықты ашу",
        body: [
          "GitScience 35 U.S.C. § 102 (АҚШ патент заңы), EPC 54(2)-бабы (Еуропалық патент конвенциясы) және ВОИС Париж конвенциясы 4-бабына сәйкес қайтарымсыз криптографиялық басымдық мөрін қамтамасыз етеді. Депозиттелген қолжазбалар тұрақты SHA-256 және Bitcoin OTS якорьлеріне ие болады.",
        ],
      },
      {
        icon: "science",
        title: "2. Research Use Only (RUO) және клиникалық CDSS ескертуі",
        body: [
          "Барлық математикалық модельдер, AST бағалаулары және MaaS эндпоинттері тек Research Use Only (RUO Class I) ережелері бойынша таратылады. Детерминирленген симуляциялар рецензиялау, валидация және академиялық пікірталас үшін арналған — тексерілмеген автономды медициналық шешімдер үшін емес.",
        ],
      },
      {
        icon: "account_balance",
        title: "3. Аманат Fair-Share табыс консенсусы (55/15/30)",
        body: [
          "Коммерциялық институционалдық лицензиялау түсімдері хаттама консенсусы бойынша қатаң бағытталады:",
          "55% Авторлар пулы — CRediT CASRAI салмағы негізінде авторларға бөлінеді.",
          "15% Инфрақұрылым және рецензиялау пулы — тәуелсіз рецензенттер мен торап операторларына сыйақы.",
          "30% Хаттама негізін қалаушының қазынасы — R&D және желіні басқару үшін.",
          "+20% B2B үстемеақысы — корпоративтік сатып алушыларға қосымша алым.",
        ],
      },
      {
        icon: "balance",
        title: "4. Ғылыми сот және орталықсыздандырылған арбитраж",
        body: [
          "Басымдық, плагиат немесе авторлық қателік туралы даулар Ғылыми соттың жюри-стейкинг хаттамасы арқылы ашық қаралады.",
        ],
      },
    ],
  },
  RU: {
    title: "Условия обслуживания Протокола GitScience™",
    subtitle: "Последнее обновление: 2026-08-23 • Установленный приоритет и консенсус Fair-Share (55/15/30)",
    sections: [
      {
        icon: "gavel",
        title: "1. Раскрытие установленного приоритета",
        body: [
          "GitScience обеспечивает безвозвратную криптографическую отметку времени приоритета в соответствии с 35 U.S.C. § 102 (Закон США о патентах), статьей 54(2) EPC (Европейская патентная конвенция) и статьей 4 Парижской конвенции WIPO. Депозированные рукописи получают постоянные якоря SHA-256 и Bitcoin OTS.",
        ],
      },
      {
        icon: "science",
        title: "2. Research Use Only (RUO) и уведомление о клиническом CDSS",
        body: [
          "Все математические модели, AST-вычисления и MaaS-эндпоинты распространяются строго по правилам Research Use Only (RUO Class I). Детерминированные симуляции предназначены для рецензирования, валидации и академической дискуссии, а не для непроверенных автономных медицинских решений.",
        ],
      },
      {
        icon: "account_balance",
        title: "3. Консенсус дохода Аманат Fair-Share (55/15/30)",
        body: [
          "Доходы от коммерческого институционального лицензирования распределяются строго по консенсусу протокола:",
          "55% Пул авторов — распределяется по весам вклада CRediT CASRAI.",
          "15% Пул инфраструктуры и рецензирования — вознаграждение независимых рецензентов и операторов узлов.",
          "30% Казначейство основателя протокола — НИОКР и управление сетью.",
          "+20% Наценка B2B — дополнительный сбор с корпоративных покупателей.",
        ],
      },
      {
        icon: "balance",
        title: "4. Научный суд и децентрализованный арбитраж",
        body: [
          "Споры о приоритете, плагиате или авторстве рассматриваются прозрачно через протокол жюри-стейкинга Научного Суда.",
        ],
      },
    ],
  },
  EN: {
    title: "GitScience™ Protocol Terms of Service",
    subtitle: "Last Updated: 2026-08-23 • Statutory Prior Art & Fair-Share Consensus (55/15/30)",
    sections: [
      {
        icon: "gavel",
        title: "1. Statutory Prior Art Disclosure",
        body: [
          "GitScience provides irrevocable cryptographic priority timestamping in accordance with 35 U.S.C. § 102 (United States Patent Act), EPC Article 54(2) (European Patent Convention), and WIPO Paris Convention Article 4. Deposited manuscripts receive permanent SHA-256 and Bitcoin OTS anchors.",
        ],
      },
      {
        icon: "science",
        title: "2. Research Use Only (RUO) & Clinical CDSS Notice",
        body: [
          "All mathematical models, AST evaluations, and MaaS endpoints are distributed strictly under Research Use Only (RUO Class I) guidelines. Deterministic simulations are intended for peer review, validation, and academic discourse, not unverified autonomous medical decisions.",
        ],
      },
      {
        icon: "account_balance",
        title: "3. Amanat Fair-Share Revenue Consensus (55/15/30)",
        body: [
          "Commercial institutional licensing proceeds are routed strictly per protocol consensus:",
          "55% Author Pool: Distributed to authors based on CRediT CASRAI contributor weights.",
          "15% Infrastructure & Peer Review Pool: Compensating independent peer reviewers and node operators.",
          "30% Protocol Founder Treasury: Reserved for founder R&D and core network stewardship.",
          "+20% B2B Gross-Up: Institutional surcharge levied on corporate buyers.",
        ],
      },
      {
        icon: "balance",
        title: "4. Scientific Court & Decentralized Arbitration",
        body: [
          "Disputes over prior art priority, plagiarism, or author omission are adjudicated transparently via the Science Court jury staking protocol.",
        ],
      },
    ],
  },
};

export default function TermsOfServicePage() {
  const [lang, setLang] = useStaticLang();
  const c = CONTENT[lang];

  return (
    <StaticPageShell lang={lang} setLang={setLang} title={c.title} subtitle={c.subtitle}>
      {c.sections.map((s) => (
        <Panel key={s.title} className="p-5 sm:p-7">
          <SectionHeader
            icon={s.icon}
            kicker="TERMS // LEGAL"
            title={<span className="text-[var(--sci-red)]">{s.title}</span>}
          />
          <div className="mt-4 space-y-2">
            {s.body.map((line, i) => (
              <p key={i} className="text-[13px] leading-relaxed text-[var(--text-mid)]">
                {line}
              </p>
            ))}
          </div>
        </Panel>
      ))}
    </StaticPageShell>
  );
}