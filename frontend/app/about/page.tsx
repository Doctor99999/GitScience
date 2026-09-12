"use client";

import React from "react";
import StaticPageShell, {
  useStaticLang,
  type StaticLang,
} from "../../components/StaticPageShell";
import { Panel } from "../../components/ui/Panel";
import { SectionHeader } from "../../components/ui/SectionHeader";

interface Pillar {
  no: string;
  title: string;
  desc: string;
}

interface AboutContent {
  title: string;
  subtitle: string;
  pillars: Pillar[];
  section1: { title: string; body: string };
  section2: { title: string; body: string };
}

const CONTENT: Record<StaticLang, AboutContent> = {
  KZ: {
    title: "GitScience™ Егеменді Хаттама туралы",
    subtitle: "Хаттама сәулетшісі және негізін қалаушы: Salauat Abiltayevich Yeshimov (ORCID: 0009-0003-3929-3605)",
    pillars: [
      { no: "01", title: "Сертификат (WIPO Prior Art)", desc: "35 U.S.C. § 102 және Париж конвенциясының 4-бабына сәйкес қайтарымсыз басымдық уақыт мөрі." },
      { no: "02", title: "Лицензия (B2B MaaS)", desc: "Ашық Creative Commons лицензиясы және клиникалық шешімдерді қолдаудың корпоративтік келісімдері." },
      { no: "03", title: "Патент (Егеменді IP-NFT)", desc: "EIP-2981 үйлесімді токенизация — патенттік тролльдерге қарсы қорғаныс қалқаны." },
      { no: "04", title: "Авторлық (CRediT 14 рөл)", desc: "ORCID iD-мен байланыстырылған әділ әрі тексерілетін үлес бөлінісі." },
    ],
    section1: {
      title: "Орындалатын ғылым және қауіпсіз AST",
      body: "Дәстүрлі академиялық басылымдар теңдеулерді қайта есептеу немесе тексеру мүмкін емес статикалық PDF-ке сүйенеді. GitScience оқшауланған Safe AST (қауіпсіз абстрактілі синтаксистік ағаш) бағалауын енгізеді — клиникалық онкология, физиология және биоинформатикада миллисекундтан аз уақыт ішінде тірі математикалық гомеостаздық модельдеуді қамтамасыз етеді.",
    },
    section2: {
      title: "Ғылыми шындық аманатын сақтау",
      body: "Аманат (киелі сенім) қағидасына негізделген протокол әр ғылыми үлеске өшпес кредит, өзгермейтін басымдық және әділ сыйақы кепілдік береді.",
    },
  },
  RU: {
    title: "О Суверенном Протоколе GitScience™",
    subtitle: "Архитектор и основатель протокола: Salauat Abiltayevich Yeshimov (ORCID: 0009-0003-3929-3605)",
    pillars: [
      { no: "01", title: "Сертификат (WIPO Prior Art)", desc: "Безотзывная отметка приоритета согласно 35 U.S.C. § 102 и статье 4 Парижской конвенции WIPO." },
      { no: "02", title: "Лицензия (B2B MaaS)", desc: "Открытая лицензия Creative Commons и корпоративные соглашения поддержки клинических решений." },
      { no: "03", title: "Патент (Суверенный IP-NFT)", desc: "Токенизация, совместимая с EIP-2981, обеспечивающая защитный экран от патентных троллей." },
      { no: "04", title: "Авторство (CRediT 14 ролей)", desc: "Справедливое и проверяемое распределение вклада, привязанное к верифицированным ORCID iD." },
    ],
    section1: {
      title: "Исполняемое исследование и Safe AST",
      body: "Традиционные академические публикации опираются на статические PDF-файлы, где уравнения невозможно пересчитать или проверить. GitScience внедряет изолированную оценку Safe AST (безопасного абстрактного синтаксического дерева), обеспечивающую живое моделирование математической гомеостатики в клинической онкологии, физиологии и биоинформатике менее чем за миллисекунду.",
    },
    section2: {
      title: "Сохранение аманата научной истины",
      body: "Опираясь на древний этический принцип Аманат (священное доверие), протокол гарантирует каждому научному вкладу неугасимый кредит, неизменный приоритет и справедливое вознаграждение.",
    },
  },
  EN: {
    title: "About GitScience™ Sovereign Protocol",
    subtitle: "Protocol Architect & Founder: Salauat Abiltayevich Yeshimov (ORCID: 0009-0003-3929-3605)",
    pillars: [
      { no: "01", title: "Certificate (WIPO Prior Art)", desc: "Irrevocable priority timestamping under 35 U.S.C. § 102 and WIPO Paris Convention Article 4." },
      { no: "02", title: "License (B2B MaaS)", desc: "Open-access Creative Commons along with enterprise clinical decision support agreements." },
      { no: "03", title: "Patent (Sovereign IP-NFT)", desc: "EIP-2981 compatible tokenization providing defensive shielding against patent trolls." },
      { no: "04", title: "Authorship (CRediT 14 Roles)", desc: "Fair and auditable contributor role distribution linked to verified ORCID iDs." },
    ],
    section1: {
      title: "Executable Science & Safe AST",
      body: "Traditional academic publishing relies on static PDFs where equations cannot be recomputed or verified. GitScience introduces isolated Safe Abstract Syntax Tree (Safe AST) evaluation, enabling live mathematical homeostasis modeling across clinical oncology, physiology, and bioinformatics in sub-millisecond execution times.",
    },
    section2: {
      title: "Preserving the Amanat of Scientific Truth",
      body: "Rooted in the ancient ethical principle of Amanat (sacred trust), the protocol guarantees that every scientific contribution receives indelible credit, unalterable priority, and fair compensation.",
    },
  },
};

export default function AboutProtocolPage() {
  const [lang, setLang] = useStaticLang();
  const c = CONTENT[lang];

  return (
    <StaticPageShell lang={lang} setLang={setLang} title={c.title} subtitle={c.subtitle}>
      <Panel className="p-5 sm:p-7">
        <SectionHeader
          icon="account_balance"
          kicker="STATUTE // FOUNDATIONS"
          title={<span className="text-[var(--sci-red)]">4 Statutory Pillars</span>}
        />
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {c.pillars.map((p) => (
            <div key={p.no} className="border border-[var(--surface-border)] bg-black/40 p-4">
              <strong className="mb-1 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-[var(--sci-red)]">
                <span className="material-symbols-outlined !text-sm" aria-hidden>
                  {p.no === "01" ? "verified_user" : p.no === "02" ? "handshake" : p.no === "03" ? "shield" : "groups"}
                </span>
                {p.no} / {p.title}
              </strong>
              <span className="text-xs leading-relaxed text-[var(--text-mid)]">{p.desc}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="p-5 sm:p-7">
        <SectionHeader icon="science" kicker="EXECUTE // AST" title={<span>{c.section1.title}</span>} />
        <p className="mt-4 text-[13px] leading-relaxed text-[var(--text-mid)]">{c.section1.body}</p>
      </Panel>

      <Panel className="p-5 sm:p-7">
        <SectionHeader icon="handshake" kicker="AMANAT // TRUST" title={<span>{c.section2.title}</span>} />
        <p className="mt-4 text-[13px] leading-relaxed text-[var(--text-mid)]">{c.section2.body}</p>
      </Panel>
    </StaticPageShell>
  );
}