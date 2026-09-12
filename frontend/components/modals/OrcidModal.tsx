"use client";

import React, { useState } from "react";
import Image from "next/image";
import { DEFAULT_FOUNDER_PROFILE, getApiBase } from "../../lib/constants";
import type { TranslationDict } from "../../lib/translations";
import type { ScholarProfile } from "../../lib/types";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input, Select } from "../ui/Field";

interface OrcidModalProps {
  show: boolean;
  onClose: () => void;
  t: TranslationDict;
  activeScholar: ScholarProfile | null;
  onLogin: (profile: ScholarProfile) => void;
  onLogout: () => void;
}

export default function OrcidModal({
  show,
  onClose,
  t,
  activeScholar,
  onLogin,
  onLogout,
}: OrcidModalProps) {
  const [inputOrcid, setInputOrcid] = useState(activeScholar?.orcid || "");
  const [inputScholarName, setInputScholarName] = useState(activeScholar?.name || "");
  const [inputInstitution, setInputInstitution] = useState(activeScholar?.institution || "");
  const [inputDiscipline, setInputDiscipline] = useState(activeScholar?.discipline || "Clinical Oncology & Surgery");

  if (!show) return null;

  const handleOrcidOauth = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/v1/auth/orcid/state`);
      const data = await res.json();
      if (data.state && data.client_id) {
        const redirectUri = window.location.origin;
        const authUrl = `https://orcid.org/oauth/authorize?client_id=${data.client_id}&response_type=code&scope=/authenticate&redirect_uri=${encodeURIComponent(redirectUri)}&state=${data.state}`;
        window.location.href = authUrl;
      } else {
        alert("ORCID OAuth is not configured on the server (missing Client ID).");
      }
    } catch {
      alert("Failed to initialize ORCID OAuth.");
    }
  };

  const handleManualLogin = async () => {
    if (!inputOrcid || !inputScholarName) {
      alert(t.orcidFormAlert);
      return;
    }
    const localProfile = {
      orcid: inputOrcid.trim(),
      name: inputScholarName.trim(),
      institution: inputInstitution.trim() || "Independent Scientific Institute",
      discipline: inputDiscipline,
      git_impact_score: 120.0,
      platform_tier: "Verified Sovereign Scholar",
    };
    try {
      // Реальная JWT-аутентификация: токен нужен для Court/Review (Sybil protection)
      const res = await fetch(`${getApiBase()}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orcid: localProfile.orcid,
          name: localProfile.name,
          institution: localProfile.institution,
          discipline: localProfile.discipline,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { profile?: ScholarProfile; access_token?: string };
        onLogin({ ...(data.profile || localProfile), access_token: data.access_token });
        return;
      }
    } catch {}
    // Offline fallback: локальный профиль без токена
    onLogin(localProfile);
  };

  return (
    <Modal onClose={onClose}>
      <div className="space-y-5">
        <div>
          <div className="sci-label flex items-center gap-1.5 text-[var(--sci-red)]">
            <span className="material-symbols-outlined !text-base" aria-hidden>badge</span>
            <span>AUTH // SCHOLAR IDENTITY</span>
          </div>
          <h3 className="mt-1 font-display text-xl sm:text-2xl font-bold uppercase tracking-tight text-[var(--foreground)]">
            {t.loginOrcid}
          </h3>
          <p className="mt-0.5 text-xs text-[var(--text-mid)]">{t.orcidModalSub}</p>
        </div>

        <div className="space-y-3">
          <Input
            label={t.orcidIdLabel}
            icon="scan"
            type="text"
            value={inputOrcid}
            onChange={(e) => setInputOrcid(e.target.value)}
            placeholder="0009-0003-3929-3605"
            className="font-mono"
          />
          <Input
            label={t.fullNameLabel}
            icon="person"
            type="text"
            value={inputScholarName}
            onChange={(e) => setInputScholarName(e.target.value)}
            placeholder="Салауат Абильтаевич Ешимов"
          />
          <Input
            label={t.institutionLabel}
            icon="account_balance"
            type="text"
            value={inputInstitution}
            onChange={(e) => setInputInstitution(e.target.value)}
            placeholder="National Scientific Oncology Center"
          />
          <Select
            label={t.disciplineLabel}
            value={inputDiscipline}
            onChange={(e) => setInputDiscipline(e.target.value)}
          >
            <option value="Clinical Oncology & Surgery">Clinical Oncology & Surgery</option>
            <option value="Molecular Biology & Genetics">Molecular Biology & Genetics</option>
            <option value="Healthcare Informatics & AI">Healthcare Informatics & AI</option>
            <option value="Computational Systems & Algorithms">Computational Systems & Algorithms</option>
          </Select>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleOrcidOauth}
            className="sci-focus w-full flex items-center justify-center gap-2 border border-[var(--surface-border)] bg-[var(--carbon-gray)] px-4 py-2.5 text-[11px] font-bold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-hi)]"
            style={{ borderRadius: "var(--radius-card)" }}
          >
            <Image
              src="https://info.orcid.org/wp-content/uploads/2019/11/orcid_16x16.png"
              alt="ORCID iD"
              width={16}
              height={16}
              className="h-4 w-4"
            />
            Sign in with ORCID
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--surface-border)]"></div>
            <span className="text-[10px] text-[var(--text-faint)] font-mono uppercase tracking-widest">or manually (Dev/Local)</span>
            <div className="h-px flex-1 bg-[var(--surface-border)]"></div>
          </div>

          <Button variant="primary" className="w-full" onClick={handleManualLogin}>
            {t.loginSubmitBtn}
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => onLogin(DEFAULT_FOUNDER_PROFILE)}>
            {t.loginAsFounderBtn}
          </Button>
          {activeScholar && (
            <Button variant="danger" className="w-full" onClick={onLogout}>
              {t.logoutProfileBtn}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}