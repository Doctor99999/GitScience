"use client";

import React from "react";
import { IPC_CLASSES } from "../../lib/constants";
import type { TranslationDict } from "../../lib/translations";
import type { LibraryArticle } from "../../lib/types";
import type { TabKey } from "../NavigationTabs";
import { Panel } from "@/components/ui/Panel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";

interface LibraryTabProps {
  t: TranslationDict;
  lang: "KZ" | "RU" | "EN";
  filteredLibrary: LibraryArticle[];
  libSearch: string;
  setLibSearch: (s: string) => void;
  libIpcFilter: string;
  setLibIpcFilter: (s: string) => void;
  activePdfUrl: string | null;
  setActivePdfUrl: (s: string | null) => void;
  setSearchInspectCode: (s: string) => void;
  setActiveTab: (tab: TabKey) => void;
  handleInspect: (code: string) => void;
  apiBase: string;
  isLoading?: boolean;
  page?: number;
  setPage?: (p: number) => void;
}

export default function LibraryTab({
  t,
  lang,
  filteredLibrary,
  libSearch,
  setLibSearch,
  libIpcFilter,
  setLibIpcFilter,
  activePdfUrl,
  setActivePdfUrl,
  setSearchInspectCode,
  setActiveTab,
  handleInspect,
  apiBase,
  isLoading = false,
  page = 1,
  setPage = () => {},
}: LibraryTabProps) {
  return (
    <div className="space-y-6">
      <Panel className="space-y-5 p-4 sm:p-7">
        <SectionHeader
          icon="account_balance"
          kicker="LIBRARY"
          title={
            <h2 className="font-display text-lg font-extrabold uppercase tracking-tight text-[var(--foreground)]">
              {t.libHeader}
            </h2>
          }
          subtitle={<p>{t.libSubheader}</p>}
          right={<Badge variant="ok">Total: {filteredLibrary.length} works</Badge>}
        />

        {/* Search and Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Input
              icon="search"
              value={libSearch}
              onChange={(e) => setLibSearch(e.target.value)}
              placeholder={t.libSearchPlaceholder}
            />
          </div>
          <Select value={libIpcFilter} onChange={(e) => setLibIpcFilter(e.target.value)} className="sm:w-72">
            {IPC_CLASSES.map((c) => (
              <option key={c.code} value={c.code}>
                {lang === "KZ" ? c.name_kz : lang === "RU" ? c.name_ru : c.name_en}
              </option>
            ))}
          </Select>
        </div>

        {/* Embedded PDF Viewer Modal */}
        {activePdfUrl && (
          <Panel className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 font-mono text-xs font-bold text-[var(--info)]">
                <span className="material-symbols-outlined text-[1.1em]" aria-hidden>
                  description
                </span>
                PDF Viewer (ISO 14721 CAS Stream)
              </span>
              <Button variant="ghost" size="sm" onClick={() => setActivePdfUrl(null)}>
                {t.closePdfBtn}
              </Button>
            </div>
            <iframe
              src={activePdfUrl}
              className="h-[550px] w-full"
              title="PDF Manuscript Viewer"
              style={{ border: "1px solid var(--surface-border)", borderRadius: "var(--radius-card)" }}
            />
          </Panel>
        )}
        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        {/* Library Cards */}
        {!isLoading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredLibrary.map((art) => (
              <Panel
                key={art.registration_code}
                className="flex min-w-0 flex-col justify-between space-y-3 p-4 transition hover:brightness-110 sm:p-5"
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-xs font-bold text-[var(--info)]">
                      {art.registration_code} •{" "}
                      <span className="text-[var(--warn)]">{art.issue || "Vol 1. Issue 1 (Spring 2026)"}</span>
                    </span>
                    <div className="flex gap-1">
                      <Badge variant="info" className="shrink-0">
                        {art.status || "Published"}
                      </Badge>
                      <Badge variant="ok" className="shrink-0">
                        {art.license_type || "CC-BY-4.0"}
                      </Badge>
                    </div>
                  </div>
                  <h3 className="line-clamp-2 break-words text-sm font-bold text-[var(--foreground)] sm:text-base">
                    {art.title}
                  </h3>
                  <p className="truncate text-xs text-[var(--text-mid)]">
                    Автор: <strong className="text-[var(--foreground)]">{art.author_name}</strong>
                  </p>
                  <div className="flex items-center justify-between pt-1 font-mono text-[11px] text-[var(--text-low)] min-w-0">
                    <div>
                      Дереккөз: <span className="mr-3 text-[var(--warn)]">{art.source_archive || "Sovereign Notary"}</span>
                    </div>
                    <div className="flex shrink-0 gap-3 text-[var(--text-mid)]">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[1.1em]" aria-hidden>
                          visibility
                        </span>
                        {art.views_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[1.1em]" aria-hidden>
                          download
                        </span>
                        {art.downloads_count || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 border-t border-[var(--surface-border)] pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSearchInspectCode(art.registration_code);
                      setActiveTab("inspector");
                      handleInspect(art.registration_code);
                    }}
                  >
                    {t.viewDetailsBtn}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={() => setActivePdfUrl(`${apiBase}/library/view/${encodeURIComponent(art.registration_code)}`)}
                  >
                    {t.readPdfBtn}
                  </Button>
                </div>
              </Panel>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex items-center justify-between border-t border-[var(--surface-border)] pt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            icon={
              <span className="material-symbols-outlined text-[1.1em]" aria-hidden>
                chevron_left
              </span>
            }
          >
            Previous
          </Button>
          <span className="font-mono text-xs text-[var(--text-mid)]">Page {page}</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={filteredLibrary.length < 20}
            icon={
              <span className="material-symbols-outlined text-[1.1em]" aria-hidden>
                chevron_right
              </span>
            }
          >
            Next
          </Button>
        </div>
      </Panel>
    </div>
  );
}