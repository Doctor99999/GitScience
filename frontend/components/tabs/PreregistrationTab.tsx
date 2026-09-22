"use client";

import React, { useState } from "react";
import type { TranslationDict } from "../../lib/translations";
import { Panel } from "@/components/ui/Panel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Textarea } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { SubNav } from "@/components/ui/SubNav";
import { authFetch } from "../../lib/auth";

interface PreregistrationTabProps {
  t: TranslationDict;
  apiBase: string;
  token?: string | null;
}

type PreregView = "create" | "view";

export default function PreregistrationTab({
  t,
  apiBase,
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
      const res = await authFetch(`${apiBase}/api/v1/editorial/preregistration/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
          ? `${t.preCreated}: ${data.prereg_id}`
          : `${t.edError}: ${data.detail || t.edUnknownError}`
      );
    } catch {
      setCreateResult(t.edNetworkError);
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
      const res = await authFetch(`${apiBase}/api/v1/editorial/preregistration/${viewTarget}`, {});
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
      const res = await authFetch(
        `${apiBase}/api/v1/editorial/preregistration/register/${viewTarget}`,
        {
          method: "POST",
        }
      );
      const data = await res.json();
      setRegisterResult(data.registered_at ? t.preRegistered : t.edError);
      if (data.registered_at) handleView();
    } catch {
      setRegisterResult(t.edNetworkError);
    } finally {
      setViewLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <SubNav
        items={[
          { key: "create", label: t.preSubCreate },
          { key: "view", label: t.preSubView },
        ]}
        active={view}
        onChange={(v) => setView(v as PreregView)}
      />

      {/* CREATE VIEW */}
      {view === "create" && (
        <Panel className="p-4 sm:p-7 space-y-5">
          <SectionHeader
            icon="biotech"
            title={<h2 className="font-display text-lg font-extrabold uppercase tracking-tight text-[var(--foreground)]">{t.preSubCreate}</h2>}
            subtitle={<p className="text-xs sm:text-sm text-[var(--text-mid)]">{t.preSubCreateSub}</p>}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="md:col-span-2">
              <Input
                label={t.edTitleLabel}
                placeholder={t.preTitlePlaceholder}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Textarea
                label={t.preHypothesisLabel}
                hint={t.preHypothesisHint}
                rows={3}
                value={form.hypothesis}
                onChange={(e) => setForm({ ...form, hypothesis: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Textarea
                label={t.preMethodsLabel}
                hint={t.preMethodsHint}
                rows={3}
                value={form.methods}
                onChange={(e) => setForm({ ...form, methods: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Textarea
                label={t.preAnalysisLabel}
                hint={t.preAnalysisHint}
                rows={3}
                value={form.analysis_plan}
                onChange={(e) => setForm({ ...form, analysis_plan: e.target.value })}
              />
            </div>
            <div>
              <Input
                label={t.edAuthorsLabel}
                placeholder="Dr. Smith, Prof. Jones"
                value={form.authors}
                onChange={(e) => setForm({ ...form, authors: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="ORCID"
                placeholder="0000-0001-2345-6789"
                value={form.orcid}
                onChange={(e) => setForm({ ...form, orcid: e.target.value })}
              />
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            loading={creating}
            disabled={!form.title || !form.hypothesis}
            onClick={handleCreate}
          >
            {creating ? t.preCreating : t.preSubCreate}
          </Button>

          {createResult && (
            <Panel tone="ok" className="p-4 font-mono text-xs text-[var(--ok)]">
              {createResult}
            </Panel>
          )}
        </Panel>
      )}

      {/* VIEW / REGISTER VIEW */}
      {view === "view" && (
        <Panel className="p-4 sm:p-7 space-y-5">
          <SectionHeader
            icon="biotech"
            title={<h2 className="font-display text-lg font-extrabold uppercase tracking-tight text-[var(--foreground)]">{t.preViewTitle}</h2>}
            subtitle={<p className="text-xs sm:text-sm text-[var(--text-mid)]">{t.preSubViewSub}</p>}
          />

          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                label=""
                icon="search"
                placeholder={t.preViewPlaceholder}
                value={viewTarget}
                onChange={(e) => setViewTarget(e.target.value)}
              />
            </div>
            <Button
              variant="primary"
              size="md"
              loading={viewLoading}
              disabled={!viewTarget}
              onClick={handleView}
            >
              {t.preLoadBtn}
            </Button>
          </div>

          {preregData ? (
            <div className="space-y-3">
              <Panel className="p-4 space-y-2">
                <div className="text-sm font-bold text-[var(--foreground)]">
                  {preregData.title as string}
                </div>
                <div className="text-[10px] text-[var(--text-mid)]">
                  {t.preStatusLabel}{" "}
                  <Badge
                    variant={
                      preregData.status === "registered"
                        ? "ok"
                        : "warn"
                    }
                  >
                    {preregData.status as string}
                  </Badge>
                </div>
                {!!preregData.registered_at && (
                  <div className="text-[10px] text-[var(--text-mid)]">
                    {t.preRegisteredAt} {String(preregData.registered_at)}
                  </div>
                )}
                <div className="text-xs text-[var(--foreground)]">
                  <strong>{t.preHypothesisField}</strong> {String(preregData.hypothesis)}
                </div>
                {!!preregData.methods && (
                  <div className="text-xs text-[var(--foreground)]">
                    <strong>{t.preMethodsField}</strong> {String(preregData.methods)}
                  </div>
                )}
                {!!preregData.analysis_plan && (
                  <div className="text-xs text-[var(--foreground)]">
                    <strong>{t.preAnalysisField}</strong> {String(preregData.analysis_plan)}
                  </div>
                )}
                {!!preregData.version && (
                  <div className="text-[10px] text-[var(--text-mid)]">
                    {t.preVersion} {String(preregData.version)}
                  </div>
                )}
              </Panel>

              {preregData.status !== "registered" && (
                <Button
                  variant="primary"
                  size="md"
                  loading={viewLoading}
                  onClick={handleRegister}
                >
                  {t.preRegisterBtn}
                </Button>
              )}

              {registerResult && (
                <Panel tone="ok" className="p-3 font-mono text-xs text-[var(--ok)]">
                  {registerResult}
                </Panel>
              )}

              {(preregData.amendments as unknown[])?.length ? (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[var(--text-mid)]">{t.preAmendments}</div>
                  {(preregData.amendments as Record<string, unknown>[]).map((a, i) => (
                    <Panel key={i} className="p-3">
                      <div className="text-[10px] text-[var(--text-mid)]">
                        v{a.version as number} — {a.created_at as string}
                      </div>
                      <div className="text-xs text-[var(--foreground)] mt-1">
                        {a.description as string}
                      </div>
                    </Panel>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyState
              icon="biotech"
              title={t.preNoDataTitle}
              body={<p>{t.preNoDataBody}</p>}
            />
          )}
        </Panel>
      )}
    </div>
  );
}
