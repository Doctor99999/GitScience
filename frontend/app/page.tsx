"use client";

import { useState, useEffect } from "react";

export default function GitScienceDashboard() {
  const [title, setTitle] = useState("Клиническая оценка риска коронарных осложнений");
  const [content, setContent] = useState("# Клиническая модель\nBaseRisk = 14.5\nRisk_Score = BaseRisk * 1.85");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Состояние биллинга
  const [payAmount, setPayAmount] = useState(100);
  const [payResult, setPayResult] = useState<any>(null);

  // Состояние ORCID и Web3 кошелька
  const [orcidUser, setOrcidUser] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Состояние калькулятора
  const [calcParams, setCalcParams] = useState<{ [key: string]: number }>({ BaseRisk: 14.5 });
  const [calcResults, setCalcResults] = useState<any>(null);

  const API_URL = "https://gitscience-api.onrender.com";
  
  // ⚠️ ВСТАВЬ СВОЙ НАСТОЯЩИЙ CLIENT ID ИЗ ЭТАПА 1 НИЖЕ ⚠️
  const ORCID_CLIENT_ID = "APP-7KHX9DAL2RMVUVFR"; 
  const REDIRECT_URI = "https://doctor99999.github.io/GitScience/";

  // Проверяем, вернулся ли пользователь от ORCID с кодом авторизации
  useEffect(() => {
    if (typeof window !== "undefined") {
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
      if (data.status === "success") {
        setOrcidUser({ id: data.orcid, name: data.name });
        window.history.replaceState({}, document.title, "/GitScience/");
      }
    } catch (error) {
      console.error("Ошибка при верификации ORCID:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginOrcid = () => {
    const orcidAuthUrl = `https://orcid.org/oauth/authorize?client_id=${ORCID_CLIENT_ID}&response_type=code&scope=/authenticate&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    window.location.href = orcidAuthUrl;
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
          currency: "USDT",
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
                className="bg-[#A6CE39] hover:bg-[#8eb030] text-black font-bold py-2 px-4 rounded-lg text-sm transition shadow-md flex items-center gap-2"
              >
                <span>🆔</span> Войти через ORCID iD
              </button>
            ) : (
              <div className="bg-slate-900 border border-[#A6CE39]/50 px-3 py-1.5 rounded-lg text-xs font-mono text-[#A6CE39]">
                ✅ {orcidUser.name || "Ученый"} ({orcidUser.id})
              </div>
            )}

            {/* КНОПКА WEBW3 */}
            <button
              onClick={handleConnectWallet}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium py-2 px-4 rounded-lg text-sm transition"
            >
              {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "🔌 Подключить Web3"}
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

        {/* АТОМАРНЫЙ БИЛЛИНГ FAIR-SHARE */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
            <span>💳</span> Биллинг Fair-Share (Распределение 95% / 5%)
          </h2>

          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(Number(e.target.value))}
              placeholder="Сумма (USDT)"
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
            />
            <button
              onClick={handlePayFairShare}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition shadow-lg"
            >
              Симулировать B2B-оплату вызова API
            </button>
          </div>

          {payResult && (
            <div className="bg-slate-950 p-4 rounded-xl border border-indigo-900/50 font-mono text-xs text-indigo-300 space-y-1">
              <p className="font-bold text-slate-200 mb-1">{payResult.status}</p>
              <p>💰 Автору (95%): <span className="font-bold text-emerald-400">{payResult.split.author_share_95} {payResult.currency}</span></p>
              <p>🏛️ Платформе (5%): <span className="font-bold text-slate-400">{payResult.split.platform_fee_5} {payResult.currency}</span></p>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}