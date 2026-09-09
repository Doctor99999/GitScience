"use client";

import React, { useState, useEffect } from "react";
import type { TranslationDict } from "../../lib/translations";

interface AuthorDashboardTabProps {
  t: TranslationDict;
  apiBase: string;
  token?: string | null;
  orcid?: string;
}

type DashboardView = "submissions" | "checklist" | "versions";

export default function AuthorDashboardTab({
  t,
  apiBase,
  token,
  orcid,
}: AuthorDashboardTabProps) {
  const [view, setView] = useState<DashboardView>("submissions");
  const [dashboard, setDashboard] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [targetCode, setTargetCode] = useState("");
  const [checklist, setChecklist] = useState<Record<string, unknown> | null>(null);
  const [versions, setVersions] = useState<Record<string, unknown>[]>([]);
  const [revisionTarget, setRevisionTarget] = useState("");
  const [revisionResult, setRevisionResult] = useState<string | null>(null);

  const loadDashboard = async () => {
    if (!orcid) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/editorial/dashboard/${orcid}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setDashboard(data);
    } catch {
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  };

  const loadChecklist = async () => {
    if (!targetCode) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/editorial/checklist/${targetCode}`);
      const data = await res.json();
      setChecklist(data);
    } catch {
      setChecklist(null);
    } finally {
      setLoading(false);
    }
  };

  const loadVersions = async () => {
    if (!targetCode) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/editorial/versions/${targetCode}`);
      const data = await res.json();
      setVersions(data.versions || []);
    } catch {
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRevision = async () => {
    if (!revisionTarget) return;
    setLoading(true);
    setRevisionResult(null);
    try {
      const res = await fetch(`${apiBase}/api/v1/editorial/revision/create/${revisionTarget}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          required_changes: ["Address reviewer comments"],
          deadline_days: 30,
        }),
      });
      const data = await res.json();
      setRevisionResult(data.revision_id ? `Revision created: ${data.revision_id}` : "Error");
    } catch {
      setRevisionResult("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === "submissions" && orcid) loadDashboard();
  }, [view, orcid]);

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex gap-2 flex-wrap">
        {(["submissions", "checklist", "versions"] as DashboardView[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              view === v
                ? "bg-emerald-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {v === "submissions" && "My Submissions"}
            {v === "checklist" && "Checklist"}
            {v === "versions" && "Version History"}
          </button>
        ))}
      </div>

      {/* SUBMISSIONS VIEW */}
      {view === "submissions" && (
        <div className="bg-[#0e1726] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl space-y-5">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg sm:text-2xl font-bold text-slate-100">My Submissions</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Track your manuscripts through the review process
            </p>
          </div>

          {!orcid ? (
            <div className="text-center text-slate-500 py-8">
              Please log in to view your submissions
            </div>
          ) : loading ? (
            <div className="text-center text-slate-500 py-8">Loading...</div>
          ) : dashboard ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Total</div>
                  <div className="text-2xl font-mono font-bold text-white">
                    {(dashboard.submissions as unknown[])?.length ?? 0}
                  </div>
                </div>
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Reviews Done</div>
                  <div className="text-2xl font-mono font-bold text-cyan-400">
                    {(dashboard.reviews as unknown[])?.length ?? 0}
                  </div>
                </div>
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Published</div>
                  <div className="text-2xl font-mono font-bold text-emerald-400">
                    {dashboard.published_count as number ?? 0}
                  </div>
                </div>
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Under Review</div>
                  <div className="text-2xl font-mono font-bold text-amber-400">
                    {dashboard.under_review_count as number ?? 0}
                  </div>
                </div>
              </div>

              {(dashboard.submissions as Record<string, unknown>[])?.length ? (
                <div className="space-y-2">
                  {(dashboard.submissions as Record<string, unknown>[]).map((sub, i) => (
                    <div
                      key={i}
                      className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{sub.title as string}</div>
                        <div className="text-[10px] text-slate-400">
                          {sub.submission_code as string} &middot; {sub.status as string}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sub.status === "published"
                            ? "bg-emerald-900 text-emerald-300"
                            : sub.status === "under_review"
                            ? "bg-amber-900 text-amber-300"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {(sub.status as string)?.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-500 text-xs py-4">
                  No submissions yet
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={loadDashboard}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-xl text-xs transition"
            >
              Load Dashboard
            </button>
          )}
        </div>
      )}

      {/* CHECKLIST VIEW */}
      {view === "checklist" && (
        <div className="bg-[#0e1726] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl space-y-5">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg sm:text-2xl font-bold text-slate-100">
              Submission Checklist
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Complete all required items before submission
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={targetCode}
              onChange={(e) => setTargetCode(e.target.value)}
              placeholder="Submission code"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono text-cyan-300 focus:border-emerald-500 outline-none"
            />
            <button
              onClick={loadChecklist}
              disabled={loading || !targetCode}
              className="px-6 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs transition"
            >
              Load
            </button>
          </div>

          {!!checklist && !!checklist.items && (
            <div className="space-y-2">
              <div className="text-xs text-slate-400">
                Progress: {String(checklist.completed_count)}/{String(checklist.total_count)}
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${((checklist.completed_count as number) / Math.max(1, checklist.total_count as number)) * 100}%`,
                  }}
                />
              </div>
              {(checklist.items as Record<string, unknown>[]).map((item, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-4 h-4 rounded border ${
                        item.completed
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-slate-600"
                      }`}
                    />
                    <span className="text-xs text-slate-300">{String(item.label)}</span>
                  </div>
                  {!!item.required && (
                    <span className="text-[10px] text-red-400 font-bold">Required</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VERSIONS VIEW */}
      {view === "versions" && (
        <div className="bg-[#0e1726] border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl space-y-5">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg sm:text-2xl font-bold text-slate-100">Version History</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Track all versions and revisions
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={targetCode}
              onChange={(e) => setTargetCode(e.target.value)}
              placeholder="Submission code"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono text-cyan-300 focus:border-emerald-500 outline-none"
            />
            <button
              onClick={loadVersions}
              disabled={loading || !targetCode}
              className="px-6 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs transition"
            >
              Load
            </button>
          </div>

          {versions.length > 0 && (
            <div className="space-y-2">
              {versions.map((v, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-900 rounded-xl border border-slate-800"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-white">
                      Version {v.version_number as number}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {v.created_at as string}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Changes: {v.change_summary as string}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Revision request */}
          <div className="border-t border-slate-800 pt-4 space-y-2">
            <div className="text-xs font-bold text-slate-400">Request Revision</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={revisionTarget}
                onChange={(e) => setRevisionTarget(e.target.value)}
                placeholder="Submission code"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono text-cyan-300 focus:border-emerald-500 outline-none"
              />
              <button
                onClick={handleCreateRevision}
                disabled={loading || !revisionTarget}
                className="px-6 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs transition"
              >
                Create Revision
              </button>
            </div>
            {revisionResult && (
              <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl font-mono text-xs text-amber-300">
                {revisionResult}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
