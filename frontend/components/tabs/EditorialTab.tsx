"use client";

import React, { useState } from "react";
import type { TranslationDict } from "../../lib/translations";

interface EditorialTabProps {
  t: TranslationDict;
  apiBase: string;
  token?: string | null;
}

type EditorialView = "submit" | "pipeline" | "analytics" | "ai-screen";

interface SubmissionDraft {
  title: string;
  abstract: string;
  authors: string;
  keywords: string;
  category: string;
}

export default function EditorialTab({ t, apiBase, token }: EditorialTabProps) {
  const [view, setView] = useState<EditorialView>("submit");
  const [draft, setDraft] = useState<SubmissionDraft>({
    title: "",
    abstract: "",
    authors: "",
    keywords: "",
    category: "research-article",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);
  const [pipeline, setPipeline] = useState<Record<string, unknown[]> | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [screenTarget, setScreenTarget] = useState("");
  const [screenResult, setScreenResult] = useState<Record<string, unknown> | null>(null);
  const [screenLoading, setScreenLoading] = useState(false);

  const handleSubmit = async () => {
    if (!draft.title || !draft.abstract) return;
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const res = await fetch(`${apiBase}/api/v1/editorial/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: draft.title,
          abstract: draft.abstract,
          authors: draft.authors.split(",").map((a) => ({ name: a.trim() })),
          keywords: draft.keywords.split(",").map((k) => k.trim()),
          category: draft.category,
        }),
      });
      const data = await res.json();
      setSubmitResult(
        data.submission_code
          ? `Manuscript submitted: ${data.submission_code}`
          : `Error: ${data.detail || "Unknown error"}`
      );
    } catch {
      setSubmitResult("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const loadPipeline = async () => {
    setPipelineLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/editorial/analytics/pipeline`);
      const data = await res.json();
      setPipeline(data.pipeline);
    } catch {
      setPipeline(null);
    } finally {
      setPipelineLoading(false);
    }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/editorial/analytics/dashboard`);
      const data = await res.json();
      setAnalytics(data);
    } catch {
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleAIScreen = async () => {
    if (!screenTarget) return;
    setScreenLoading(true);
    setScreenResult(null);
    try {
      const res = await fetch(`${apiBase}/api/v1/editorial/ai-screen/${screenTarget}`);
      const data = await res.json();
      setScreenResult(data);
    } catch {
      setScreenResult({ error: "Network error" });
    } finally {
      setScreenLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex gap-2 flex-wrap">
        {(["submit", "pipeline", "analytics", "ai-screen"] as EditorialView[]).map((v) => (
          <button
            key={v}
            onClick={() => {
              setView(v);
              if (v === "pipeline" && !pipeline) loadPipeline();
              if (v === "analytics" && !analytics) loadAnalytics();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              view === v
                ? "bg-emerald-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {v === "submit" && "Submit Manuscript"}
            {v === "pipeline" && "Pipeline"}
            {v === "analytics" && "Analytics"}
            {v === "ai-screen" && "AI Screen"}
          </button>
        ))}
      </div>

      {/* SUBMIT VIEW */}
      {view === "submit" && (
        <div className="bg-[#0e1726] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl space-y-5">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg sm:text-2xl font-bold text-slate-100">
              Submit Manuscript
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Submit a new manuscript for peer review
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block text-slate-400 font-semibold mb-1">Title *</label>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Manuscript title"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-400 font-semibold mb-1">Abstract *</label>
              <textarea
                rows={4}
                value={draft.abstract}
                onChange={(e) => setDraft({ ...draft, abstract: e.target.value })}
                placeholder="Structured abstract (Background, Methods, Results, Conclusions)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Authors (comma-separated)</label>
              <input
                type="text"
                value={draft.authors}
                onChange={(e) => setDraft({ ...draft, authors: e.target.value })}
                placeholder="Dr. Smith, Prof. Jones"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Keywords (comma-separated)</label>
              <input
                type="text"
                value={draft.keywords}
                onChange={(e) => setDraft({ ...draft, keywords: e.target.value })}
                placeholder="blockchain, peer review, open science"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Category</label>
              <select
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
              >
                <option value="research-article">Research Article</option>
                <option value="review">Review Article</option>
                <option value="short-communication">Short Communication</option>
                <option value="case-report">Case Report</option>
                <option value="editorial">Editorial</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || !draft.title || !draft.abstract}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-xl font-mono text-sm transition"
          >
            {submitting ? "Submitting..." : "Submit for Peer Review"}
          </button>

          {submitResult && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl font-mono text-xs text-emerald-300">
              {submitResult}
            </div>
          )}
        </div>
      )}

      {/* PIPELINE VIEW */}
      {view === "pipeline" && (
        <div className="bg-[#0e1726] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl space-y-5">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg sm:text-2xl font-bold text-slate-100">Editorial Pipeline</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Overview of all manuscripts by status
            </p>
          </div>

          {pipelineLoading ? (
            <div className="text-center text-slate-500 py-8">Loading pipeline...</div>
          ) : pipeline ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(pipeline).map(([status, items]) => (
                <div
                  key={status}
                  className="p-4 bg-slate-900 rounded-xl border border-slate-800"
                >
                  <div className="text-xs font-bold text-slate-400 uppercase mb-2">
                    {status.replace(/_/g, " ")}
                  </div>
                  <div className="text-2xl font-mono font-bold text-white">
                    {(items as unknown[]).length}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-500 py-8">
              Click load to view pipeline
            </div>
          )}

          <button
            onClick={loadPipeline}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-xl text-xs transition"
          >
            Refresh Pipeline
          </button>
        </div>
      )}

      {/* ANALYTICS VIEW */}
      {view === "analytics" && (
        <div className="bg-[#0e1726] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl space-y-5">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg sm:text-2xl font-bold text-slate-100">
              Editorial Analytics
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Performance metrics and statistics
            </p>
          </div>

          {analyticsLoading ? (
            <div className="text-center text-slate-500 py-8">Loading analytics...</div>
          ) : analytics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Total Submissions</div>
                  <div className="text-2xl font-mono font-bold text-white">
                    {(analytics.overview as Record<string, unknown>)?.total_submissions as number ?? 0}
                  </div>
                </div>
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Published</div>
                  <div className="text-2xl font-mono font-bold text-emerald-400">
                    {(analytics.overview as Record<string, unknown>)?.published as number ?? 0}
                  </div>
                </div>
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Acceptance Rate</div>
                  <div className="text-2xl font-mono font-bold text-cyan-400">
                    {String(analytics.acceptance_rate ?? 0)}%
                  </div>
                </div>
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Avg Days to Decision</div>
                  <div className="text-2xl font-mono font-bold text-amber-400">
                    {(analytics.timing as Record<string, unknown>)?.avg_days_to_decision as number ?? 0}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 py-8">
              Click load to view analytics
            </div>
          )}

          <button
            onClick={loadAnalytics}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-xl text-xs transition"
          >
            Refresh Analytics
          </button>
        </div>
      )}

      {/* AI SCREEN VIEW */}
      {view === "ai-screen" && (
        <div className="bg-[#0e1726] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl space-y-5">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg sm:text-2xl font-bold text-slate-100">
              AI Manuscript Screening
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Automated quality check for submissions
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={screenTarget}
              onChange={(e) => setScreenTarget(e.target.value)}
              placeholder="Submission code (e.g. GS-2026-00001)"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono text-cyan-300 focus:border-emerald-500 outline-none"
            />
            <button
              onClick={handleAIScreen}
              disabled={screenLoading || !screenTarget}
              className="px-6 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs transition"
            >
              {screenLoading ? "Screening..." : "AI Screen"}
            </button>
          </div>

          {screenResult && (
            <div className="p-4 bg-slate-950/40 border border-cyan-500/30 rounded-xl font-mono text-[11px] space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Score:</span>
                <span className="text-white font-bold text-lg">
                  {(screenResult as Record<string, unknown>).overall_score as number}
                </span>
                <span className="text-slate-400">/10</span>
                <span
                  className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                    (screenResult as Record<string, unknown>).recommendation === "APPROVE_FOR_REVIEW"
                      ? "bg-emerald-900 text-emerald-300"
                      : (screenResult as Record<string, unknown>).recommendation === "REVIEW_WITH_CAUTION"
                      ? "bg-amber-900 text-amber-300"
                      : "bg-red-900 text-red-300"
                  }`}
                >
                  {(screenResult as Record<string, unknown>).recommendation as string}
                </span>
              </div>

              {!!(screenResult as Record<string, unknown>).quality_scores && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {Object.entries(
                    (screenResult as Record<string, unknown>).quality_scores as Record<string, number>
                  ).map(([k, v]) => (
                    <div key={k} className="p-2 bg-slate-900 rounded">
                      <div className="text-[10px] text-slate-500 capitalize">{k}</div>
                      <div className="text-xs font-bold text-white">{Math.round(v * 100)}%</div>
                    </div>
                  ))}
                </div>
              )}

              {!!(screenResult as Record<string, unknown>).red_flags &&
                ((screenResult as Record<string, unknown>).red_flags as unknown[]).length > 0 && (
                <div className="p-2 bg-red-950/40 border border-red-500/30 rounded">
                  <div className="text-red-400 font-bold text-[10px]">
                    Red Flags: {String((screenResult as Record<string, unknown>).red_flag_count)}
                  </div>
                </div>
              )}

              {!!(screenResult as Record<string, unknown>).suggestions &&
                ((screenResult as Record<string, unknown>).suggestions as string[]).length > 0 && (
                <div className="space-y-1">
                  <div className="text-slate-400 text-[10px] font-bold">Suggestions:</div>
                  {((screenResult as Record<string, unknown>).suggestions as string[]).map((s: string, i: number) => (
                    <div key={i} className="text-slate-300 text-[10px]">- {s}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
