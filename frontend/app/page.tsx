"use client";

import { useState, useEffect } from "react";

// Словарь локализации (i18n)
const TRANSLATIONS = {
  RU: {
    brandSubtitle: "Децентрализованный нотариат открытий и цифровая научная библиотека мира",
    loginOrcid: "Войти через ORCID",
    connectWallet: "Подключить Кошелек",
    tabLibrary: "🏛️ Каталог Библиотеки",
    tabUpload: "📄 Зафиксировать Статью (PDF)",
    tabScorer: "🧠 Оценка Гипотезы / Новизны (%)",
    tabBilling: "💳 Fair-Share Биллинг",
    searchPlaceholder: "Поиск по названию, автору, ORCID или ключевым словам...",
    allCategories: "Все категории",
    viewPdf: "📖 Читать PDF",
    certBtn: "🛡️ Сертификат WIPO",
    emptyCatalog: "В выбранной категории пока нет опубликованных работ.",
    authorProfile: "Профиль Исследователя",
    hIndex: "Индекс Хирша (h-index)",
    citations: "Цитирования",
    publications: "Публикации",
    scoreTitle: "Оценка научной новизны и шанса публикации",
    scoreBtn: "Рассчитать индекс новизны (%)",
    overallPass: "Общий шанс публикации & защиты",
    noveltyScore: "Мировая новизна",
    defenseScore: "Защита Prior Art",
    replicability: "Воспроизводимость",
    uploadTitle: "Зафиксировать манускрипт и получить Сертификат Приоритета",
    paperTitle: "Название работы",
    authorName: "ФИО Автора / Изобретателя",
    categoryLabel: "Категория дисциплины",
    selectPdf: "Выберите оригинальный PDF-файл статьи",
    submitBtn: "Зафиксировать в Блокчейне и Выпустить Сертификат 🛡️",
    walletBalance: "Баланс кошелька",
  },
  EN: {
    brandSubtitle: "Decentralized Discovery Notary & Global Open Science Library",
    loginOrcid: "Sign in with ORCID",
    connectWallet: "Connect Wallet",
    tabLibrary: "🏛️ Library Catalog",
    tabUpload: "📄 Notarize Manuscript (PDF)",
    tabScorer: "🧠 Hypothesis Scorer (%)",
    tabBilling: "💳 Fair-Share Billing",
    searchPlaceholder: "Search by title, author, ORCID or keywords...",
    allCategories: "All Categories",
    viewPdf: "📖 Read PDF",
    certBtn: "🛡️ WIPO Certificate",
    emptyCatalog: "No published manuscripts found in this category.",
    authorProfile: "Scholar Profile",
    hIndex: "h-index",
    citations: "Citations",
    publications: "Works",
    scoreTitle: "Scientific Novelty & Feasibility Assessment",
    scoreBtn: "Calculate Novelty Score (%)",
    overallPass: "Publication & Defense Score",
    noveltyScore: "Global Novelty",
    defenseScore: "Prior Art Shield",
    replicability: "Replicability",
    uploadTitle: "Notarize Manuscript & Issue Priority Certificate",
    paperTitle: "Manuscript Title",
    authorName: "Author / Inventor Full Name",
    categoryLabel: "Scientific Category",
    selectPdf: "Select original PDF manuscript",
    submitBtn: "Commit to Ledger & Issue Certificate 🛡️",
    walletBalance: "Wallet Balance",
  },
  KZ: {
    brandSubtitle: "Ғылыми жаңалықтарды нотариаттау және әлемдік ашық кітапхана",
    loginOrcid: "ORCID арқылы кіру",
    connectWallet: "Әмиянды қосу",
    tabLibrary: "🏛️ Кітапхана каталогы",
    tabUpload: "📄 Мақаланы бекіту (PDF)",
    tabScorer: "🧠 Гипотезаны бағалау (%)",
    tabBilling: "💳 Fair-Share Биллинг",
    searchPlaceholder: "Атауы, авторы, ORCID немесе кілт сөздер бойынша іздеу...",
    allCategories: "Барлық санаттар",
    viewPdf: "📖 PDF оқу",
    certBtn: "🛡️ WIPO Сертификаты",
    emptyCatalog: "Бұл санатта әлі жарияланған мақалалар жоқ.",
    authorProfile: "Ғалымның Профилі",
    hIndex: "Хирш индексі (h-index)",
    citations: "Дәйексөздер",
    publications: "Еңбектер",
    scoreTitle: "Ғылыми жаңалық пен жарияланым мүмкіндігін бағалау",
    scoreBtn: "Жаңалық индексін есептеу (%)",
    overallPass: "Қорғау және жариялау деңгейі",
    noveltyScore: "Әлемдік жаңалық",
    defenseScore: "Prior Art қорғанысы",
    replicability: "Қайталанбалылық",
    uploadTitle: "Қолжазбаны бекіту және Басымдық Сертификатын алу",
    paperTitle: "Еңбектің атауы",
    authorName: "Автордың / Өнертапқыштың аты-жөні",
    categoryLabel: "Ғылыми бағыты",
    selectPdf: "Түпнұсқа PDF файлын таңдаңыз",
    submitBtn: "Блокчейнге бекіту және Сертификат шығару 🛡️",
    walletBalance: "Әмиян теңгерімі",
  },
};

const CATEGORIES = [
  "All",
  "Clinical Oncology & Surgery",
  "Neuroscience & Neuro-Immune Systems",
  "Genetics & Molecular Biology",
  "AI & Biomedical Mathematics",
  "Pharmacology & Biotech",
  "Physics & Complex Systems",
];

export default function GitScienceDashboard() {
  const [lang, setLang] = useState<"RU" | "EN" | "KZ">("RU");
  const t = TRANSLATIONS[lang];

  const [activeTab, setActiveTab] = useState<"library" | "upload" | "scorer" | "billing">("library");

  // Авторизация
  const [orcidUser, setOrcidUser] = useState<{ orcid: string; name: string } | null>(null);
  const [scholarMetrics, setScholarMetrics] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string>("0.00 ETH");

  // Библиотека и поиск
  const [articles, setArticles] = useState<any[]>([]);
  const [loadingLib, setLoadingLib] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Просмотр PDF и сертификата
  const [pdfViewingUrl, setPdfViewingUrl] = useState<string | null>(null);
  const [selectedCert, setSelectedCert] = useState<any>(null);

  // Загрузка статьи
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [title, setTitle] = useState("Coupling of Neuro-Immuno-Oncological Axes & Tk Equation");
  const [authorName, setAuthorName] = useState("Salauat Abiltayevich Yeshimov");
  const [orcidInput, setOrcidInput] = useState("0009-0003-3929-3605");
  const [category, setCategory] = useState("Clinical Oncology & Surgery");
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  // Оценщик гипотез
  const [hypoTitle, setHypoTitle] = useState("Mathematical Model of Amygdalar-Hematopoietic-Arterial Axis");
  const [hypoText, setHypoText] = useState("Tk = (Artery + Vein) / (Lymph + 1). Autonomous stress modulates systemic homeostasis.");
  const [hasFormula, setHasFormula] = useState(true);
  const [hasClinical, setHasClinical] = useState(true);
  const [scoreResult, setScoreResult] = useState<any>(null);
  const [scoring, setScoring] = useState(false);

  // Биллинг
  const [payAmount, setPayAmount] = useState(100);
  const [currency, setCurrency] = useState("USDT");
  const [payResult, setPayResult] = useState<any>(null);

  const API_URL = "https://gitscience-api.onrender.com";
  const ORCID_CLIENT_ID = "APP-7KHX9DAL2RMVUVFR";
  const REDIRECT_URI = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "https://doctor99999.github.io/GitScience/";

  // 1. Инициализация и захват ORCID
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const orcidFromUrl = urlParams.get("orcid");
      const nameFromUrl = urlParams.get("name");

      if (orcidFromUrl) {
        const u = { orcid: orcidFromUrl, name: nameFromUrl ? decodeURIComponent(nameFromUrl) : "Salauat Yeshimov" };
        setOrcidUser(u);
        setOrcidInput(u.orcid);
        setAuthorName(u.name);
        localStorage.setItem("gs_user", JSON.stringify(u));
        loadScholarMetrics(u.orcid);
      } else {
        const saved = localStorage.getItem("gs_user");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setOrcidUser(parsed);
            setOrcidInput(parsed.orcid);
            setAuthorName(parsed.name);
            loadScholarMetrics(parsed.orcid);
          } catch (e) {}
        } else {
          loadScholarMetrics("0009-0003-3929-3605");
        }
      }
    }
    fetchLibrary();
  }, []);

  const loadScholarMetrics = async (orcid: string) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/scholar/metrics/${orcid}`);
      const data = await res.json();
      setScholarMetrics(data);
    } catch (e) {}
  };

  const handleOrcidLogin = () => {
    const authUrl = `https://orcid.org/oauth/authorize?client_id=${ORCID_CLIENT_ID}&response_type=code&scope=/authenticate&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}`;
    window.location.href = authUrl;
  };

  const handleOrcidLogout = () => {
    setOrcidUser(null);
    localStorage.removeItem("gs_user");
  };

  // 2. MetaMask с реальным балансом
  const connectWallet = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const eth = (window as any).ethereum;
        const accounts = await eth.request({ method: "eth_requestAccounts" });
        if (accounts && accounts.length > 0) {
          const addr = accounts[0];
          setWalletAddress(addr);

          // Получение реального баланса ETH
          const balanceHex = await eth.request({ method: "eth_getBalance", params: [addr, "latest"] });
          const balanceWei = parseInt(balanceHex, 16);
          const balanceEth = (balanceWei / 1e18).toFixed(4);
          setWalletBalance(`${balanceEth} ETH`);
        }
      } catch (err: any) {
        alert("Ошибка подключения: " + err.message);
      }
    } else {
      alert("MetaMask не установлен.");
    }
  };

  // 3. Загрузка каталога с поиском и фильтрами
  const fetchLibrary = async () => {
    setLoadingLib(true);
    try {
      let url = `${API_URL}/library?category=${encodeURIComponent(selectedCategory)}`;
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.articles) setArticles(data.articles);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLib(false);
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, [selectedCategory, searchQuery]);

  // 4. Оценка гипотезы
  const handleScoreHypothesis = async () => {
    setScoring(true);
    setScoreResult(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/science/assess-hypothesis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: hypoTitle,
          text_content: hypoText,
          has_formula: hasFormula,
          has_clinical_data: hasClinical,
        }),
      });
      const data = await res.json();
      setScoreResult(data);
    } catch (e: any) {
      alert("Ошибка анализа: " + e.message);
    } finally {
      setScoring(false);
    }
  };

  // 5. Загрузка PDF
  const handleUploadPDF = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile) {
      alert("Выберите PDF файл");
      return;
    }
    setUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", pdfFile);
    formData.append("title", title);
    formData.append("author_name", authorName);
    formData.append("orcid", orcidInput);
    formData.append("category", category);
    formData.append("abstract", "Scientific discovery indexed in GitScience™ Global Library.");

    try {
      const res = await fetch(`${API_URL}/notary/upload-pdf`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setUploadResult(data);
      fetchLibrary();
    } catch (err: any) {
      alert("Ошибка нотариата: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const openCertificate = async (code: string) => {
    try {
      const res = await fetch(`${API_URL}/notary/certificate/${code}`);
      const data = await res.json();
      setSelectedCert(data);
    } catch (err) {
      alert("Не удалось загрузить данные сертификата");
    }
  };

  const openPdfViewer = (code: string) => {
    setPdfViewingUrl(`${API_URL}/library/view/${code}`);
  };

  const handlePay = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/billing/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: payAmount, currency, author_wallet: walletAddress || "0x71C...3929" }),
      });
      const data = await res.json();
      setPayResult(data);
    } catch (err: any) {
      alert("Ошибка биллинга: " + err.message);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-3 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ХЕДЕР МИРОВОГО УРОВНЯ */}
        <header className="bg-slate-900/90 backdrop-blur border border-slate-800 p-5 rounded-2xl shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl md:text-3xl font-black tracking-wider bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
                GITSCIENCE™
              </span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded-full font-mono font-bold tracking-widest uppercase">
                Global Science Protocol
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{t.brandSubtitle}</p>
          </div>

          {/* ПРАВАЯ ЧАСТЬ: ЯЗЫК + ORCID + КОШЕЛЕК */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto justify-start lg:justify-end">
            
            {/* Переключатель Языка */}
            <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs font-bold">
              {(["RU", "EN", "KZ"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1 rounded-lg transition ${lang === l ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"}`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* ORCID Авторизация */}
            {orcidUser ? (
              <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-700 px-3 py-1.5 rounded-xl text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-mono text-emerald-300 font-bold">{orcidUser.orcid}</span>
                <button onClick={handleOrcidLogout} className="text-slate-400 hover:text-red-400 ml-1 font-bold">✕</button>
              </div>
            ) : (
              <button
                onClick={handleOrcidLogin}
                className="bg-[#A6CE39] hover:bg-[#95ba31] text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 256 256">
                  <path d="M128,0A128,128,0,1,0,256,128,128,128,0,0,0,128,0ZM86.35,186.26H64.08V73.49H86.35ZM75.21,60.84a13.35,13.35,0,1,1,13.35-13.35A13.35,13.35,0,0,1,75.21,60.84Zm127.34,68.4c0,35.09-24.16,57-61.27,57H106.6V73.49h36.42C180.13,73.49,202.55,95.73,202.55,129.24Zm-22.77,0c0-23.77-13.79-37.89-38.5-37.89H128.87v75.78h12.41C166,167.13,179.78,153,179.78,129.24Z"/>
                </svg>
                {t.loginOrcid}
              </button>
            )}

            {/* Web3 Кошелек с реальным балансом */}
            {walletAddress ? (
              <div className="flex items-center gap-2 bg-indigo-950/80 border border-indigo-700 px-3 py-1.5 rounded-xl text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                <span className="text-emerald-400 font-bold">{walletBalance}</span>
                <span className="text-slate-400">({walletAddress.slice(0, 4)}...{walletAddress.slice(-4)})</span>
                <button onClick={() => setWalletAddress(null)} className="text-slate-400 hover:text-red-400 ml-1 font-bold">✕</button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow"
              >
                🦊 {t.connectWallet}
              </button>
            )}

          </div>
        </header>

        {/* КАРТОЧКА ПРОФИЛЯ УЧЕНОГО (H-INDEX & OPENALEX) */}
        {scholarMetrics && (
          <section className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center font-bold text-emerald-300">
                {scholarMetrics.display_name?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-slate-100 text-sm">{scholarMetrics.display_name}</h4>
                <p className="text-xs text-slate-400">{scholarMetrics.institution} | ORCID: <span className="font-mono text-emerald-400">{scholarMetrics.orcid}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs font-mono">
              <div className="text-center">
                <p className="text-slate-400">{t.hIndex}</p>
                <p className="text-base font-black text-emerald-400">{scholarMetrics.h_index}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-400">{t.citations}</p>
                <p className="text-base font-black text-sky-400">{scholarMetrics.citations_count}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-400">{t.publications}</p>
                <p className="text-base font-black text-amber-400">{scholarMetrics.works_count}</p>
              </div>
            </div>
          </section>
        )}

        {/* НАВИГАЦИОННЫЕ ВКЛАДКИ */}
        <nav className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
          {[
            { id: "library", label: t.tabLibrary },
            { id: "upload", label: t.tabUpload },
            { id: "scorer", label: t.tabScorer },
            { id: "billing", label: t.tabBilling },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition ${
                activeTab === tab.id ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" : "bg-slate-900 text-slate-400 hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* 1. ВКЛАДКА: КАТАЛОГ С МЕЖДУНАРОДНЫМИ КАТЕГОРИЯМИ И ПОИСКОМ */}
        {activeTab === "library" && (
          <section className="space-y-4">
            
            {/* Поисковая строка */}
            <div className="flex flex-col md:flex-row gap-3 items-center">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-3 text-slate-500 hover:text-white">✕</button>
                )}
              </div>
            </div>

            {/* Фильтр Категорий Журналов (Nature/Lancet Standard) */}
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                    selectedCategory === cat
                      ? "bg-slate-800 border-emerald-500 text-emerald-400 font-bold"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {cat === "All" ? t.allCategories : cat}
                </button>
              ))}
            </div>

            {/* Список Статей */}
            {loadingLib ? (
              <p className="text-sm text-slate-500 font-mono py-8 text-center">Загрузка архивного фонда...</p>
            ) : articles.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-2">
                <p className="text-slate-300 font-medium">{t.emptyCatalog}</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {articles.map((art) => (
                  <div key={art.serial_number} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between gap-4 items-start md:items-center hover:border-slate-700 transition">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-mono font-bold px-2 py-0.5 rounded">
                          {art.registration_code}
                        </span>
                        <span className="text-xs text-slate-400">{art.category}</span>
                      </div>
                      <h3 className="font-semibold text-slate-100 text-base">{art.title}</h3>
                      <p className="text-xs text-slate-400">Автор: <span className="text-slate-200 font-medium">{art.author_name}</span> (ORCID: {art.orcid})</p>
                      <p className="text-[11px] font-mono text-slate-500 truncate max-w-xl">SHA-256: {art.sha256_hash}</p>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <button
                        onClick={() => openPdfViewer(art.registration_code)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold px-3.5 py-2.5 rounded-xl transition flex-1 md:flex-none text-center"
                      >
                        {t.viewPdf}
                      </button>
                      <button
                        onClick={() => openCertificate(art.registration_code)}
                        className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-900/40 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition flex-1 md:flex-none text-center"
                      >
                        {t.certBtn}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 2. ВКЛАДКА: НАУЧНЫЙ ОЦЕНЩИК ГИПОТЕЗЫ (%) ВМЕСТО СТАРОГО КАЛЬКУЛЯТОРА */}
        {activeTab === "scorer" && (
          <section className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-200">{t.scoreTitle}</h2>
              <p className="text-xs text-slate-400">Система сопоставляет структуру гипотезы с патентными базами и формулами перед коммитом</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Тема или рабочая гипотеза</label>
                <input
                  value={hypoTitle}
                  onChange={(e) => setHypoTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-sm mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Формулы, переменные или клинические данные</label>
                <textarea
                  rows={4}
                  value={hypoText}
                  onChange={(e) => setHypoText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-3 text-sm mt-1 font-mono"
                />
              </div>

              <div className="flex gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={hasFormula} onChange={(e) => setHasFormula(e.target.checked)} />
                  <span>Содержит математические уравнения</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={hasClinical} onChange={(e) => setHasClinical(e.target.checked)} />
                  <span>Присутствует клиническая выборка</span>
                </label>
              </div>

              <button
                onClick={handleScoreHypothesis}
                disabled={scoring}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition"
              >
                {scoring ? "Анализ по базам..." : t.scoreBtn}
              </button>
            </div>

            {scoreResult && (
              <div className="bg-slate-950 p-5 rounded-2xl border border-indigo-900/60 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-200">{t.overallPass}</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">{scoreResult.overall_pass_rate}%</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <p className="text-slate-400">{t.noveltyScore}</p>
                    <p className="text-lg font-bold text-emerald-400">{scoreResult.metrics?.novelty_score}%</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <p className="text-slate-400">{t.defenseScore}</p>
                    <p className="text-lg font-bold text-sky-400">{scoreResult.metrics?.prior_art_defense}%</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <p className="text-slate-400">{t.replicability}</p>
                    <p className="text-lg font-bold text-amber-400">{scoreResult.metrics?.replicability_index}%</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <p className="text-slate-400">Rigorous Proof</p>
                    <p className="text-lg font-bold text-indigo-400">{scoreResult.metrics?.mathematical_rigor}%</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 bg-slate-900 p-3 rounded-xl border-l-4 border-emerald-500">
                  {scoreResult.recommendation}
                </p>
              </div>
            )}
          </section>
        )}

        {/* 3. ВКЛАДКА: ЗАГРУЗКА PDF */}
        {activeTab === "upload" && (
          <section className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-200">{t.uploadTitle}</h2>
            <form onSubmit={handleUploadPDF} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400">{t.paperTitle}</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-sm mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">{t.authorName}</label>
                  <input
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-sm mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">ORCID iD</label>
                  <input
                    value={orcidInput}
                    onChange={(e) => setOrcidInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-sm mt-1 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">{t.categoryLabel}</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-sm mt-1"
                  >
                    {CATEGORIES.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">{t.selectPdf}</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-3 text-sm mt-1"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 rounded-xl text-sm transition shadow-lg shadow-emerald-500/20"
              >
                {uploading ? "Вычисление SHA-256 и нотариат..." : t.submitBtn}
              </button>
            </form>

            {uploadResult && (
              <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900 text-xs font-mono text-emerald-300 space-y-1">
                <p className="font-bold text-slate-100 text-sm">✅ {uploadResult.certificate_title}</p>
                <p>Регистрационный код: <span className="text-emerald-400 font-bold">{uploadResult.registration_code}</span></p>
                <p className="break-all">Реальный SHA-256: {uploadResult.sha256_payload_hash}</p>
                <p className="break-all">Git Commit: {uploadResult.git_commit_hash}</p>
              </div>
            )}
          </section>
        )}

        {/* 4. ВКЛАДКА: FAIR-SHARE БИЛЛИНГ */}
        {activeTab === "billing" && (
          <section className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-200">Автоматический консенсус распределения (70% / 20% / 10%)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-400">Сумма</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Валюта</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-sm mt-1"
                >
                  <option value="USDT">USDT</option>
                  <option value="USD">USD</option>
                  <option value="KZT">KZT (₸)</option>
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={handlePay} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-2.5 rounded-xl text-sm transition">
                  Провести платеж в Ledger
                </button>
              </div>
            </div>

            {payResult && (
              <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900 text-xs font-mono text-emerald-300 space-y-1">
                <p className="font-bold text-slate-100">{payResult.status}</p>
                <p>💰 Автору (70%): <span className="font-bold text-emerald-400">{payResult.split?.author_70_percent} {payResult.currency}</span></p>
                <p>🏛️ Фонд инфраструктуры (20%): <span className="font-bold text-slate-300">{payResult.split?.infrastructure_20_percent} {payResult.currency}</span></p>
                <p>👑 Создателю сети (10%): <span className="font-bold text-amber-400">{payResult.split?.founder_10_percent} {payResult.currency}</span></p>
              </div>
            )}
          </section>
        )}

        {/* МОДАЛЬНОЕ ОКНО: ВСТРОЕННЫЙ PDF READER */}
        {pdfViewingUrl && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-2 md:p-6 z-50">
            <div className="bg-slate-900 w-full max-w-5xl h-[85vh] rounded-2xl border border-slate-800 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-200">Просмотр научной статьи (PDF Reader)</span>
                <button onClick={() => setPdfViewingUrl(null)} className="text-slate-400 hover:text-white font-bold text-lg">✕</button>
              </div>
              <div className="flex-1 bg-slate-950">
                <iframe src={pdfViewingUrl} className="w-full h-full border-none" />
              </div>
            </div>
          </div>
        )}

        {/* МОДАЛЬНОЕ ОКНО: СЕРТИФИКАТ ПРИОРИТЕТА */}
        {selectedCert && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-white text-slate-900 max-w-2xl w-full p-6 md:p-8 rounded-2xl border-4 border-slate-900 shadow-2xl relative space-y-4">
              <button onClick={() => setSelectedCert(null)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 font-bold text-lg">✕</button>
              <div className="border-b-2 border-slate-900 pb-3">
                <h3 className="text-xl font-black uppercase tracking-wider text-slate-900">GITSCIENCE™ SOVEREIGN NOTARY</h3>
                <p className="text-xs text-amber-800 font-bold uppercase">Official Certificate of Scientific Priority</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 space-y-2 text-xs">
                <p><span className="font-bold text-slate-700">Сертификат:</span> <span className="font-mono font-bold text-slate-900 text-sm">{selectedCert.certificate_number}</span></p>
                <p><span className="font-bold text-slate-700">Регистрационный код:</span> <span className="font-mono font-bold text-slate-900">{selectedCert.registration_code}</span></p>
                <p><span className="font-bold text-slate-700">Манускрипт:</span> <span className="font-semibold">{selectedCert.title}</span></p>
                <p><span className="font-bold text-slate-700">Автор / Изобретатель:</span> {selectedCert.author}</p>
                <p><span className="font-bold text-slate-700">ORCID iD:</span> <span className="font-mono">{selectedCert.orcid}</span></p>
                <p><span className="font-bold text-slate-700">Дата фиксации (UTC):</span> {selectedCert.timestamp_utc}</p>
              </div>
              <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] space-y-1">
                <p className="text-amber-300 break-all">SHA-256: {selectedCert.sha256_digest}</p>
                <p className="text-emerald-400 break-all">Git Commit: {selectedCert.git_commit_oid}</p>
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={() => window.print()} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-xl text-xs">
                  Распечатать / Сохранить в PDF 🖨️
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}