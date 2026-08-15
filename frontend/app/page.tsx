"use client";

import { useState, useEffect } from "react";

export default function GitScienceDashboard() {
  // --- НАВИГАЦИЯ ---
  const [activeTab, setActiveTab] = useState<"library" | "upload" | "calculator" | "billing">("library");

  // --- АВТОРИЗАЦИЯ: ORCID & METAMASK ---
  const [orcidUser, setOrcidUser] = useState<{ orcid: string; name: string } | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Конфигурация ORCID OAuth 2.0
  const ORCID_CLIENT_ID = "APP-7KHX9DAL2RMVUVFR";
  const REDIRECT_URI = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "https://doctor99999.github.io/GitScience/";

  // --- СОСТОЯНИЕ БИБЛИОТЕКИ ---
  const [articles, setArticles] = useState<any[]>([]);
  const [loadingLib, setLoadingLib] = useState(false);
  const [selectedCert, setSelectedCert] = useState<any>(null);

  // --- СОСТОЯНИЕ ЗАГРУЗКИ PDF ---
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [title, setTitle] = useState("Coupling of Neuro-Immuno-Oncological Axes & Tk Equation");
  const [authorName, setAuthorName] = useState("Salauat Abiltayevich Yeshimov");
  const [orcidInput, setOrcidInput] = useState("0009-0003-3929-3605");
  const [category, setCategory] = useState("Oncology / Neuro-Immune Medicine");
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  // --- СОСТОЯНИЕ AST КАЛЬКУЛЯТОРА ---
  const [calcParams, setCalcParams] = useState({ BaseRisk: 14.5, Artery: 5.0, Vein: 3.0, Lymph: 1.2 });
  const [calcResult, setCalcResult] = useState<any>(null);

  // --- СОСТОЯНИЕ FAIR-SHARE БИЛЛИНГА ---
  const [payAmount, setPayAmount] = useState(100);
  const [currency, setCurrency] = useState("USDT");
  const [payResult, setPayResult] = useState<any>(null);

  const API_URL = "https://gitscience-api.onrender.com";

  // 1. Проверка ORCID Callback в URL при загрузке страницы
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const orcid = urlParams.get("orcid");
      const name = urlParams.get("name");

      if (orcid) {
        const user = { orcid, name: name ? decodeURIComponent(name) : "Авторизованный Ученый" };
        setOrcidUser(user);
        setOrcidInput(orcid);
        if (name) setAuthorName(decodeURIComponent(name));
        localStorage.setItem("gitscience_orcid", JSON.stringify(user));
      } else {
        const savedUser = localStorage.getItem("gitscience_orcid");
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            setOrcidUser(parsed);
            setOrcidInput(parsed.orcid);
            if (parsed.name) setAuthorName(parsed.name);
          } catch (e) {}
        }
      }
    }
    fetchLibrary();
  }, []);

  // 2. Вход через ORCID OAuth
  const handleOrcidLogin = () => {
    const authUrl = `https://orcid.org/oauth/authorize?client_id=${ORCID_CLIENT_ID}&response_type=code&scope=/authenticate&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}`;
    window.location.href = authUrl;
  };

  const handleOrcidLogout = () => {
    setOrcidUser(null);
    localStorage.removeItem("gitscience_orcid");
  };

  // 3. Подключение MetaMask кошелька
  const connectWallet = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      } catch (err: any) {
        alert("Ошибка подключения кошелька: " + err.message);
      }
    } else {
      alert("MetaMask не обнаружен. Пожалуйста, установите расширение MetaMask.");
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
  };

  // 4. Загрузка каталога библиотеки
  const fetchLibrary = async () => {
    setLoadingLib(true);
    try {
      const res = await fetch(`${API_URL}/library`);
      const data = await res.json();
      if (data.articles) setArticles(data.articles);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLib(false);
    }
  };

  // 5. Загрузка и фиксация PDF
  const handleUploadPDF = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile) {
      alert("Пожалуйста, выберите файл PDF вашей статьи");
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
    formData.append("abstract", "Genesis-манускрипт модели нейро-иммуно-онкологии.");

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

  // 6. Получение сертификата
  const openCertificate = async (code: string) => {
    try {
      const res = await fetch(`${API_URL}/notary/certificate/${code}`);
      const data = await res.json();
      setSelectedCert(data);
    } catch (err) {
      alert("Не удалось загрузить данные сертификата");
    }
  };

  // 7. Расчет формулы через AST
  const handleCalculate = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/science/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ params: calcParams, doctor_attestation: true }),
      });
      const data = await res.json();
      setCalcResult(data);
    } catch (err: any) {
      alert("Ошибка расчета: " + err.message);
    }
  };

  // 8. Fair-Share платеж
  const handlePay = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/billing/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: payAmount,
          currency: currency,
          author_wallet: walletAddress || "0x71C...3929",
        }),
      });
      const data = await res.json();
      setPayResult(data);
    } catch (err: any) {
      alert("Ошибка биллинга: " + err.message);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* ВЕРХНЯЯ ПАНЕЛЬ: БРЕНД + ORCID + METAMASK */}
        <header className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black tracking-wider text-emerald-400">GITSCIENCE™</span>
              <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
                SOVEREIGN DE-SCI
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Децентрализованная библиотека, Prior Art нотариат и среда исполнения формул</p>
          </div>

          {/* БЛОК ИДЕНТИФИКАЦИИ (ORCID + WALLET) */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Кнопка ORCID */}
            {orcidUser ? (
              <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-700 px-3 py-1.5 rounded-xl text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-mono text-emerald-300 font-bold">{orcidUser.orcid}</span>
                <button onClick={handleOrcidLogout} className="text-slate-400 hover:text-red-400 ml-1 font-bold">✕</button>
              </div>
            ) : (
              <button
                onClick={handleOrcidLogin}
                className="bg-[#A6CE39] hover:bg-[#95ba31] text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition shadow-md"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 256 256">
                  <path d="M128,0A128,128,0,1,0,256,128,128,128,0,0,0,128,0ZM86.35,186.26H64.08V73.49H86.35ZM75.21,60.84a13.35,13.35,0,1,1,13.35-13.35A13.35,13.35,0,0,1,75.21,60.84Zm127.34,68.4c0,35.09-24.16,57-61.27,57H106.6V73.49h36.42C180.13,73.49,202.55,95.73,202.55,129.24Zm-22.77,0c0-23.77-13.79-37.89-38.5-37.89H128.87v75.78h12.41C166,167.13,179.78,153,179.78,129.24Z"/>
                </svg>
                Войти через ORCID
              </button>
            )}

            {/* Кнопка MetaMask */}
            {walletAddress ? (
              <div className="flex items-center gap-2 bg-indigo-950/80 border border-indigo-700 px-3 py-1.5 rounded-xl text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                <span className="text-indigo-200">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                <button onClick={disconnectWallet} className="text-slate-400 hover:text-red-400 ml-1 font-bold">✕</button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition shadow-md"
              >
                🦊 Подключить Кошелек
              </button>
            )}

          </div>
        </header>

        {/* НАВИГАЦИОННЫЕ ВКЛАДКИ */}
        <nav className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab("library")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === "library" ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" : "bg-slate-900 text-slate-400 hover:bg-slate-800"
            }`}
          >
            🏛️ Библиотека ({articles.length})
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === "upload" ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" : "bg-slate-900 text-slate-400 hover:bg-slate-800"
            }`}
          >
            📄 Загрузить PDF (Манускрипт №1)
          </button>
          <button
            onClick={() => setActiveTab("calculator")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === "calculator" ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" : "bg-slate-900 text-slate-400 hover:bg-slate-800"
            }`}
          >
            ⚡ AST Калькулятор (Tk Ratio)
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === "billing" ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" : "bg-slate-900 text-slate-400 hover:bg-slate-800"
            }`}
          >
            💳 Fair-Share (70 / 20 / 10)
          </button>
        </nav>

        {/* 1. ВКЛАДКА: БИБЛИОТЕКА */}
        {activeTab === "library" && (
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-200">Реестр защищенных исследований</h2>
              <button onClick={fetchLibrary} className="text-xs text-emerald-400 hover:underline">Обновить каталог ⟳</button>
            </div>

            {loadingLib ? (
              <p className="text-sm text-slate-500 font-mono">Чтение архивного реестра...</p>
            ) : articles.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-3">
                <p className="text-slate-300 font-medium">Реестр научных трудов чист и готов к первому коммиту.</p>
                <p className="text-xs text-slate-500">Авторизуйтесь через ORCID и загрузите PDF-файл, чтобы выпустить Сертификат Приоритета №1.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {articles.map((art) => (
                  <div key={art.serial_number} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
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
                    <button
                      onClick={() => openCertificate(art.registration_code)}
                      className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-900/40 text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap"
                    >
                      🛡️ Сертификат Приоритета
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 2. ВКЛАДКА: ЗАГРУЗКА PDF */}
        {activeTab === "upload" && (
          <section className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-200">Фиксация авторского первенства (Prior Art Shield)</h2>
            <form onSubmit={handleUploadPDF} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400">Название исследования</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-sm mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Автор / Изобретатель</label>
                  <input
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-sm mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">ORCID iD (Автозаполнение при входе)</label>
                  <input
                    value={orcidInput}
                    onChange={(e) => setOrcidInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-sm mt-1 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Категория</label>
                  <input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-sm mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Оригинальный PDF-файл статьи</label>
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
                {uploading ? "Вычисление SHA-256 и нотариат..." : "Зафиксировать в Архиве и Выпустить Сертификат №1 🛡️"}
              </button>
            </form>

            {uploadResult && (
              <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900 text-xs font-mono text-emerald-300 space-y-1">
                <p className="font-bold text-slate-100 text-sm">✅ {uploadResult.certificate_title}</p>
                <p>Регистрационный код: <span className="text-emerald-400 font-bold">{uploadResult.registration_code}</span></p>
                <p className="break-all">SHA-256: {uploadResult.sha256_payload_hash}</p>
                <p className="break-all">Git Commit: {uploadResult.git_commit_hash}</p>
                <p className="text-slate-400">{uploadResult.ots_status}</p>
              </div>
            )}
          </section>
        )}

        {/* 3. ВКЛАДКА: AST КАЛЬКУЛЯТОР */}
        {activeTab === "calculator" && (
          <section className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-200">Исполнение формулы автора через AST-компилятор</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-slate-400">BaseRisk</label>
                <input
                  type="number"
                  value={calcParams.BaseRisk}
                  onChange={(e) => setCalcParams({ ...calcParams, BaseRisk: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Artery (A)</label>
                <input
                  type="number"
                  value={calcParams.Artery}
                  onChange={(e) => setCalcParams({ ...calcParams, Artery: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Vein (V)</label>
                <input
                  type="number"
                  value={calcParams.Vein}
                  onChange={(e) => setCalcParams({ ...calcParams, Vein: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Lymph (L)</label>
                <input
                  type="number"
                  value={calcParams.Lymph}
                  onChange={(e) => setCalcParams({ ...calcParams, Lymph: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-sm mt-1"
                />
              </div>
            </div>

            <button
              onClick={handleCalculate}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition"
            >
              Выполнить расчет через AST
            </button>

            {calcResult && (
              <div className="bg-slate-950 p-4 rounded-xl border border-indigo-900 text-xs font-mono text-indigo-300 space-y-1">
                <p className="font-bold text-slate-100">{calcResult.status}</p>
                <p>Вычисленный Tk_Ratio: <span className="text-emerald-400 font-bold">{calcResult.results?.Tk_Ratio}</span></p>
                <p>Клинический Risk_Score: <span className="text-emerald-400 font-bold">{calcResult.results?.Risk_Score}</span></p>
                <p className="text-slate-400 mt-2">{calcResult.compliance?.note}</p>
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
                <label className="text-xs text-slate-400">Сумма платежа</label>
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
                <button
                  onClick={handlePay}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-2.5 rounded-xl text-sm transition"
                >
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
                <p className="text-slate-500 truncate">Получатель (Кошелек): {payResult.recipient_wallet}</p>
              </div>
            )}
          </section>
        )}

        {/* МОДАЛЬНОЕ ОКНО: СЕРТИФИКАТ ПРИОРИТЕТА */}
        {selectedCert && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-white text-slate-900 max-w-2xl w-full p-6 md:p-8 rounded-2xl border-4 border-slate-900 shadow-2xl relative space-y-4">
              <button
                onClick={() => setSelectedCert(null)}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 font-bold text-lg"
              >
                ✕
              </button>

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
                <p className="text-sky-400 font-bold">Честные Криптографические Доказательства:</p>
                <p className="text-amber-300 break-all">SHA-256: {selectedCert.sha256_digest}</p>
                <p className="text-emerald-400 break-all">Git Commit: {selectedCert.git_commit_oid}</p>
                <p className="text-slate-400">Статус: {selectedCert.legal_status}</p>
              </div>

              <p className="text-[11px] text-amber-900 bg-amber-50 p-3 rounded-lg border-l-4 border-amber-600 leading-relaxed">
                Настоящий сертификат фиксирует дату и точный хэш манускрипта до передачи в сторонние журналы. В соответствии с WIPO и 35 U.S.C. § 102 документ является неопровержимым доказательством известного уровня техники (Prior Art) и гарантирует авторское право создателя.
              </p>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => window.print()}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-xl text-xs"
                >
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