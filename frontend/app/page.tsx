"use client";

import { useState, useEffect } from "react";

export default function GitScienceDashboard() {
  const [title, setTitle] = useState("Клиническая оценка риска коронарных осложнений");
  const [content, setContent] = useState("# Клиническая модель\nBaseRisk = 14.5\nRisk_Score = BaseRisk * 1.85");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Состояние биллинга и выбора валюты
  const [payAmount, setPayAmount] = useState(100);
  const [selectedCurrency, setSelectedCurrency] = useState("USDT");
  const [payResult, setPayResult] = useState<any>(null);

  // Состояние ORCID и Web3 кошелька
  const [orcidUser, setOrcidUser] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Состояние калькулятора
  const [calcParams, setCalcParams] = useState<{ [key: string]: number }>({ BaseRisk: 14.5 });
  const [calcResults, setCalcResults] = useState<any>(null);

  const API_URL = "https://gitscience-api.onrender.com";
  
  // Твой реальный Client ID из ORCID уже зафиксирован здесь
  const ORCID_CLIENT_ID = "APP-7KHX9DAL2RMVUVFR"; 
  const REDIRECT_URI = "https://doctor99999.github.io/GitScience/";

  // При загрузке страницы: загружаем сохраненный ORCID из localStorage или ловим code из URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("gitscience_orcid_user");
      if (savedUser) {
        try {
          setOrcidUser(JSON.parse(savedUser));
        } catch (e) {
          localStorage.removeItem("gitscience_orcid_user");
        }
      }

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      
      if (code) {
        verifyOrcidCode(code);
      }
    }
  }, []);

  const verifyOrcidCode = async (code: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/v1/auth/orcid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code, redirect_uri: REDIRECT_URI }),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        const userData = {
          id: data.orcid,
          name: data.name || `Ученый (${data.orcid})`,
        };
        
        setOrcidUser(userData);
        localStorage.setItem("gitscience_orcid_user", JSON.stringify(userData));
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        alert(`Ошибка авторизации ORCID: ${data.detail || JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error("Ошибка при верификации ORCID:", error);
      alert("Не удалось связаться с сервером. Возможно, сервис на Render просыпается.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginOrcid = () => {
    const orcidAuthUrl = `https://orcid.org/oauth/authorize?client_id=${ORCID_CLIENT_ID}&response_type=code&scope=/authenticate&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    window.location.href = orcidAuthUrl;
  };

  const handleLogoutOrcid = () => {
    setOrcidUser(null);
    localStorage.removeItem("gitscience_orcid_user");
  };

  const handleConnectWallet = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
        setWalletAddress(accounts[0]);
      } catch (err) {
        alert("Ошибка подключения MetaMask");
      }
    } else {
      alert("Установите Web3-кошелек MetaMask");
    }
  };

  const handleCommit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/science/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          orcid: orcidUser ? orcidUser.id : "0009-0003-3929-3605",
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      alert("Ошибка отправки коммита на сервер");
    } finally {
      setLoading(false);
    }
  };

  const handleRunCalculation = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/science/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ params: calcParams }),
      });
      const data = await res.json();
      if (data.results) {
        setCalcResults(data.results);
      }
    } catch (e) {
      alert("Ошибка при расчете модели");
    }
  };

  const handlePayFairShare = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/billing/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: payAmount,
          currency: selectedCurrency,
          author_wallet: walletAddress || "0x0000000000000000000000000000000000000000",
        }),
      });
      const data = await res.json();
      setPayResult(data);
    } catch (e) {
      alert("Ошибка обработки платежа");
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* ХЕДЕР ПЛАТФОРМЫ */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
              GitScience™ Engine
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Суверенная децентрализованная научная экосистема (Prior Art & AST Compiler)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* КНОПКА ORCID */}
            {!orcidUser ? (
              <button
                onClick={handleLoginOrcid}
                disabled={loading}
                className="bg-[#A6CE39] hover:bg-[#8eb030] text-black font-bold py-2 px-4 rounded-lg text-sm transition shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                <span>🆔</span> {loading ? "Авторизация..." : "Войти через ORCID iD"}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="bg-slate-900 border border-[#A6CE39]/50 px-3 py-1.5 rounded-lg text-xs font-mono text-[#A6CE39]">
                  ✅ {orcidUser.name} ({orcidUser.id})
                </div>
                <button
                  onClick={handleLogoutOrcid}
                  title="Выйти из ORCID"
                  className="bg-slate-800 hover:bg-rose-900/50 border border-slate-700 text-slate-400 hover:text-rose-300 py-1.5 px-2 rounded-lg text-xs transition"
                >
                  🚪
                </button>
              </div>
            )}

            {/* КНОПКА ПОДКЛЮЧЕНИЯ КОШЕЛЬКА */}
            <button
              onClick={handleConnectWallet}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium py-2 px-4 rounded-lg text-sm transition flex items-center gap-2"
            >
              <span>💳</span>
              {walletAddress 
                ? `${selectedCurrency}: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` 
                : "Подключить кошелек"}
            </button>
          </div>
        </header>

        {/* ПУЛЬТ СОЗДАНИЯ И ЗАПЕЧАТЫВАНИЯ */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
            <span>📝</span> Новый научный труд или модель
          </h2>

          <div className="space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название проекта / гипотезы"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition"
            />

            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Текст исследования и формулы (например: Risk = Base * 1.85)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm font-mono focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <button
            onClick={handleCommit}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-emerald-900/20 text-sm disabled:opacity-50"
          >
            {loading ? "Запечатывание в блокчейне..." : "🛡️ Зафиксировать авторство (Commit & Prior Art Shield)"}
          </button>

          {result && (
            <div className="bg-slate-950 border border-emerald-900/50 p-4 rounded-xl text-xs font-mono space-y-2 text-emerald-400">
              <p className="font-bold text-slate-200">{result.status}</p>
              <p><span className="text-slate-500">SHA-256 Shield:</span> {result.sha256_prior_art_shield}</p>
              <p><span className="text-slate-500">Сертификат:</span> {result.ots_proof_file}</p>
              <p><span className="text-slate-500">Автор (ORCID):</span> {result.orcid_author}</p>
            </div>
          )}
        </section>

        {/* ИНТЕРАКТИВНЫЙ AST КАЛЬКУЛЯТОР */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
            <span>⚡</span> Выполнение скомпилированной AST-модели
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <label className="text-xs text-slate-400 block font-medium">BaseRisk (Базовый показатель)</label>
              <input
                type="number"
                value={calcParams.BaseRisk || 14.5}
                onChange={(e) => setCalcParams({ ...calcParams, BaseRisk: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>

            <div className="flex items-end md:col-span-2">
              <button
                onClick={handleRunCalculation}
                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-xl text-sm transition shadow-lg"
              >
                Рассчитать модель на сервере ➔
              </button>
            </div>
          </div>

          {calcResults && (
            <div className="bg-slate-950 p-4 rounded-xl border border-teal-900/50 font-mono text-xs text-teal-400 space-y-1">
              <p className="font-bold text-slate-300 mb-2">Результаты вычислений:</p>
              {Object.entries(calcResults).map(([k, v]: [string, any]) => (
                <div key={k} className="flex justify-between border-b border-slate-900 py-1">
                  <span>{k}:</span>
                  <span className="font-bold text-slate-100">{v}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* АТОМАРНЫЙ БИЛЛИНГ FAIR-SHARE С ВЫБОРОМ ВАЛЮТЫ */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
            <span>💳</span> Биллинг Fair-Share (Распределение 70% / 30%)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Ввод суммы */}
            <div className="md:col-span-2">
              <label className="text-xs text-slate-400 block mb-1">Сумма платежа</label>
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                placeholder="Сумма"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              />
            </div>

            {/* Выбор валюты кошелька */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Валюта кошелька</label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              >
                <option value="USDT">USDT (Tether)</option>
                <option value="ETH">ETH (Ethereum)</option>
                <option value="USD">USD ($)</option>
                <option value="KZT">KZT (₸)</option>
              </select>
            </div>

            {/* Кнопка симуляции */}
            <div className="flex items-end">
              <button
                onClick={handlePayFairShare}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition shadow-lg"
              >
                Оплатить API
              </button>
            </div>
          </div>

          {payResult && (
            <div className="bg-slate-950 p-4 rounded-xl border border-indigo-900/50 font-mono text-xs text-indigo-300 space-y-1">
              <p className="font-bold text-slate-200 mb-1">{payResult.status}</p>
              <p>💰 Автору (70%): <span className="font-bold text-emerald-400">{payResult.split?.author_share_70} {payResult.currency}</span></p>
              <p>🏛️ Платформе (30%): <span className="font-bold text-slate-400">{payResult.split?.platform_fee_30} {payResult.currency}</span></p>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}