"use client";

import { useState } from "react";

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

  // Состояние интерактивного калькулятора
  const [calcParams, setCalcParams] = useState<{ [key: string]: number }>({ BaseRisk: 14.5 });
  const [calcResults, setCalcResults] = useState<any>(null);

  // URL бэкенда FastAPI (при локальном запуске или деплое ноды)
  const API_URL = "http://127.0.0.1:8000";

  const handleConnectWallet = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
        setWalletAddress(accounts[0]);
      } catch (err) {
        alert("Ошибка подключения кошелька.");
      }
    } else {
      alert("Web3 кошелек (MetaMask / Rabby) не обнаружен в браузере! Установите расширение.");
    }
  };

  const handleOrcidLogin = async () => {
    const mockCode = "orcid_auth_code_998877";
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/orcid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orcid_code: mockCode }),
      });
      const data = await response.json();
      setOrcidUser(data);
    } catch (err) {
      alert("Ошибка связи с сервером ORCID OAuth.");
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/manuscript/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, patient_secret_salt: "secure-salt-2026" }),
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      alert("Ошибка подключения к бэкенду FastAPI. Убедитесь, что сервер запущен!");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/billing/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(payAmount), dpid: result?.dpid || "dPID-2026-DEMO", has_parent_dependency: true }),
      });
      const data = await response.json();
      setPayResult(data);
    } catch (err) {
      alert("Ошибка проведения платежа.");
    }
  };

  const handleRunCalculation = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/calculator/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variables: calcParams }),
      });
      const data = await response.json();
      setCalcResults(data.results);
    } catch (err) {
      alert("Ошибка при выполнении расчетов.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Шапка */}
        <header className="border-b border-slate-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              GitScience™ Enterprise Console
            </h1>
            <p className="text-slate-400 text-sm mt-1">Децентрализованная экосистема науки, блокчейн-нотариата и Web3 роялти</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Виджет Web3 Кошелька */}
            {walletAddress ? (
              <div className="bg-blue-950/50 border border-blue-800 px-3 py-2 rounded-xl text-xs flex items-center gap-2 font-mono">
                <span>🦊</span>
                <span className="text-blue-300">{walletAddress.substring(0, 6)}...{walletAddress.substring(38)}</span>
              </div>
            ) : (
              <button 
                onClick={handleConnectWallet}
                className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition shadow-lg"
              >
                <span>🦊</span> Подключить кошелек
              </button>
            )}

            {/* Виджет авторизации ORCID */}
            {orcidUser ? (
              <div className="bg-emerald-950/50 border border-emerald-800 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
                <span>🟢</span>
                <div>
                  <p className="font-bold text-emerald-300">{orcidUser.name}</p>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleOrcidLogin}
                className="bg-[#A6CE39] hover:bg-[#95b832] text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition shadow-lg"
              >
                <span>🪪</span> Войти через ORCID iD
              </button>
            )}
          </div>
        </header>

        {/* Основная сетка */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Левая колонка: Публикация и Компиляция */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>📝</span> Публикация манускрипта
            </h2>
            
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Название статьи</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Markdown текст и формулы</label>
              <textarea 
                rows={6}
                value={content} 
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <button 
              onClick={handlePublish}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {loading ? "Компиляция и привязка к Биткоину..." : "🚀 Защитить, скомпилировать и отправить в Git"}
            </button>
          </div>

          {/* Правая колонка: Результаты и Нотариат */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                <span>🛡️</span> Криптографический паспорт (Prior Art)
              </h2>

              {result ? (
                <div className="space-y-3 text-sm font-mono bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="flex justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-500">dPID:</span>
                    <span className="text-emerald-400 font-bold">{result.dpid}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-500">Git SHA:</span>
                    <span className="text-blue-400">{result.git_commit_sha?.substring(0, 12)}...</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-2">
                    <span className="text-slate-500">Блокчейн (OTS):</span>
                    <span className="text-amber-400 truncate max-w-[200px]" title={result.ots_proof}>{result.ots_proof}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-sm">
                  Опубликуйте манускрипт слева, чтобы запечатать хэш в блокчейн.
                </div>
              )}
            </div>

            {/* Финансовый сплит-модуль */}
            <div className="border-t border-slate-800 pt-4 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-slate-300">
                <span>💳</span> Web3 Роялти (70% автору / L2 Polygon)
              </h3>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={payAmount} 
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-28 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
                <button 
                  onClick={handlePayment}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded-lg text-sm transition"
                >
                  Оплатить API (USDT)
                </button>
              </div>

              {payResult && (
                <div className="text-xs font-mono bg-emerald-950/30 border border-emerald-900/50 p-3 rounded-lg text-emerald-300">
                  <p>💰 Автору на кошелек: ${payResult.payout_details?.current_author_payout}</p>
                  <p>🏛️ Фонд платформы (30%): ${payResult.payout_details?.platform_fee_30pct}</p>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Интерактивный калькулятор формул (Auto-UI) */}
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>⚡</span> Интерактивный калькулятор модели (Auto-UI)
          </h2>
          <p className="text-xs text-slate-400">
            Изменяйте параметры модели, скомпилированной из статьи, для мгновенной клинической оценки.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="text-xs text-slate-400 block font-medium">BaseRisk (Базовый риск)</label>
              <input 
                type="number" 
                value={calcParams.BaseRisk || 14.5} 
                onChange={(e) => setCalcParams({ ...calcParams, BaseRisk: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-sm"
              />
            </div>
            
            <div className="flex items-end md:col-span-2">
              <button 
                onClick={handleRunCalculation}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg text-sm transition shadow-lg"
              >
                Рассчитать модель ➔
              </button>
            </div>
          </div>

          {calcResults && (
            <div className="mt-4 bg-slate-950 p-4 rounded-xl border border-emerald-900/50 font-mono text-sm text-emerald-400">
              <p className="font-bold mb-1 text-slate-300">Результаты вычислений:</p>
              {Object.entries(calcResults).map(([key, val]: [string, any]) => (
                <div key={key} className="flex justify-between border-b border-slate-900 py-1">
                  <span>{key}:</span>
                  <span className="font-bold">{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}