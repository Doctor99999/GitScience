"use client";

import React, { useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { SubNav } from "@/components/ui/SubNav";

interface EditorialTabProps {
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

export default function EditorialTab({ apiBase, token }: EditorialTabProps) {
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
      const res = await fetch(`${apiBase}/api/v1/editorial/analytics/pipeline`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
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
      const res = await fetch(`${apiBase}/api/v1/editorial/analytics/dashboard`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
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
      const res = await fetch(`${apiBase}/api/v1/editorial/ai-screen/${screenTarget}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setScreenResult(data);
    } catch {
      setScreenResult({ error: "Network error" });
    } finally {
      setScreenLoading(false);
    }
  };

  const handleSubNavChange = (key: string) => {
    const v = key as EditorialView;
    setView(v);
    if (v === "pipeline" && !pipeline) loadPipeline();
    if (v === "analytics" && !analytics) loadAnalytics();
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <SubNav
        items={[
          { key: "submit", label: "Submit Manuscript" },
          { key: "pipeline", label: "Pipeline" },
          { key: "analytics", label: "Analytics" },
          { key: "ai-screen", label: "AI Screen" },
        ]}
        active={view}
        onChange={handleSubNavChange}
      />

      {/* SUBMIT VIEW */}
      {view === "submit" && (
        <Panel className="p-4 sm:p-7 shadow-xl space-y-5">
          <SectionHeader
            icon="edit_note"
            title={<h2 className="font-display text-lg font-extrabold uppercase tracking-tight text-[var(--foreground)]">Submit Manuscript</h2>}
            subtitle={<p className="text-xs sm:text-sm text-[var(--text-mid)]">Submit a new manuscript for peer review</p>}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="md:col-span-2">
              <Input
                label="Title *"
                placeholder="Manuscript title"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Textarea
                label="Abstract *"
                hint="Structured abstract (Background, Methods, Results, Conclusions)"
                rows={4}
                value={draft.abstract}
                onChange={(e) => setDraft({ ...draft, abstract: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Authors (comma-separated)"
                placeholder="Dr. Smith, Prof. Jones"
                value={draft.authors}
                onChange={(e) => setDraft({ ...draft, authors: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Keywords (comma-separated)"
                placeholder="blockchain, peer review, open science"
                value={draft.keywords}
                onChange={(e) => setDraft({ ...draft, keywords: e.target.value })}
              />
            </div>
            <div>
              <Select
                label="Category"
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              >
                <option value="research-article">Research Article</option>
                <option value="review">Review Article</option>
                <option value="short-communication">Short Communication</option>
                <option value="case-report">Case Report</option>
                <option value="editorial">Editorial</option>
              </Select>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            loading={submitting}
            disabled={!draft.title || !draft.abstract}
            onClick={handleSubmit}
          >
            {submitting ? "Submitting..." : "Submit for Peer Review"}
          </Button>

          {submitResult && (
            <Panel tone="ok" className="p-4 font-mono text-xs text-[var(--ok)]">
              {submitResult}
            </Panel>
          )}
        </Panel>
      )}

      {/* PIPELINE VIEW */}
      {view === "pipeline" && (
        <Panel className="p-4 sm:p-7 shadow-xl space-y-5">
          <SectionHeader
            icon="assignment"
            title={<h2 className="font-display text-lg font-extrabold uppercase tracking-tight text-[var(--foreground)]">Editorial Pipeline</h2>}
            subtitle={<p className="text-xs sm:text-sm text-[var(--text-mid)]">Overview of all manuscripts by status</p>}
          />

          {pipelineLoading ? (
            <div className="space-y-3 py-8">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : pipeline ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(pipeline).map(([status, items]) => (
                <div
                  key={status}
                  className="p-4 bg-[var(--surface-hi)] border border-[var(--surface-border)]"
                >
                  <div className="text-xs font-bold text-[var(--text-mid)] uppercase mb-2">
                    {status.replace(/_/g, " ")}
                  </div>
                  <div className="text-2xl font-mono font-bold text-[var(--foreground)]">
                    {(items as unknown[]).length}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="assignment"
              title="No pipeline data"
              body={<p>Click refresh to load the editorial pipeline</p>}
            />
          )}

          <Button
            variant="secondary"
            size="md"
            icon={<span className="material-symbols-outlined text-[1.1em]" aria-hidden>analytics</span>}
            onClick={loadPipeline}
          >
            Refresh Pipeline
          </Button>
        </Panel>
      )}

      {/* ANALYTICS VIEW */}
      {view === "analytics" && (
        <Panel className="p-4 sm:p-7 shadow-xl space-y-5">
          <SectionHeader
            icon="analytics"
            title={<h2 className="font-display text-lg font-extrabold uppercase tracking-tight text-[var(--foreground)]">Editorial Analytics</h2>}
            subtitle={<p className="text-xs sm:text-sm text-[var(--text-mid)]">Performance metrics and statistics</p>}
          />

          {analyticsLoading ? (
            <div className="space-y-3 py-8">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : analytics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-[var(--surface-hi)] border border-[var(--surface-border)]">
                  <div className="text-xs text-[var(--text-mid)]">Total Submissions</div>
                  <div className="text-2xl font-mono font-bold text-[var(--foreground)]">
                    {(analytics.overview as Record<string, unknown>)?.total_submissions as number ?? 0}
                  </div>
                </div>
                <div className="p-4 bg-[var(--surface-hi)] border border-[var(--surface-border)]">
                  <div className="text-xs text-[var(--text-mid)]">Published</div>
                  <div className="text-2xl font-mono font-bold text-[var(--ok)]">
                    {(analytics.overview as Record<string, unknown>)?.published as number ?? 0}
                  </div>
                </div>
                <div className="p-4 bg-[var(--surface-hi)] border border-[var(--surface-border)]">
                  <div className="text-xs text-[var(--text-mid)]">Acceptance Rate</div>
                  <div className="text-2xl font-mono font-bold text-[var(--info)]">
                    {String(analytics.acceptance_rate ?? 0)}%
                  </div>
                </div>
                <div className="p-4 bg-[var(--surface-hi)] border border-[var(--surface-border)]">
                  <div className="text-xs text-[var(--text-mid)]">Avg Days to Decision</div>
                  <div className="text-2xl font-mono font-bold text-[var(--warn)]">
                    {(analytics.timing as Record<string, unknown>)?.avg_days_to_decision as number ?? 0}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon="analytics"
              title="No analytics data"
              body={<p>Click refresh to load editorial analytics</p>}
            />
          )}

          <Button
            variant="secondary"
            size="md"
            icon={<span className="material-symbols-outlined text-[1.1em]" aria-hidden>analytics</span>}
            onClick={loadAnalytics}
          >
            Refresh Analytics
          </Button>
        </Panel>
      )}

      {/* AI SCREEN VIEW */}
      {view === "ai-screen" && (
        <Panel className="p-4 sm:p-7 shadow-xl space-y-5">
          <SectionHeader
            icon="biotech"
            title={<h2 className="font-display text-lg font-extrabold uppercase tracking-tight text-[var(--foreground)]">AI Manuscript Screening</h2>}
            subtitle={<p className="text-xs sm:text-sm text-[var(--text-mid)]">Automated quality check for submissions</p>}
          />

          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                label=""
                icon="search"
                placeholder="Submission code (e.g. GS-2026-00001)"
                value={screenTarget}
                onChange={(e) => setScreenTarget(e.target.value)}
              />
            </div>
            <Button
              variant="primary"
              size="md"
              loading={screenLoading}
              disabled={!screenTarget}
              onClick={handleAIScreen}
            >
              {screenLoading ? "Screening..." : "AI Screen"}
            </Button>
          </div>

          {screenResult && (
            <div className="p-4 bg-black/40 border border-cyan-500/30 font-mono text-[11px] space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-mid)]">Score:</span>
                <span className="text-[var(--foreground)] font-bold text-lg">
                  {(screenResult as Record<string, unknown>).overall_score as number}
                </span>
                <span className="text-[var(--text-mid)]">/10</span>
                <Badge
                  variant={
                    (screenResult as Record<string, unknown>).recommendation === "APPROVE_FOR_REVIEW"
                      ? "ok"
                      : (screenResult as Record<string, unknown>).recommendation === "REVIEW_WITH_CAUTION"
                      ? "warn"
                      : "err"
                  }
                >
                  {(screenResult as Record<string, unknown>).recommendation as string}
                </Badge>
              </div>

              {!!(screenResult as Record<string, unknown>).quality_scores && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {Object.entries(
                    (screenResult as Record<string, unknown>).quality_scores as Record<string, number>
                  ).map(([k, v]) => (
                    <div key={k} className="p-2 bg-[var(--surface-hi)] rounded">
                      <div className="text-[10px] text-[var(--text-low)] capitalize">{k}</div>
                      <div className="text-xs font-bold text-[var(--foreground)]">{Math.round(v * 100)}%</div>
                    </div>
                  ))}
                </div>
              )}

              {!!(screenResult as Record<string, unknown>).red_flags &&
                ((screenResult as Record<string, unknown>).red_flags as unknown[]).length > 0 && (
                <Panel tone="err" className="p-2">
                  <Badge variant="err" icon="warning">
                    Red Flags: {String((screenResult as Record<string, unknown>).red_flag_count)}
                  </Badge>
                </Panel>
              )}

              {!!(screenResult as Record<string, unknown>).suggestions &&
                ((screenResult as Record<string, unknown>).suggestions as string[]).length > 0 && (
                <div className="space-y-1">
                  <div className="text-[var(--text-mid)] text-[10px] font-bold">Suggestions:</div>
                  {((screenResult as Record<string, unknown>).suggestions as string[]).map((s: string, i: number) => (
                    <div key={i} className="text-[var(--foreground)] text-[10px]">- {s}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
