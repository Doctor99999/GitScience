"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { TranslationDict } from "../../lib/translations";
import { Panel } from "@/components/ui/Panel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Checkbox } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { SubNav } from "@/components/ui/SubNav";

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

  const loadDashboard = useCallback(async () => {
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
  }, [apiBase, orcid, token]);

  const loadChecklist = async () => {
    if (!targetCode) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/editorial/checklist/${targetCode}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
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
      const res = await fetch(`${apiBase}/api/v1/editorial/versions/${targetCode}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
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
      setRevisionResult(data.revision_id ? `${t.dashRevisionCreated} ${data.revision_id}` : t.dashError);
    } catch {
      setRevisionResult(t.dashNetworkError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === "submissions" && orcid) {
      const id = window.setTimeout(() => {
        void loadDashboard();
      }, 0);
      return () => window.clearTimeout(id);
    }
  }, [view, orcid, loadDashboard]);

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <SubNav
        items={[
          { key: "submissions", label: t.dashTabSubmissions },
          { key: "checklist", label: t.dashTabChecklist },
          { key: "versions", label: t.dashTabVersions },
        ]}
        active={view}
        onChange={(v) => setView(v as DashboardView)}
      />

      {/* SUBMISSIONS VIEW */}
      {view === "submissions" && (
        <Panel className="p-4 sm:p-7 shadow-xl space-y-5">
          <SectionHeader
            icon="newspaper"
            title={<h2 className="font-display text-lg font-extrabold uppercase tracking-tight text-[var(--foreground)]">{t.dashTabSubmissions}</h2>}
            subtitle={<p className="text-xs sm:text-sm text-[var(--text-mid)]">{t.dashSubheader}</p>}
          />

          {!orcid ? (
            <EmptyState
              icon="person"
              title={t.dashNotLoggedIn}
              body={<p>{t.dashPleaseLogin}</p>}
            />
          ) : loading ? (
            <div className="space-y-3 py-8">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : dashboard ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-[var(--surface-hi)] border border-[var(--surface-border)]">
                  <div className="text-xs text-[var(--text-mid)]">{t.dashTotalStat}</div>
                  <div className="text-2xl font-mono font-bold text-[var(--foreground)]">
                    {(dashboard.submissions as unknown[])?.length ?? 0}
                  </div>
                </div>
                <div className="p-4 bg-[var(--surface-hi)] border border-[var(--surface-border)]">
                  <div className="text-xs text-[var(--text-mid)]">{t.dashReviewsDone}</div>
                  <div className="text-2xl font-mono font-bold text-[var(--info)]">
                    {(dashboard.reviews as unknown[])?.length ?? 0}
                  </div>
                </div>
                <div className="p-4 bg-[var(--surface-hi)] border border-[var(--surface-border)]">
                  <div className="text-xs text-[var(--text-mid)]">{t.dashPublishedStat}</div>
                  <div className="text-2xl font-mono font-bold text-[var(--ok)]">
                    {dashboard.published_count as number ?? 0}
                  </div>
                </div>
                <div className="p-4 bg-[var(--surface-hi)] border border-[var(--surface-border)]">
                  <div className="text-xs text-[var(--text-mid)]">{t.dashUnderReview}</div>
                  <div className="text-2xl font-mono font-bold text-[var(--warn)]">
                    {dashboard.under_review_count as number ?? 0}
                  </div>
                </div>
              </div>

              {(dashboard.submissions as Record<string, unknown>[])?.length ? (
                <div className="space-y-2">
                  {(dashboard.submissions as Record<string, unknown>[]).map((sub, i) => (
                    <div
                      key={i}
                      className="p-3 bg-[var(--surface-hi)] border border-[var(--surface-border)] flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-[var(--foreground)]">{sub.title as string}</div>
                        <div className="text-[10px] text-[var(--text-mid)]">
                          {sub.submission_code as string} &middot; {sub.status as string}
                        </div>
                      </div>
                      <Badge
                        variant={
                          sub.status === "published"
                            ? "ok"
                            : sub.status === "under_review"
                            ? "warn"
                            : "default"
                        }
                      >
                        {(sub.status as string)?.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="assignment"
                  title={t.dashNoSubmissionsTitle}
                  body={<p>{t.dashNoSubmissionsBody}</p>}
                />
              )}
            </div>
          ) : (
            <Button
              variant="secondary"
              size="md"
              onClick={loadDashboard}
            >
              {t.dashLoadBtn}
            </Button>
          )}
        </Panel>
      )}

      {/* CHECKLIST VIEW */}
      {view === "checklist" && (
        <Panel className="p-4 sm:p-7 shadow-xl space-y-5">
          <SectionHeader
            icon="assignment"
            title={<h2 className="font-display text-lg font-extrabold uppercase tracking-tight text-[var(--foreground)]">{t.dashChecklistTitle}</h2>}
            subtitle={<p className="text-xs sm:text-sm text-[var(--text-mid)]">{t.dashChecklistSub}</p>}
          />

          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                label=""
                icon="search"
                placeholder={t.dashCodePlaceholder}
                value={targetCode}
                onChange={(e) => setTargetCode(e.target.value)}
              />
            </div>
            <Button
              variant="primary"
              size="md"
              loading={loading}
              disabled={!targetCode}
              onClick={loadChecklist}
            >
              {t.dashLoadBtn}
            </Button>
          </div>

          {!!checklist && !!checklist.items && (
            <div className="space-y-2">
              <div className="text-xs text-[var(--text-mid)]">
                {t.dashProgressLabel} {String(checklist.completed_count)}/{String(checklist.total_count)}
              </div>
              <div className="w-full bg-[var(--surface-hi)] rounded-full h-2">
                <div
                  className="bg-[var(--ok)] h-2 rounded-full transition-all"
                  style={{
                    width: `${((checklist.completed_count as number) / Math.max(1, checklist.total_count as number)) * 100}%`,
                  }}
                />
              </div>
              {(checklist.items as Record<string, unknown>[]).map((item, i) => (
                <div
                  key={i}
                  className="p-3 bg-[var(--surface-hi)] border border-[var(--surface-border)] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      label={String(item.label)}
                      checked={!!item.completed}
                      onChange={() => {}}
                      id={`checklist-${i}`}
                    />
                  </div>
                  {!!item.required && (
                    <Badge variant="err">{t.dashRequiredBadge}</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {/* VERSIONS VIEW */}
      {view === "versions" && (
        <Panel className="p-4 sm:p-7 shadow-xl space-y-5">
          <SectionHeader
            icon="edit_note"
            title={<h2 className="font-display text-lg font-extrabold uppercase tracking-tight text-[var(--foreground)]">{t.dashTabVersions}</h2>}
            subtitle={<p className="text-xs sm:text-sm text-[var(--text-mid)]">{t.dashVersionsSub}</p>}
          />

          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                label=""
                icon="search"
                placeholder={t.dashCodePlaceholder}
                value={targetCode}
                onChange={(e) => setTargetCode(e.target.value)}
              />
            </div>
            <Button
              variant="primary"
              size="md"
              loading={loading}
              disabled={!targetCode}
              onClick={loadVersions}
            >
              {t.dashLoadBtn}
            </Button>
          </div>

          {versions.length > 0 ? (
            <div className="space-y-2">
              {versions.map((v, i) => (
                <div
                  key={i}
                  className="p-3 bg-[var(--surface-hi)] border border-[var(--surface-border)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-[var(--foreground)]">
                      {t.dashVersionLabel} {v.version_number as number}
                    </div>
                    <div className="text-[10px] text-[var(--text-mid)]">
                      {v.created_at as string}
                    </div>
                  </div>
                  <div className="text-[10px] text-[var(--text-mid)] mt-1">
                    {t.dashChangesLabel} {v.change_summary as string}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="edit_note"
              title={t.dashNoVersionsTitle}
              body={<p>{t.dashNoVersionsBody}</p>}
            />
          )}

          {/* Revision request */}
          <div className="border-t border-[var(--surface-border)] pt-4 space-y-2">
            <div className="text-xs font-bold text-[var(--text-mid)]">{t.dashRequestRevision}</div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  label=""
                  icon="edit_note"
                  placeholder={t.dashCodePlaceholder}
                  value={revisionTarget}
                  onChange={(e) => setRevisionTarget(e.target.value)}
                />
              </div>
              <Button
                variant="primary"
                size="md"
                loading={loading}
                disabled={!revisionTarget}
                onClick={handleCreateRevision}
              >
                {t.dashCreateRevisionBtn}
              </Button>
            </div>
            {revisionResult && (
              <Panel tone="warn" className="p-3 font-mono text-xs text-[var(--warn)]">
                {revisionResult}
              </Panel>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}
