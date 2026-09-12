"use client";

import React from "react";
import type { TranslationDict } from "../../lib/translations";
import type { VampireDaemonStats, VampireSource, VampireWork } from "../../lib/types";
import { Panel } from "@/components/ui/Panel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Field";

interface VampireTabProps {
  t: TranslationDict;
  vampireQuery: string;
  setVampireQuery: (s: string) => void;
  vampireSource: VampireSource;
  setVampireSource: (s: VampireSource) => void;
  handleMultiSourceSearch: () => void;
  vampireSearching: boolean;
  vampireResults: VampireWork[];
  handleImportWork: (work: VampireWork) => void;
  vampireImporting: boolean;
  handleTriggerBatchHarvest: () => void;
  batchHarvesting: boolean;
  daemonRunning: boolean;
  daemonStats: VampireDaemonStats | null;
  handleToggleDaemon: (action: "start" | "stop") => void;
}

export default function VampireTab({
  t,
  vampireQuery,
  setVampireQuery,
  vampireSource,
  setVampireSource,
  handleMultiSourceSearch,
  vampireSearching,
  vampireResults,
  handleImportWork,
  vampireImporting,
  handleTriggerBatchHarvest,
  batchHarvesting,
  daemonRunning,
  daemonStats,
  handleToggleDaemon,
}: VampireTabProps) {
  return (
    <div className="space-y-6">
      <Panel className="p-4 sm:p-7 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-[var(--surface-border)] pb-4">
          <SectionHeader
            icon="hub"
            title={<h2 className="font-display text-lg font-extrabold uppercase tracking-tight text-[var(--foreground)]">{t.vampireHeader}</h2>}
            subtitle={<p className="text-xs sm:text-sm text-[var(--text-mid)]">{t.vampireSubheader}</p>}
          />

          <div className="flex items-center gap-2">
            {daemonRunning ? (
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleToggleDaemon("stop")}
              >
                {t.stopDaemonBtn}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleToggleDaemon("start")}
              >
                {t.startDaemonBtn}
              </Button>
            )}
          </div>
        </div>

        {/* Daemon Live Status */}
        <div className="p-4 bg-black/40 border border-[var(--surface-border)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${daemonRunning ? "bg-[var(--ok)] animate-pulse" : "bg-[var(--text-low)]"}`}></span>
            <span className={daemonRunning ? "text-[var(--ok)]" : "text-[var(--text-mid)]"}>
              {daemonRunning ? t.daemonStatusRunning : t.daemonStatusStopped}
            </span>
          </div>
          {daemonStats && (
            <div className="text-[11px] text-[var(--text-mid)] flex gap-3">
              <span>Harvested: <strong className="text-[var(--info)]">{daemonStats.total_lifetime_harvested || 0}</strong></span>
              <span>Topic: <strong className="text-[var(--info)] text-[10px]">{daemonStats.current_active_topic || "—"}</strong></span>
            </div>
          )}
        </div>

        {/* Source Pills */}
        <div className="flex flex-wrap gap-2 text-xs font-mono">
          {[
            { id: "all", label: t.sourceAll },
            { id: "openalex", label: t.sourceOpenAlex },
            { id: "arxiv", label: t.sourceArxiv },
            { id: "pubmed", label: t.sourcePubMed },
          ].map((s) => (
            <Button
              key={s.id}
              variant={vampireSource === s.id ? "primary" : "secondary"}
              size="sm"
              onClick={() => setVampireSource(s.id as VampireSource)}
            >
              {s.label}
            </Button>
          ))}
        </div>

        {/* Search and Batch Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              label=""
              icon="search"
              placeholder={t.vampireSearchLabel}
              value={vampireQuery}
              onChange={(e) => setVampireQuery(e.target.value)}
            />
          </div>
          <Button
            variant="primary"
            size="md"
            loading={vampireSearching}
            onClick={handleMultiSourceSearch}
          >
            {vampireSearching ? "Ізделуде..." : t.vampireSearchBtn}
          </Button>
          <Button
            variant="primary"
            size="md"
            loading={batchHarvesting}
            onClick={handleTriggerBatchHarvest}
          >
            {batchHarvesting ? "Жинақталуда..." : t.vampireHarvestBtn}
          </Button>
        </div>

        <p className="text-[11px] text-[var(--text-low)] italic">
          {t.vampireLicenseNotice}
        </p>

        {/* Search Results */}
        {vampireResults.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-sm text-[var(--foreground)]">Табылған манускрипттер ({vampireResults.length}):</h3>
            <div className="space-y-3">
              {vampireResults.map((work, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-black/40 border border-[var(--surface-border)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
                >
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <Badge variant="brand" icon="hub">
                        {work.source || "Archive"}
                      </Badge>
                      <Badge variant="ok">
                        {work.license || "Open Access"}
                      </Badge>
                    </div>
                    <h4 className="font-bold text-sm text-[var(--foreground)]">{work.title}</h4>
                    <p className="text-[var(--text-mid)] text-[11px]">
                      Авторлар: {work.authors || work.author_name || "Independent Researchers"}
                    </p>
                    {work.doi && (
                      <span className="text-[10px] font-mono text-[var(--info)] block">DOI: {work.doi}</span>
                    )}
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    icon={<span className="material-symbols-outlined text-[1.1em]" aria-hidden>download</span>}
                    loading={vampireImporting}
                    onClick={() => handleImportWork(work)}
                  >
                    {vampireImporting ? "Импорт..." : t.vampireImportBtn}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
