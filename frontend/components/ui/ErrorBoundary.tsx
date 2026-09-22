"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  resetKey?: string | number;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * ErrorBoundary — ловит исключения рендера внутри таб-панелей.
 * Ошибка в одном табе не роняет всё приложение (белый экран):
 * показывается fallback с кнопкой перезагрузки. Смена resetKey
 * (в page.tsx — activeTab) сбрасывает состояние после падения.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[GitScience] Tab panel crashed:", error, info.componentStack);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="p-8 text-center space-y-3 border border-[var(--surface-border)] bg-black/40">
          <span className="material-symbols-outlined text-4xl text-[var(--warn)]" aria-hidden>
            error
          </span>
          <div className="font-display font-bold uppercase tracking-tight text-[var(--foreground)]">
            Panel Error
          </div>
          <div className="text-xs text-[var(--text-mid)]">
            An unexpected error occurred in this module.
          </div>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 text-xs font-bold uppercase border border-[var(--surface-border)] bg-[var(--surface-hi)] text-[var(--foreground)]"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}