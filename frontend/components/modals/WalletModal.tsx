"use client";

import React from "react";
import type { TranslationDict } from "../../lib/translations";

interface WalletModalProps {
  show: boolean;
  onClose: () => void;
  t: TranslationDict;
  walletConnected: boolean;
  walletAddress: string | null;
  walletBalance: number;
  walletRoyalties: number;
  walletNetwork: string;
  walletConnecting: boolean;
  onConnect: (type: "metamask" | "founder" | "custom") => void;
  onDisconnect: () => void;
}

export default function WalletModal({
  show,
  onClose,
  t,
  walletConnected,
  walletAddress,
  walletBalance,
  walletRoyalties,
  walletNetwork,
  walletConnecting,
  onConnect,
  onDisconnect,
}: WalletModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0e1726] border border-amber-500/40 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-5 sm:p-7 space-y-5">
        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>🦊</span> {t.connectWalletTitle}
            </h3>
            <p className="text-xs text-amber-300/80 mt-0.5">
              {t.connectWalletSub}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 text-lg font-bold p-1"
          >
            ✕
          </button>
        </div>

        {walletConnected && walletAddress ? (
          <div className="space-y-4 text-xs font-mono">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">{t.walletAddressLabel}</span>
                <strong className="text-cyan-300 text-xs break-all">{walletAddress}</strong>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">{t.walletBalanceLabel}</span>
                  <strong className="text-emerald-400 text-base font-bold">${walletBalance.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Amanat 30% / 55%</span>
                  <strong className="text-purple-400 text-base font-bold">${walletRoyalties.toLocaleString()}</strong>
                </div>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">{t.walletNetworkLabel}</span>
                <span className="text-slate-300 text-xs">{walletNetwork}</span>
              </div>
            </div>

            <button
              onClick={onDisconnect}
              className="w-full bg-red-950/40 hover:bg-red-900/40 border border-red-500/40 text-red-300 font-bold py-2.5 rounded-xl transition text-xs"
            >
              {t.disconnectWalletBtn}
            </button>
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            <button
              onClick={() => onConnect("metamask")}
              disabled={walletConnecting}
              className="w-full p-3.5 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 rounded-2xl flex items-center justify-between transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🦊</span>
                <div className="text-left">
                  <strong className="text-slate-100 block text-xs">MetaMask / Browser Web3</strong>
                  <span className="text-[10px] text-slate-400">Polygon PoS & Base Mainnet</span>
                </div>
              </div>
              <span className="text-xs text-amber-300 font-mono font-bold">Қосылу →</span>
            </button>

            <button
              onClick={() => onConnect("founder")}
              disabled={walletConnecting}
              className="w-full p-3.5 bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 rounded-2xl flex items-center justify-between transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div className="text-left">
                  <strong className="text-cyan-300 block text-xs">Founder Treasury Node</strong>
                  <span className="text-[10px] text-slate-400">Salauat Yeshimov Protocol Wallet</span>
                </div>
              </div>
              <span className="text-xs text-cyan-300 font-mono font-bold">12,500 USDT →</span>
            </button>

            <button
              onClick={() => onConnect("custom")}
              disabled={walletConnecting}
              className="w-full p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-between transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🛡️</span>
                <div className="text-left">
                  <strong className="text-slate-200 block text-xs">Independent Scholar Node</strong>
                  <span className="text-[10px] text-slate-400">Sovereign In-Browser Keystore</span>
                </div>
              </div>
              <span className="text-xs text-slate-300 font-mono font-bold">5,000 USDT →</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
