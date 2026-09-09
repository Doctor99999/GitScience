"use client";

import React, { useState } from "react";
import type { TranslationDict } from "../../lib/translations";

interface PreregistrationTabProps {
  t: TranslationDict;
  apiBase: string;
  token?: string | null;
}

type PreregView = "create" | "view";

export default function PreregistrationTab({
  t,
  apiBase,
  token,
}: PreregistrationTabProps) {
  const [view, setView] = useState<PreregView>("create");
  const [form, setForm] = useState({
    title: "",
    hypothesis: "",
    methods: "",
    analysis_plan: "",
    authors: "",
    orcid: "",
  });
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState<string | null>(null);

  const [viewTarget, setViewTarget] = useState("");
  const [preregData, setPreregData] = useState<Record<string, unknown> | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [registerResult, setRegisterResult] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!form.title || !form.hypothesis) return;
    setCreating(true);
    setCreateResult(null);
    try {
      const res = await fetch(`${apiBase}/api/v1/editorial/preregistration/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: form.title,
          hypothesis: form.hypothesis,
          methods: form.methods,
          analysis_plan: form.analysis_plan,
          authors: form.authors
            .split(",")
            .map((a) => ({ name: a.trim() })),
          corresponding_author_orcid: form.orcid,
        }),
      });
      const data = await res.json();
      setCreateResult(
        data.prereg_id
          ? `Created: ${data.prereg_id}`
          : `Error: ${data.detail || "Unknown error"}`
      );
    } catch {
      setCreateResult("Network error");
    } finally {
      setCreating(false);
    }
  };

  const handleView = async () => {
    if (!viewTarget) return;
    setViewLoading(true);
    setPreregData(null);
    setRegisterResult(null);
    try {
      const res = await fetch(`${apiBase}/api/v1/editorial/preregistration/${viewTarget}`);
      const data = await res.json();
      setPreregData(data);
    } catch {
      setPreregData(null);
    } finally {
      setViewLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!viewTarget) return;
    setViewLoading(true);
    setRegisterResult(null);
    try {
      const res = await fetch(
        `${apiBase}/api/v1/editorial/preregistration/register/${viewTarget}`,
        { method: "POST" }
      );
      const data = await res.json();
      setRegisterResult(data.registered_at ? "Registered!" : "Error");
      if (data.registered_at) handleView();
    } catch {
      setRegisterResult("Network error");
    } finally {
      setViewLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex gap-2">
        {(["create", "view"] as PreregView[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              view === v
                ? "bg-emerald-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {v === "create" && "Create Preregistration"}
            {v === "view" && "View / Register"}
          </button>
        ))}
      </div>

      {/* CREATE VIEW */}
      {view === "create" && (
        <div className="bg-[#0e1726] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl space-y-5">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg sm:text-2xl font-bold text-slate-100">
              Create Preregistration
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Lock your hypothesis and methods before data collection
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block text-slate-400 font-semibold mb-1">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Study title"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-400 font-semibold mb-1">
                Hypothesis / Research Question *
              </label>
              <textarea
                rows={3}
                value={form.hypothesis}
                onChange={(e) => setForm({ ...form, hypothesis: e.target.value })}
                placeholder="Primary hypothesis or research question"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-400 font-semibold mb-1">Methods</label>
              <textarea
                rows={3}
                value={form.methods}
                onChange={(e) => setForm({ ...form, methods: e.target.value })}
                placeholder="Planned methodology"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-400 font-semibold mb-1">Analysis Plan</label>
              <textarea
                rows={3}
                value={form.analysis_plan}
                onChange={(e) => setForm({ ...form, analysis_plan: e.target.value })}
                placeholder="Statistical analysis plan"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Authors</label>
              <input
                type="text"
                value={form.authors}
                onChange={(e) => setForm({ ...form, authors: e.target.value })}
                placeholder="Dr. Smith, Prof. Jones"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">ORCID</label>
              <input
                type="text"
                value={form.orcid}
                onChange={(e) => setForm({ ...form, orcid: e.target.value })}
                placeholder="0000-0001-2345-6789"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono text-emerald-400 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={creating || !form.title || !form.hypothesis}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-xl font-mono text-sm transition"
          >
            {creating ? "Creating..." : "Create Preregistration"}
          </button>

          {createResult && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl font-mono text-xs text-emerald-300">
              {createResult}
            </div>
          )}
        </div>
      )}

      {/* VIEW / REGISTER VIEW */}
      {view === "view" && (
        <div className="bg-[#0e1726] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl space-y-5">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg sm:text-2xl font-bold text-slate-100">
              View Preregistration
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              View and register your preregistration
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={viewTarget}
              onChange={(e) => setViewTarget(e.target.value)}
              placeholder="Preregistration ID"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono text-cyan-300 focus:border-emerald-500 outline-none"
            />
            <button
              onClick={handleView}
              disabled={viewLoading || !viewTarget}
              className="px-6 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs transition"
            >
              Load
            </button>
          </div>

          {preregData && (
            <div className="space-y-3">
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="text-sm font-bold text-white">
                  {preregData.title as string}
                </div>
                <div className="text-[10px] text-slate-400">
                  Status:{" "}
                  <span
                    className={`font-bold ${
                      preregData.status === "registered"
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }`}
                  >
                    {preregData.status as string}
                  </span>
                </div>
                {!!preregData.registered_at && (
                  <div className="text-[10px] text-slate-400">
                    Registered: {String(preregData.registered_at)}
                  </div>
                )}
                <div className="text-xs text-slate-300">
                  <strong>Hypothesis:</strong> {String(preregData.hypothesis)}
                </div>
                {!!preregData.methods && (
                  <div className="text-xs text-slate-300">
                    <strong>Methods:</strong> {String(preregData.methods)}
                  </div>
                )}
                {!!preregData.analysis_plan && (
                  <div className="text-xs text-slate-300">
                    <strong>Analysis Plan:</strong> {String(preregData.analysis_plan)}
                  </div>
                )}
                {!!preregData.version && (
                  <div className="text-[10px] text-slate-400">
                    Version: {String(preregData.version)}
                  </div>
                )}
              </div>

              {preregData.status !== "registered" && (
                <button
                  onClick={handleRegister}
                  disabled={viewLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold py-3 rounded-xl text-sm transition"
                >
                  Register Now (Lock in Time)
                </button>
              )}

              {registerResult && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl font-mono text-xs text-emerald-300">
                  {registerResult}
                </div>
              )}

              {(preregData.amendments as unknown[])?.length ? (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-400">Amendments:</div>
                  {(preregData.amendments as Record<string, unknown>[]).map((a, i) => (
                    <div
                      key={i}
                      className="p-3 bg-slate-900 rounded-xl border border-slate-800"
                    >
                      <div className="text-[10px] text-slate-400">
                        v{a.version as number} — {a.created_at as string}
                      </div>
                      <div className="text-xs text-slate-300 mt-1">
                        {a.description as string}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
