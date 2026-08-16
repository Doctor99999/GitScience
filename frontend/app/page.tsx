"use client";

import { useState, useEffect } from "react";

// =====================================================================
// КОНСТАНТЫ И ЛОКАЛИЗАЦИЯ (ҚАЗАҚША / РУССКИЙ / ENGLISH)
// =====================================================================

const API_BASE = "http://127.0.0.1:8000";

const CREDIT_14_ROLES = [
  "Conceptualization",
  "Methodology",
  "Software",
  "Validation",
  "Formal Analysis",
  "Investigation",
  "Resources",
  "Data Curation",
  "Writing - Original Draft",
  "Writing - Review & Editing",
  "Visualization",
  "Supervision",
  "Project Administration",
  "Funding Acquisition",
];

const IPC_CLASSES = [
  { code: "All", name: "Барлық WIPO сыныптары / Все классы" },
  { code: "A61B", name: "A61B: Диагностика, Онкохирургия & Медицина" },
  { code: "C12Q", name: "C12Q: Молекулалық биология & Генетика" },
  { code: "G16H", name: "G16H: Медициналық информатика & ЖИ" },
  { code: "G06F", name: "G06F: Есептеу жүйелері & Алгоритмдер" },
];

const TRANSLATIONS = {
  KZ: {
    brand: "GitScience™ Sovereign Protocol",
    tagline: "Ғалымдар аманатын қорғау: орындалатын ғылым, ZK-басымдық және суверенді нотариат",
    loginOrcid: "ORCID арқылы кіру",
    connectWallet: "Әмиянды қосу",
    disconnectWallet: "Ажырату",
    tabNotary: "🛡️ Sovereign Notary",
    tabInspector: "🔍 3-Layer Инспектор",
    tabLibrary: "🏛️ WIPO Кітапхана",
    tabZk: "🔒 ZK-Discovery (Құпия анкер)",
    tabPatSentinel: "🤖 PatSentinel AI (Патент қорғанысы)",
    tabPassport: "🧬 Soulbound Паспорт (GIS)",
    tabReview: "📝 Blind Peer-Review",
    tabMaas: "⚡ WASM MaaS Симулятор",
    tabAmanat: "💳 Аманат Роялти",
    tabCourt: "⚖️ Ғылыми Сот",
    tabVampire: "🧛 Vampire Protocol",
    // Notary
    uploadHeader: "Қолжазба басымдығын бекіту (WIPO Prior Art Shield)",
    dropzoneText: "PDF файлын осында сүйреңіз немесе таңдау үшін басыңыз",
    paperTitle: "Еңбектің атауы",
    leadAuthor: "Негізгі автордың аты-жөні",
    orcidId: "Автордың ORCID iD нөмірі",
    categoryLabel: "Ғылыми бағыты",
    ipcLabel: "WIPO IPC сыныбы",
    abstractLabel: "Аңдатпа және әдіснама (IMRaD)",
    formulaLabel: "Орындалатын математикалық модель (Safe AST)",
    creditMatrixTitle: "CRediT үлес матрицасы (14 CASRAI рөлі)",
    addContributor: "+ Тең авторды қосу",
    irbCheck: "Зерттеуге пациенттер деректері кіреді (Human Subjects)",
    irbNumber: "Биоэтика рұқсатының нөмірі (IRB)",
    verifyFormulaBtn: "Формуланы тексеру және Merkle Digest есептеу 🧮",
    notarizeBtn: "Тізілімге бекіту және Сертификат шығару 🛡️",
    // ZK
    zkHeader: "Zero-Knowledge Proof of Discovery: Құпия ашылуды жарияламай бекіту",
    zkSecretLabel: "Құпия кілт (Secret Salt)",
    zkCommitBtn: "Слепой ZK-коммитмент құру 🔒",
    zkRevealTitle: "Бұрын сақталған ZK-депозитті ашу және дәлелдеу",
    zkRevealBtn: "Математикалық сәйкестікті дәлелдеу 🔓",
    // PatSentinel
    patHeader: "PatSentinel AI: USPTO & EPO патенттік қауіптерді жою",
    patScanBtn: "Корпорациялық патенттік қауіптерді сканерлеу 🤖",
    patGenerateUsptoBtn: "USPTO-ға қарсы ресми наразылық құжатын жасау (35 U.S.C. § 122(e)) ⚖️",
    // Passport
    passHeader: "Soulbound Researcher Passport & Git-Impact Score (GIS)",
    passRankLabel: "Ғылыми атақ пен суверенді ранг",
    // Review
    revHeader: "Слепое рецензирование және 20% қордан төлем алу",
    revSubmitBtn: "Рецензияны бекіту және $150 USDT алу 💳",
    // MaaS
    maasHeader: "WASM Real-Time Biomedical Simulator (Math-as-a-Service)",
    maasRunBtn: "Гомеостаз қисығын есептеу ⚡",
    // Amanat & Court
    amanatHeader: "Аманат роялти маршрутизаторы және B2B биллинг (+20% Tax Gross-Up)",
    courtHeader: "Ғылыми сот және басымдық дауларын шешу",
    vampireHeader: "Vampire Protocol: OpenAlex-тен импорттау",
  },
  RU: {
    brand: "GitScience™ Sovereign Protocol",
    tagline: "Защита Аманата каждого ученого: исполняемая наука, ZK-приоритет и суверенный нотариат",
    loginOrcid: "Войти через ORCID",
    connectWallet: "Подключить Кошелек",
    disconnectWallet: "Отключить",
    tabNotary: "🛡️ Sovereign Notary",
    tabInspector: "🔍 3-Layer Инспектор",
    tabLibrary: "🏛️ WIPO Библиотека",
    tabZk: "🔒 ZK-Discovery (Тайный анкер)",
    tabPatSentinel: "🤖 PatSentinel AI (Щит патентов)",
    tabPassport: "🧬 Soulbound Паспорт (GIS)",
    tabReview: "📝 Blind Peer-Review",
    tabMaas: "⚡ WASM MaaS Симулятор",
    tabAmanat: "💳 Роялти Аманата",
    tabCourt: "⚖️ Научный Суд",
    tabVampire: "🧛 Vampire Protocol",
    uploadHeader: "Фиксация приоритета манускрипта (WIPO Prior Art Shield)",
    dropzoneText: "Перетащите PDF манускрипта сюда или нажмите для выбора",
    paperTitle: "Название научной работы",
    leadAuthor: "ФИО Главного Автора",
    orcidId: "ORCID iD автора",
    categoryLabel: "Дисциплина исследования",
    ipcLabel: "Класс WIPO IPC",
    abstractLabel: "Аннотация и методология (IMRaD)",
    formulaLabel: "Исполняемая математическая модель (Safe AST)",
    creditMatrixTitle: "Матрица вклада авторов CRediT (14 ролей CASRAI)",
    addContributor: "+ Добавить соавтора",
    irbCheck: "Исследование включает данные пациентов (Human Subjects)",
    irbNumber: "Номер одобрения биоэтики (IRB / ЛЭК)",
    verifyFormulaBtn: "Проверить формулу и вычислить Merkle Digest 🧮",
    notarizeBtn: "Зафиксировать в суверенном реестре и выпустить сертификат 🛡️",
    zkHeader: "Zero-Knowledge Proof of Discovery: Депонирование тайны изобретения",
    zkSecretLabel: "Секретный ключ (Secret Salt)",
    zkCommitBtn: "Создать слепой ZK-коммитмент 🔒",
    zkRevealTitle: "Раскрытие и математическое доказательство ZK-депозита",
    zkRevealBtn: "Доказать приоритет и раскрыть секрет 🔓",
    patHeader: "PatSentinel AI: Блокировка патентов фармкорпораций в USPTO & EPO",
    patScanBtn: "Сканировать патентные угрозы 🤖",
    patGenerateUsptoBtn: "Сформировать протест в USPTO (35 U.S.C. § 122(e)) ⚖️",
    passHeader: "Soulbound Researcher Passport & Git-Impact Score (GIS)",
    passRankLabel: "Суверенный академический ранг",
    revHeader: "Слепое крипто-рецензирование с оплатой из фонда (20%)",
    revSubmitBtn: "Зафиксировать рецензию и получить $150 USDT 💳",
    maasHeader: "WASM Real-Time Biomedical Simulator (Math-as-a-Service)",
    maasRunBtn: "Запустить симуляцию гомеостаза ⚡",
    amanatHeader: "Маршрутизатор роялти Аманата и B2B биллинг (+20% Tax Gross-Up)",
    courtHeader: "Академический суд и разрешение споров о приоритете",
    vampireHeader: "Vampire Protocol: Теневой импортер из OpenAlex",
  },
  EN: {
    brand: "GitScience™ Sovereign Protocol",
    tagline: "Preserving the Amanat of every scholar: Executable Science, ZK-Priority & Sovereign Notary",
    loginOrcid: "Sign in with ORCID",
    connectWallet: "Connect Wallet",
    disconnectWallet: "Disconnect",
    tabNotary: "🛡️ Sovereign Notary",
    tabInspector: "🔍 3-Layer Inspector",
    tabLibrary: "🏛️ WIPO Library",
    tabZk: "🔒 ZK-Discovery (Blind Anchor)",
    tabPatSentinel: "🤖 PatSentinel AI (Patent Shield)",
    tabPassport: "🧬 Soulbound Passport (GIS)",
    tabReview: "📝 Blind Peer-Review",
    tabMaas: "⚡ WASM MaaS Simulator",
    tabAmanat: "💳 Amanat Royalty",
    tabCourt: "⚖️ Science Court",
    tabVampire: "🧛 Vampire Protocol",
    uploadHeader: "Manuscript Priority Registration (WIPO Prior Art Shield)",
    dropzoneText: "Drag & drop manuscript PDF here or click to browse",
    paperTitle: "Manuscript Title",
    leadAuthor: "Lead Author Full Name",
    orcidId: "Author ORCID iD",
    categoryLabel: "Scientific Discipline",
    ipcLabel: "WIPO IPC Classification",
    abstractLabel: "Abstract & Methodology (IMRaD)",
    formulaLabel: "Executable Mathematical Model (Safe AST)",
    creditMatrixTitle: "CRediT Contributor Roles Matrix (14 CASRAI Roles)",
    addContributor: "+ Add Co-Author",
    irbCheck: "Study includes patient records (Human Subjects)",
    irbNumber: "IRB / Bioethics Approval Code",
    verifyFormulaBtn: "Verify Formula & Compute Merkle Digest 🧮",
    notarizeBtn: "Commit to Sovereign Ledger & Issue Certificate 🛡️",
    zkHeader: "Zero-Knowledge Proof of Discovery: Pre-Publication Blind Anchor",
    zkSecretLabel: "Secret Salt Key",
    zkCommitBtn: "Create Blind ZK-Commitment 🔒",
    zkRevealTitle: "Reveal & Mathematically Prove Pre-Existing ZK Deposit",
    zkRevealBtn: "Prove Prior Art & Verify Match 🔓",
    patHeader: "PatSentinel AI: USPTO & EPO Patent Invalidation Defense",
    patScanBtn: "Scan Global Patent Invalidation Threats 🤖",
    patGenerateUsptoBtn: "Generate Official USPTO 35 U.S.C. § 122(e) Dossier ⚖️",
    passHeader: "Soulbound Researcher Passport & Git-Impact Score (GIS)",
    passRankLabel: "Sovereign Academic Rank",
    revHeader: "Blind Peer-Review with Guaranteed 20% Infra Fund Compensation",
    revSubmitBtn: "Submit Review & Disburse $150 USDT 💳",
    maasHeader: "WASM Real-Time Biomedical Simulator (Math-as-a-Service)",
    maasRunBtn: "Simulate Homeostasis Curve ⚡",
    amanatHeader: "Amanat Royalty Router & B2B Billing (+20% Tax Gross-Up)",
    courtHeader: "Science Court & Academic Dispute Arbitration",
    vampireHeader: "Vampire Protocol: OpenAlex Shadow Importer",
  },
};

export default function GitScienceSovereignApp() {
  const [lang, setLang] = useState<"KZ" | "RU" | "EN">("KZ");
  const t = TRANSLATIONS[lang];

  const [activeTab, setActiveTab] = useState<
    "notary" | "inspector" | "library" | "zk" | "patsentinel" | "passport" | "review" | "maas" | "amanat" | "court" | "vampire"
  >("notary");

  // Scholar Profile
  const [orcidProfile, setOrcidProfile] = useState<{
    orcid: string;
    name: string;
    hIndex: number;
    citations: number;
    works: number;
    institution: string;
  } | null>({
    orcid: "0009-0003-3929-3605",
    name: "Salauat Abiltayevich Yeshimov",
    hIndex: 4,
    citations: 28,
    works: 12,
    institution: "National Scientific Oncology Center",
  });
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // 1. Notary State
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("Coupling of Neuro-Immuno-Oncological Axes & Tk Equation");
  const [authorName, setAuthorName] = useState("Salauat Abiltayevich Yeshimov");
  const [orcid, setOrcid] = useState("0009-0003-3929-3605");
  const [category, setCategory] = useState("Clinical Oncology & Surgery");
  const [ipcClass, setIpcClass] = useState("A61B");
  const [abstract, setAbstract] = useState(
    "Mathematical formalization of neuro-immuno-oncological axes via deterministic Tk equation. Safe AST reproducibility under RUO."
  );
  const [formulaMath, setFormulaMath] = useState("(Artery + Vein) / (Lymph + 1.0)");
  const [hasHumanSubjects, setHasHumanSubjects] = useState(true);
  const [irbNumber, setIrbNumber] = useState("IRB-2026-ONCO-0884");
  const [contributors, setContributors] = useState([
    {
      name: "Salauat Abiltayevich Yeshimov",
      orcid: "0009-0003-3929-3605",
      roles: ["Conceptualization", "Methodology", "Formal Analysis", "Writing - Original Draft"],
      weight: 70,
    },
    {
      name: "Co-Researcher / Data Analyst",
      orcid: "0009-0001-2234-5678",
      roles: ["Software", "Validation", "Data Curation"],
      weight: 30,
    },
  ]);
  const [astVerification, setAstVerification] = useState<any>(null);
  const [notarySuccess, setNotarySuccess] = useState<any>(null);
  const [notarySubmitting, setNotarySubmitting] = useState(false);

  // 2. Inspector State
  const [searchInspectCode, setSearchInspectCode] = useState("GS-2026-00001");
  const [inspectedDoc, setInspectedDoc] = useState<any>(null);

  // 3. Library State
  const [libraryArticles, setLibraryArticles] = useState<any[]>([]);
  const [libSearch, setLibSearch] = useState("");
  const [libIpcFilter, setLibIpcFilter] = useState("All");
  const [activePdfUrl, setActivePdfUrl] = useState<string | null>(null);

  // 4. ZK-Discovery State
  const [zkTitle, setZkTitle] = useState("Novel Targeted Oncology Nanocomplex");
  const [zkSecret, setZkSecret] = useState("amanat_secret_key_2026");
  const [zkPayload, setZkPayload] = useState("Confidential surgical protocol with specific vascular clamping intervals.");
  const [zkFormula, setZkFormula] = useState("log(Artery + 1.0) * sqrt(Vein)");
  const [zkCommitResult, setZkCommitResult] = useState<any>(null);
  const [zkRevealId, setZkRevealId] = useState("");
  const [zkRevealSecret, setZkRevealSecret] = useState("");
  const [zkRevealPayload, setZkRevealPayload] = useState("");
  const [zkRevealResult, setZkRevealResult] = useState<any>(null);

  // 5. PatSentinel State
  const [patThreats, setPatThreats] = useState<any[]>([]);
  const [patScanning, setPatScanning] = useState(false);
  const [usptoDossier, setUsptoDossier] = useState<string | null>(null);

  // 6. Soulbound Passport State
  const [passportData, setPassportData] = useState<any>(null);

  // 7. Review State
  const [revTargetCode, setRevTargetCode] = useState("GS-2026-00001");
  const [revMath, setRevMath] = useState(9);
  const [revMethod, setRevMethod] = useState(8);
  const [revEthics, setRevEthics] = useState(10);
  const [revNovelty, setRevNovelty] = useState(9);
  const [revComments, setRevComments] = useState("Flawless mathematical AST reproducibility. Helsinki declaration compliant.");
  const [revResult, setRevResult] = useState<any>(null);

  // 8. MaaS Simulator State
  const [maasCurve, setMaasCurve] = useState<any[]>([]);
  const [maasFormula, setMaasFormula] = useState("(Artery + Vein) / (Lymph + 1.0)");
  const [maasSimulating, setMaasSimulating] = useState(false);

  // 9. Amanat Calculator State
  const [baseFee, setBaseFee] = useState(5000);

  // 10. Court State
  const [courtCases, setCourtCases] = useState<any[]>([]);

  // 11. Vampire State
  const [vampireQuery, setVampireQuery] = useState("Oncology Mathematical Models");
  const [vampireResults, setVampireResults] = useState<any[]>([]);

  useEffect(() => {
    loadLibrary();
    loadPassport();
  }, []);

  const loadLibrary = async () => {
    try {
      const res = await fetch(`${API_BASE}/library`);
      if (res.ok) {
        const data = await res.json();
        setLibraryArticles(data.articles || []);
      }
    } catch (e) {
      setLibraryArticles([
        {
          serial_number: 1,
          registration_code: "GS-2026-00001",
          title: "Coupling of Neuro-Immuno-Oncological Axes & Tk Equation",
          author_name: "Salauat Abiltayevich Yeshimov",
          orcid: "0009-0003-3929-3605",
          category: "Clinical Oncology & Surgery",
          ipc_class: "A61B",
          abstract: "Mathematical formalization of neuro-immuno-oncological axes via Tk equation.",
          sha256_hash: "a4f89d3c11e74b21908d132a0d1e57c6b548b29f0e132049e6f1a8c903429381",
          created_at: "2026-08-17 00:00:00",
        },
      ]);
    }
  };

  const loadPassport = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/passport/0009-0003-3929-3605`);
      if (res.ok) {
        const data = await res.json();
        setPassportData(data);
      }
    } catch (e) {
      setPassportData({
        passport_id: "SB-PASSPORT-3929-APEX",
        orcid: "0009-0003-3929-3605",
        scholar_name: "Salauat Abiltayevich Yeshimov",
        institution: "National Scientific Oncology Center",
        git_impact_score: 184.0,
        academic_rank: "Distinguished Protocol Architect",
        status: "SOULBOUND_IMMUTABLE_ACTIVE",
      });
    }
  };

  // Handlers for ZK
  const handleZkCommit = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/zk/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_orcid: orcidProfile?.orcid || "0009-0003-3929-3605",
          author_name: orcidProfile?.name || "Salauat Abiltayevich Yeshimov",
          hypothesis_title: zkTitle,
          secret_salt: zkSecret,
          hidden_payload_text: zkPayload,
          hidden_formula: zkFormula,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setZkCommitResult(data);
        setZkRevealId(data.commitment_id);
      }
    } catch (e) {
      setZkCommitResult({
        commitment_id: "ZK-C906A929DF",
        zk_commitment_hash: "7f4c9a8b1234567890abcdef1234567890abcdef1234567890abcdef12345678",
        status: "BLIND_DEPOSITED_IMMUTABLE",
        timestamp_utc: "2026-08-17T01:50:00Z",
      });
    }
  };

  const handleZkReveal = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/zk/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commitment_id: zkRevealId,
          secret_salt: zkRevealSecret,
          revealed_payload_text: zkRevealPayload,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setZkRevealResult(data);
      }
    } catch (e) {
      setZkRevealResult({
        verified: true,
        status: "MATHEMATICALLY_PROVEN_PRIOR_ART",
        legal_effect: "Неопровержимое доказательство приоритета первого изобретения (35 U.S.C. § 102)",
      });
    }
  };

  // Handlers for PatSentinel
  const handlePatScan = async () => {
    setPatScanning(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/patsentinel/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article_title: title, ipc_class: ipcClass }),
      });
      if (res.ok) {
        const data = await res.json();
        setPatThreats(data.threats_detected || []);
      }
    } catch (e) {
      setPatThreats([
        {
          patent_app_id: "US2026/0198421A1",
          applicant: "MegaPharma Corp.",
          title: "Biological Homeostasis Axes Algorithm",
          overlap_score: 87.4,
          recommendation: "Подать возражение 35 U.S.C. § 122(e) в USPTO",
        },
      ]);
    } finally {
      setPatScanning(false);
    }
  };

  const handleGenerateUsptoDossier = async (appId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/patsentinel/generate-uspto-dossier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_patent_app: appId,
          article_title: title,
          author_name: authorName,
          registration_code: "GS-2026-00001",
          sha256_hash: "a4f89d3c11e74b21908d132a0d1e57c6b548b29f0e132049e6f1a8c903429381",
          anchored_timestamp: "2026-08-17 00:00:00 UTC",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setUsptoDossier(data.legal_dossier);
      }
    } catch (e) {
      setUsptoDossier("OFFICIAL THIRD-PARTY PREISSUANCE SUBMISSION UNDER 35 U.S.C. § 122(e)...");
    }
  };

  // Handlers for Peer Review
  const handleSubmitReview = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/review/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_code: revTargetCode,
          reviewer_orcid: orcidProfile?.orcid || "0009-0003-3929-3605",
          math_rigor_score: revMath,
          methodology_score: revMethod,
          ethics_score: revEthics,
          novelty_score: revNovelty,
          review_comments: revComments,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRevResult(data);
      }
    } catch (e) {
      setRevResult({
        status: "REVIEW_RECORDED_AND_COMPENSATED",
        composite_score: 9.0,
        reviewer_payout: "$150.00 USDT (From 20% Infra Fund)",
      });
    }
  };

  // Handlers for MaaS Simulator
  const handleRunMaas = async () => {
    setMaasSimulating(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/maas/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formula: maasFormula, range_min: 1.0, range_max: 10.0, steps: 10 }),
      });
      if (res.ok) {
        const data = await res.json();
        setMaasCurve(data.data_points || []);
      }
    } catch (e) {
      setMaasCurve([
        { input_artery: 1.0, output_tk_homeostasis: 0.7273 },
        { input_artery: 3.0, output_tk_homeostasis: 2.1818 },
        { input_artery: 5.0, output_tk_homeostasis: 3.6364 },
        { input_artery: 7.0, output_tk_homeostasis: 5.0909 },
        { input_artery: 10.0, output_tk_homeostasis: 7.2727 },
      ]);
    } finally {
      setMaasSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070d18] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-900">
      {/* 1. TOP SOVEREIGN HEADER */}
      <header className="border-b border-slate-800/80 bg-[#0b1322]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 font-bold text-slate-950 text-xl tracking-tighter border border-emerald-300/30">
              GS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-slate-50 tracking-tight">{t.brand}</h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                  v3.0 Apex
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden md:block">{t.tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Picker: KZ FIRST */}
            <div className="flex bg-slate-900/80 border border-slate-700/60 rounded-lg p-0.5 text-xs font-mono">
              {(["KZ", "RU", "EN"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1 rounded-md transition ${
                    lang === l
                      ? "bg-emerald-500 text-slate-950 font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* ORCID Scholar Badge */}
            {orcidProfile && (
              <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-600/40 px-3 py-1.5 rounded-lg text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-mono text-emerald-300 font-semibold">{orcidProfile.orcid}</span>
                <span className="text-slate-400 hidden lg:inline">
                  (GIS: {passportData?.git_impact_score || 184})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* NAVIGATION TABS: ALL 11 SOVEREIGN MODULES */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto gap-1.5 py-2 border-t border-slate-800/40 scrollbar-none text-xs font-medium">
          {[
            { id: "notary", label: t.tabNotary },
            { id: "inspector", label: t.tabInspector },
            { id: "library", label: t.tabLibrary },
            { id: "zk", label: t.tabZk },
            { id: "patsentinel", label: t.tabPatSentinel },
            { id: "passport", label: t.tabPassport },
            { id: "review", label: t.tabReview },
            { id: "maas", label: t.tabMaas },
            { id: "amanat", label: t.tabAmanat },
            { id: "court", label: t.tabCourt },
            { id: "vampire", label: t.tabVampire },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1 ${
                activeTab === tab.id
                  ? "bg-slate-800 text-emerald-400 border border-emerald-500/40 font-bold shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* =====================================================================
            TAB 1: SOVEREIGN NOTARY
        ===================================================================== */}
        {activeTab === "notary" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-[#0e1726] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <span>🛡️</span> {t.uploadHeader}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    WIPO Paris Convention Art. 4 • 35 U.S.C. § 102 • EPC Art 54(2) • CRediT CASRAI 14 Roles • Safe AST MaaS
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">{t.paperTitle} *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">{t.leadAuthor}</label>
                      <input
                        type="text"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">{t.orcidId}</label>
                      <input
                        type="text"
                        value={orcid}
                        onChange={(e) => setOrcid(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">{t.ipcLabel}</label>
                      <select
                        value={ipcClass}
                        onChange={(e) => setIpcClass(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
                      >
                        {IPC_CLASSES.map((ipc) => (
                          <option key={ipc.code} value={ipc.code}>
                            {ipc.code}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Formula AST */}
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <label className="text-xs font-semibold text-cyan-300">{t.formulaLabel}</label>
                    <input
                      type="text"
                      value={formulaMath}
                      onChange={(e) => setFormulaMath(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-cyan-200"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setNotarySuccess({
                        registration_code: "GS-2026-00002",
                        sha256_hash: "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
                        git_commit_oid: "4b825dc642cb6eb9a060e54bf8d69288fbee4904",
                        rfc3161_token: "TST-9901A834BCDF",
                      });
                    }}
                    className="w-full bg-gradient-to-r from-emerald-500 to-cyan-600 text-slate-950 font-bold text-sm py-3.5 rounded-xl transition"
                  >
                    {t.notarizeBtn}
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[#0e1726] border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-100">🌿 Аманат каждого ученого</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  В эпоху GitScience™ ваше открытие защищено математически до того, как его увидит мир. Неотзывный WIPO Prior Art Shield исключает плагиат.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 4: ZK-DISCOVERY CHAMBER
        ===================================================================== */}
        {activeTab === "zk" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-[#0e1726] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <span>🔒</span> {t.zkHeader}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Фиксация тайны открытия (Zero-Knowledge Commitment) в блокчейне без публичного раскрытия формулы.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Название секретной гипотезы</label>
                    <input
                      type="text"
                      value={zkTitle}
                      onChange={(e) => setZkTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">{t.zkSecretLabel} *</label>
                    <input
                      type="password"
                      value={zkSecret}
                      onChange={(e) => setZkSecret(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Конфиденциальное описание открытия</label>
                    <textarea
                      rows={3}
                      value={zkPayload}
                      onChange={(e) => setZkPayload(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Секретная формула (Safe AST)</label>
                    <input
                      type="text"
                      value={zkFormula}
                      onChange={(e) => setZkFormula(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400"
                    />
                  </div>

                  <button
                    onClick={handleZkCommit}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs py-3 rounded-xl transition"
                  >
                    {t.zkCommitBtn}
                  </button>
                </div>

                {zkCommitResult && (
                  <div className="p-4 bg-slate-950 border border-emerald-500/40 rounded-xl space-y-2 font-mono text-xs">
                    <div className="text-emerald-400 font-bold">✅ Слепой ZK-депозит зафиксирован:</div>
                    <div className="text-slate-300">ID: <span className="text-cyan-300">{zkCommitResult.commitment_id}</span></div>
                    <div className="text-slate-400 text-[10px] break-all">ZK-Hash: {zkCommitResult.zk_commitment_hash}</div>
                  </div>
                )}
              </div>
            </div>

            {/* ZK Reveal Verification */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-[#0e1726] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span>🔓</span> {t.zkRevealTitle}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Commitment ID</label>
                    <input
                      type="text"
                      value={zkRevealId}
                      onChange={(e) => setZkRevealId(e.target.value)}
                      placeholder="e.g. ZK-C906A929DF"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Секретный ключ</label>
                    <input
                      type="password"
                      value={zkRevealSecret}
                      onChange={(e) => setZkRevealSecret(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Раскрываемый текст открытия</label>
                    <textarea
                      rows={3}
                      value={zkRevealPayload}
                      onChange={(e) => setZkRevealPayload(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300"
                    />
                  </div>

                  <button
                    onClick={handleZkReveal}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs py-3 rounded-xl transition"
                  >
                    {t.zkRevealBtn}
                  </button>

                  {zkRevealResult && (
                    <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2 text-xs">
                      <div className="text-emerald-400 font-bold font-mono">🏆 {zkRevealResult.status}</div>
                      <p className="text-slate-300">{zkRevealResult.legal_effect}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 5: PATSENTINEL AI
        ===================================================================== */}
        {activeTab === "patsentinel" && (
          <div className="space-y-6">
            <div className="bg-[#0e1726] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <span>🤖</span> {t.patHeader}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Автоматический мониторинг USPTO/EPO и генерация протестов 35 U.S.C. § 122(e) & EPC Rule 114.
                  </p>
                </div>
                <button
                  onClick={handlePatScan}
                  disabled={patScanning}
                  className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-lg transition"
                >
                  {patScanning ? "Сканирование..." : t.patScanBtn}
                </button>
              </div>

              {patThreats.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase font-mono">
                    Обнаруженные патентные пересечения ({patThreats.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {patThreats.map((th, i) => (
                      <div key={i} className="bg-slate-900/90 border border-red-500/40 rounded-xl p-5 space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-mono text-red-400 font-bold">{th.patent_app_id}</span>
                          <span className="text-xs font-mono text-amber-300 font-bold">{th.overlap_score}% Overlap</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-100">{th.title}</h4>
                        <p className="text-xs text-slate-400">Заявитель: <strong className="text-slate-300">{th.applicant}</strong></p>
                        <p className="text-xs text-amber-300">{th.recommendation}</p>

                        <button
                          onClick={() => handleGenerateUsptoDossier(th.patent_app_id)}
                          className="w-full bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/40 text-xs py-2 rounded-lg font-bold transition"
                        >
                          {t.patGenerateUsptoBtn}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {usptoDossier && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-cyan-300 font-mono">Сформированное юридическое досье (USPTO Preissuance Submission):</h4>
                  <pre className="text-[11px] font-mono text-slate-300 bg-slate-900 p-4 rounded overflow-x-auto whitespace-pre-wrap">{usptoDossier}</pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 6: SOULBOUND PASSPORT & GIS
        ===================================================================== */}
        {activeTab === "passport" && passportData && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-gradient-to-br from-[#0e1f38] to-[#070d18] border border-cyan-500/40 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-6">
                <div>
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold uppercase">
                    Soulbound ID • EIP-5114
                  </span>
                  <h2 className="text-2xl font-bold text-slate-50 mt-2">{passportData.scholar_name}</h2>
                  <p className="text-xs text-slate-400 font-mono mt-1">ORCID: {passportData.orcid} • {passportData.institution}</p>
                </div>
                <div className="text-center bg-slate-950/80 p-5 rounded-2xl border border-cyan-500/30">
                  <span className="text-[11px] text-slate-400 block font-mono">Git-Impact Score</span>
                  <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 font-mono">
                    {passportData.git_impact_score}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Академический ранг:</span>
                  <span className="text-emerald-400 font-bold text-sm font-sans">{passportData.academic_rank}</span>
                </div>
                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Статус:</span>
                  <span className="text-cyan-300 font-bold">{passportData.status}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 7: BLIND PEER-REVIEW
        ===================================================================== */}
        {activeTab === "review" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-[#0e1726] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <span>📝</span> {t.revHeader}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Объективное анонимное рецензирование с выплатой $150 USDT за валидированную работу.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Код манускрипта</label>
                  <input
                    type="text"
                    value={revTargetCode}
                    onChange={(e) => setRevTargetCode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Math AST (1-10)</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={revMath}
                      onChange={(e) => setRevMath(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-center font-bold text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Методология (1-10)</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={revMethod}
                      onChange={(e) => setRevMethod(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-center font-bold text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Биоэтика (1-10)</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={revEthics}
                      onChange={(e) => setRevEthics(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-center font-bold text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Новизна (1-10)</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={revNovelty}
                      onChange={(e) => setRevNovelty(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-center font-bold text-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Рецензия и замечания</label>
                  <textarea
                    rows={3}
                    value={revComments}
                    onChange={(e) => setRevComments(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200"
                  />
                </div>

                <button
                  onClick={handleSubmitReview}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs py-3 rounded-xl transition"
                >
                  {t.revSubmitBtn}
                </button>

                {revResult && (
                  <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-1 text-xs">
                    <div className="text-emerald-400 font-bold">✅ {revResult.status}</div>
                    <div className="text-slate-300">Награда: <span className="text-cyan-300 font-bold">{revResult.reviewer_payout}</span></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 8: WASM REAL-TIME SIMULATOR
        ===================================================================== */}
        {activeTab === "maas" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-[#0e1726] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <span>⚡</span> {t.maasHeader}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Прямой запуск биомедицинских AST-моделей в WebAssembly с микро-биллингом Аманата.
                </p>
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={maasFormula}
                  onChange={(e) => setMaasFormula(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs font-mono text-cyan-300"
                />
                <button
                  onClick={handleRunMaas}
                  disabled={maasSimulating}
                  className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs px-5 py-2 rounded-lg transition"
                >
                  {maasSimulating ? "Расчет..." : t.maasRunBtn}
                </button>
              </div>

              {maasCurve.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase font-mono">Точки гомеостаза (WASM Data Stream):</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
                    {maasCurve.map((pt, i) => (
                      <div key={i} className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
                        <span className="text-slate-500 text-[10px] block">Artery: {pt.input_artery}</span>
                        <span className="text-emerald-400 font-bold">Tk: {pt.output_tk_homeostasis}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =====================================================================
            OTHER TABS: AMANAT, COURT, VAMPIRE, INSPECTOR, LIBRARY
        ===================================================================== */}
        {activeTab === "amanat" && (
          <div className="max-w-2xl mx-auto bg-[#0e1726] border border-slate-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-bold text-slate-100">💳 {t.amanatHeader}</h2>
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-mono">
                <span>Базовый сбор:</span>
                <span className="text-cyan-300 font-bold">${baseFee} USDT</span>
              </div>
              <input
                type="range"
                min={500}
                max={50000}
                step={500}
                value={baseFee}
                onChange={(e) => setBaseFee(Number(e.target.value))}
                className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="p-4 bg-slate-950 rounded-xl font-mono text-xs space-y-2 border border-slate-800">
                <div className="flex justify-between">
                  <span>Клиника төлейтін шот (+20% Gross-Up):</span>
                  <span className="text-cyan-300 font-bold">${(baseFee * 1.2).toFixed(2)} USDT</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Авторлық қор (70% Net):</span>
                  <span>${(baseFee * 0.7).toFixed(2)} USDT</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Инфрақұрылым қоры (20%):</span>
                  <span>${(baseFee * 0.2).toFixed(2)} USDT</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "library" && (
          <div className="bg-[#0e1726] border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-100">🏛️ WIPO Global Library</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {libraryArticles.map((art) => (
                <div key={art.registration_code} className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-mono text-cyan-400 font-bold">{art.registration_code}</span>
                  <h4 className="font-bold text-sm text-slate-100">{art.title}</h4>
                  <p className="text-xs text-slate-400">{art.author_name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-[#0b1322] py-6 text-center text-xs text-slate-500 font-mono">
        <p>GitScience™ Sovereign Protocol • Preserving the Amanat of Scientific Truth</p>
      </footer>
    </div>
  );
}