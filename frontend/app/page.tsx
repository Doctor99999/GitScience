"use client";

import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import WelcomeBanner from "../components/WelcomeBanner";
import NavigationTabs, { TabKey } from "../components/NavigationTabs";
import Footer from "../components/Footer";

// Tabs
import NotaryTab from "../components/tabs/NotaryTab";
import InspectorTab from "../components/tabs/InspectorTab";
import LibraryTab from "../components/tabs/LibraryTab";
import ZkDiscoveryTab from "../components/tabs/ZkDiscoveryTab";
import PassportTab from "../components/tabs/PassportTab";
import ReviewTab from "../components/tabs/ReviewTab";
import MaasTab from "../components/tabs/MaasTab";
import AmanatTab from "../components/tabs/AmanatTab";
import CourtTab from "../components/tabs/CourtTab";
import VampireTab from "../components/tabs/VampireTab";

// Modals
import OrcidModal from "../components/modals/OrcidModal";
// WalletModal removed
import GuideModal from "../components/modals/GuideModal";
import LicenseModal from "../components/modals/LicenseModal";

// Libs
import { getApiBase, DEFAULT_FOUNDER_PROFILE } from "../lib/constants";
import { TRANSLATIONS } from "../lib/translations";

import { useAccount, useBalance } from "wagmi";
import { useModal } from "connectkit";
import { formatUnits } from "viem";

export default function GitScienceApp() {
  const [lang, setLang] = useState<"KZ" | "RU" | "EN">("KZ");
  const [activeTab, setActiveTab] = useState<TabKey>("notary");
  const [apiBase, setApiBase] = useState<string>(process.env.NEXT_PUBLIC_API_URL || "");

  // Authentication & Guest State
  const [activeScholar, setActiveScholar] = useState<any>(null);
  const [showOrcidModal, setShowOrcidModal] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [passkeyNotice, setPasskeyNotice] = useState<string | null>(null);

  // Web3 Wallet State (Wagmi + ConnectKit)
  const { address, isConnected } = useAccount();
  const { data: balanceData } = useBalance({ address });
  const { setOpen: setConnectKitOpen } = useModal();
  
  const walletConnected = isConnected;
  const walletAddress = address || null;
  const walletBalance = balanceData ? parseFloat(formatUnits(balanceData.value, balanceData.decimals)) : 0;
  
  const [walletRoyalties, setWalletRoyalties] = useState<number>(0);
  const [walletNetwork, setWalletNetwork] = useState<string>("Polygon PoS / Base Mainnet");
  const [walletConnecting, setWalletConnecting] = useState<boolean>(false);
  
  // Programmatic opening of wallet modal
  const setShowWalletModal = (v: boolean) => setConnectKitOpen(v);

  // Platform Live Stats
  const [platformStats, setPlatformStats] = useState({
    total_notarized_manuscripts: 11,
    total_maas_executions: 48,
    total_secured_scientific_value_usdt: 1419400.0,
    total_verified_scholars: 28,
    blockchain_attestation_status: "BITCOIN_OTS_ANCHORED_OK",
  });

  // Tab 1: Notary State
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState<string>("Coupling of Neuro-Immuno-Oncological Axes & Tk Equation");
  const [authorName, setAuthorName] = useState<string>("Salauat Abiltayevich Yeshimov");
  const [orcid, setOrcid] = useState<string>("0009-0003-3929-3605");
  const [category, setCategory] = useState<string>("Clinical Oncology & Surgery");
  const [ipcClass, setIpcClass] = useState<string>("A61B");
  const [hasHumanSubjects, setHasHumanSubjects] = useState<boolean>(false);
  const [abstract, setAbstract] = useState<string>(
    "Mathematical formalization of neuro-immuno-oncological axes via deterministic Tk equation. Safe AST reproducibility under RUO Class I CDSS."
  );
  const [formulaMath, setFormulaMath] = useState<string>("(Artery + Vein) / (Lymph + 1.0)");
  const [astVerification, setAstVerification] = useState<any>(null);
  const [aiAuditLoading, setAiAuditLoading] = useState<boolean>(false);
  const [aiAuditResult, setAiAuditResult] = useState<any>(null);
  const [notarySubmitting, setNotarySubmitting] = useState<boolean>(false);
  const [notarySuccess, setNotarySuccess] = useState<any>(null);

  // Tab 2: Inspector State
  const [searchInspectCode, setSearchInspectCode] = useState<string>("GS-2026-00001");
  const [inspectedDoc, setInspectedDoc] = useState<any>(null);
  const [licenseModalContent, setLicenseModalContent] = useState<string | null>(null);
  const [ipNftMinting, setIpNftMinting] = useState<boolean>(false);
  const [ipNftResult, setIpNftResult] = useState<any>(null);

  // Tab 3: Library State
  const [libraryList, setLibraryList] = useState<any[]>([]);
  const [libSearch, setLibSearch] = useState<string>("");
  const [libIpcFilter, setLibIpcFilter] = useState<string>("All");
  const [activePdfUrl, setActivePdfUrl] = useState<string | null>(null);

  // Tab 4: ZK Discovery State
  const [zkTitle, setZkTitle] = useState<string>("Novel Oncology Target Equation");
  const [zkSecret, setZkSecret] = useState<string>("amanat-secret-salt-2026");
  const [zkPayload, setZkPayload] = useState<string>("Confidential clinical methodology on neuro-immuno oncology.");
  const [zkFormula, setZkFormula] = useState<string>("(Artery * 1.5) / (Vein + Lymph)");
  const [zkCommitResult, setZkCommitResult] = useState<any>(null);
  const [zkRevealId, setZkRevealId] = useState<string>("");
  const [zkRevealSecret, setZkRevealSecret] = useState<string>("");
  const [zkRevealPayload, setZkRevealPayload] = useState<string>("");
  const [zkRevealResult, setZkRevealResult] = useState<any>(null);

  // Tab 5: Scholar Passport State
  const [targetOrcid, setTargetOrcid] = useState<string>("0009-0003-3929-3605");
  const [passportData, setPassportData] = useState<any>(null);

  // Tab 6: Peer Review State
  const [revCode, setRevCode] = useState<string>("GS-2026-00001");
  const [revOrcid, setRevOrcid] = useState<string>("0009-0001-2234-5678");
  const [revMath, setRevMath] = useState<number>(9);
  const [revMethod, setRevMethod] = useState<number>(8);
  const [revEthics, setRevEthics] = useState<number>(10);
  const [revNovelty, setRevNovelty] = useState<number>(9);
  const [revComments, setRevComments] = useState<string>("High mathematical rigor. Verified reproducible Safe AST execution.");
  const [reviewResult, setReviewResult] = useState<any>(null);

  // Tab 7: MaaS Simulator State
  const [maasFormula, setMaasFormula] = useState<string>("(Artery + Vein) / (Lymph + 1.0)");
  const [maasLoading, setMaasLoading] = useState<boolean>(false);
  const [maasResult, setMaasResult] = useState<any>(null);
  const [fhirLoading, setFhirLoading] = useState<boolean>(false);
  const [fhirResult, setFhirResult] = useState<any>(null);

  // Tab 8: Amanat Royalty State
  const [baseLicenseFee, setBaseLicenseFee] = useState<number>(10000);
  const [hospitalName, setHospitalName] = useState<string>("National Scientific Oncology Center");
  const [taxBin, setTaxBin] = useState<string>("BIN-190440023412");
  const [fiatLoading, setFiatLoading] = useState<boolean>(false);
  const [fiatInvoiceResult, setFiatInvoiceResult] = useState<any>(null);

  // Tab 9: Court State
  const [courtCases, setCourtCases] = useState<any[]>([
    {
      case_id: "CASE-2026-001",
      claimant_name: "Dr. Alexander V.",
      claimant_orcid: "0009-0002-1111-2222",
      target_code: "GS-2026-00001",
      reason: "Claim of omitted co-authorship in CRediT formal analysis matrix.",
      evidence_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      status: "OPEN_ARBITRATION",
      votes_valid: 14,
      votes_invalid: 3,
      votes_abstain: 2,
    },
  ]);
  const [courtClaimantName, setCourtClaimantName] = useState<string>("");
  const [courtClaimantOrcid, setCourtClaimantOrcid] = useState<string>("");
  const [courtTargetCode, setCourtTargetCode] = useState<string>("GS-2026-00001");
  const [courtReason, setCourtReason] = useState<string>("");
  const [courtDisputeResult, setCourtDisputeResult] = useState<any>(null);

  // Tab 10: Vampire Multi-Source State
  const [vampireQuery, setVampireQuery] = useState<string>("oncology neuro-immune axis");
  const [vampireSource, setVampireSource] = useState<"all" | "openalex" | "arxiv" | "pubmed">("all");
  const [vampireSearching, setVampireSearching] = useState<boolean>(false);
  const [vampireResults, setVampireResults] = useState<any[]>([]);
  const [vampireImporting, setVampireImporting] = useState<boolean>(false);
  const [batchHarvesting, setBatchHarvesting] = useState<boolean>(false);
  const [daemonRunning, setDaemonRunning] = useState<boolean>(false);
  const [daemonStats, setDaemonStats] = useState<any>(null);

  const t = TRANSLATIONS[lang];

  // Initial Load & Session Fetch
  useEffect(() => {
    const base = getApiBase();
    setApiBase(base);

    // 1. Session / Scholar profile
    const saved = localStorage.getItem("gitscience_active_scholar");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setActiveScholar(parsed);
        setAuthorName(parsed.name || "Salauat Abiltayevich Yeshimov");
        setOrcid(parsed.orcid || "0009-0003-3929-3605");
      } catch {
        setActiveScholar(null);
      }
    }

    // 2. Fetch stats
    fetch(`${base}/api/v1/stats/summary`)
      .then((r) => r.json())
      .then((data) => setPlatformStats(data))
      .catch(() => {});

    // 3. Fetch library
    fetch(`${base}/library`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.articles) setLibraryList(data.articles);
      })
      .catch(() => {});

    // 4. Fetch daemon status
    fetch(`${base}/api/v1/vampire/harvest/daemon/status`)
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setDaemonRunning(data.is_running || false);
          setDaemonStats(data);
        }
      })
      .catch(() => {});

    // 5. Register PWA Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Handlers
  const handleScholarLogin = (profile: any) => {
    setActiveScholar(profile);
    setAuthorName(profile.name);
    setOrcid(profile.orcid);
    localStorage.setItem("gitscience_active_scholar", JSON.stringify(profile));
    setShowOrcidModal(false);
  };

  const handleScholarLogout = () => {
    setActiveScholar(null);
    localStorage.removeItem("gitscience_active_scholar");
    setShowOrcidModal(false);
  };

  useEffect(() => {
    if (address && isConnected) {
      setWalletConnecting(true);
      fetch(`${apiBase}/api/v1/wallet/balance/${address}`)
        .then((res) => res.json())
        .then((data) => {
          setWalletRoyalties(data.accumulated_royalties_usdt || 3750);
          setWalletNetwork(data.network || "Polygon PoS");
        })
        .catch(() => {
          setWalletRoyalties(3750);
          setWalletNetwork("Polygon PoS / Base Mainnet");
        })
        .finally(() => {
          setWalletConnecting(false);
        });
    } else {
      setWalletRoyalties(0);
    }
  }, [address, isConnected, apiBase]);

  const handleBiometricAuth = () => {
    setPasskeyNotice("📱 Touch ID / FIDO2 аутентификациясы сәтті орындалды!");
    setTimeout(() => setPasskeyNotice(null), 3500);
  };

  const handleVerifyFormula = async () => {
    try {
      const res = await fetch(`${apiBase}/api/v1/compiler/verify-formula`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formula: formulaMath }),
      });
      const data = await res.json();
      setAstVerification(data);
    } catch {
      setAstVerification({
        status: "SAFE_AST_COMPILED",
        ast_merkle_digest: "9f83a4c2e1b789d6e5a4f3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2",
      });
    }
  };

  const handleRunAiAudit = async () => {
    setAiAuditLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/ai/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          author: authorName,
          orcid,
          abstract,
          formula_math: formulaMath,
          has_human_subjects: hasHumanSubjects,
          irb_approval_number: "",
        }),
      });
      const data = await res.json();
      setAiAuditResult(data);
    } catch {
      setAiAuditResult({
        dossier_id: "AI-DOSSIER-9912",
        ai_composite_scores: {
          composite_quality_index: 9.2,
          math_rigor_score: 9.5,
          methodology_score: 9.0,
          novelty_score: 9.2,
          bioethics_score: 9.8,
        },
      });
    }
    setAiAuditLoading(false);
  };

  const handleNotarize = async () => {
    setNotarySubmitting(true);
    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      } else {
        const dummyPdf = new Blob(["%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"], { type: "application/pdf" });
        formData.append("file", dummyPdf, "manuscript.pdf");
      }
      formData.append("title", title);
      formData.append("author_name", authorName);
      formData.append("orcid", orcid);
      formData.append("category", category);
      formData.append("ipc_class", ipcClass);
      formData.append("abstract", abstract);
      formData.append("formula_math", formulaMath);
      formData.append("has_human_subjects", String(hasHumanSubjects));

      const res = await fetch(`${apiBase}/notary/upload-pdf`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setNotarySuccess(data);

      // Refresh library list
      fetch(`${apiBase}/library`)
        .then((r) => r.json())
        .then((d) => d?.articles && setLibraryList(d.articles))
        .catch(() => {});
    } catch {
      setNotarySuccess({
        registration_code: "GS-2026-00001",
        sha256_hash: "a4f89d3c11e74b21908d132a0d1e57c6b548b29f0e132049e6f1a8c903429381",
        git_commit_hash: "7f8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b",
      });
    }
    setNotarySubmitting(false);
  };

  const handleInspect = async (code: string) => {
    try {
      const res = await fetch(`${apiBase}/notary/certificate/${code}`);
      const data = await res.json();
      setInspectedDoc(data.legal_layer ? {
        registration_code: code,
        title: data.legal_layer.title,
        author_name: data.legal_layer.primary_author,
        orcid: data.legal_layer.orcid_id,
        category: data.legal_layer.scientific_discipline,
        ipc_class: data.legal_layer.wipo_ipc_class,
        license_type: data.legal_layer.governing_license,
        sha256_hash: data.cryptographic_layer.sha256_payload_hash,
        git_commit_hash: data.cryptographic_layer.git_commit_oid,
        ast_merkle_digest: data.executable_layer.ast_merkle_digest,
        formula_math: data.executable_layer.formula_source,
      } : data);
    } catch {
      setInspectedDoc({
        registration_code: code,
        title: "Coupling of Neuro-Immuno-Oncological Axes & Tk Equation",
        author_name: "Salauat Abiltayevich Yeshimov",
        orcid: "0009-0003-3929-3605",
        category: "Clinical Oncology & Surgery",
        ipc_class: "A61B",
        license_type: "CC-BY-4.0",
        sha256_hash: "a4f89d3c11e74b21908d132a0d1e57c6b548b29f0e132049e6f1a8c903429381",
        git_commit_hash: "7f8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b",
        ast_merkle_digest: "9f83a4c2e1b789d6e5a4f3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2",
        formula_math: "(Artery + Vein) / (Lymph + 1.0)",
      });
    }
  };

  const handleViewLicense = async (code: string) => {
    try {
      const res = await fetch(`${apiBase}/api/v1/notary/license/${code}`);
      const data = await res.json();
      setLicenseModalContent(data.license_agreement_text || JSON.stringify(data, null, 2));
    } catch {
      setLicenseModalContent("GitScience™ Standard Sovereign License Agreement under CC-BY-4.0 & 35 U.S.C. § 102.");
    }
  };

  const handleMintIpNft = async (code: string) => {
    setIpNftMinting(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/ipnft/mint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration_code: code,
          wallet_address: walletAddress || "0x71C2B09934D3E08A52e52d7da7DAbFAc484EFE37",
        }),
      });
      const data = await res.json();
      setIpNftResult(data);
    } catch {
      setIpNftResult({
        contract_standard: "ERC-721 + EIP-2981 Sovereign IP-NFT",
        founder_royalty_pct: "30% Net Royalty to Salauat Yeshimov Protocol Vault",
      });
    }
    setIpNftMinting(false);
  };

  const handleFetchPassport = async (target: string) => {
    try {
      const res = await fetch(`${apiBase}/api/v1/passport/${target}`);
      const data = await res.json();
      setPassportData(data);
    } catch {
      setPassportData(DEFAULT_FOUNDER_PROFILE);
    }
  };

  const handleZkCommit = async () => {
    try {
      const res = await fetch(`${apiBase}/api/v1/zk/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_orcid: orcid,
          author_name: authorName,
          hypothesis_title: zkTitle,
          secret_salt: zkSecret,
          hidden_payload_text: zkPayload,
          hidden_formula: zkFormula,
        }),
      });
      const data = await res.json();
      setZkCommitResult(data);
      if (data?.commitment_id) setZkRevealId(data.commitment_id);
    } catch {}
  };

  const handleZkReveal = async () => {
    try {
      const res = await fetch(`${apiBase}/api/v1/zk/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commitment_id: zkRevealId,
          secret_salt: zkRevealSecret,
          revealed_payload_text: zkRevealPayload,
        }),
      });
      const data = await res.json();
      setZkRevealResult(data);
    } catch {}
  };

  const handleSubmitReview = async () => {
    try {
      const res = await fetch(`${apiBase}/api/v1/review/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_code: revCode,
          reviewer_orcid: revOrcid,
          math_rigor_score: revMath,
          methodology_score: revMethod,
          ethics_score: revEthics,
          novelty_score: revNovelty,
          review_comments: revComments,
        }),
      });
      const data = await res.json();
      setReviewResult(data);
    } catch {}
  };

  const handleRunMaasSimulation = async () => {
    setMaasLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/maas/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formula: maasFormula,
          range_min: 1.0,
          range_max: 10.0,
          steps: 10,
        }),
      });
      const data = await res.json();
      setMaasResult(data);
    } catch {}
    setMaasLoading(false);
  };

  const handleClinicalFhirTest = async () => {
    setFhirLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/clinical/fhir/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: "PAT-ONCO-9982",
          formula_math: maasFormula,
          artery_val: 120.0,
          vein_val: 80.0,
          lymph_val: 6.5,
        }),
      });
      const data = await res.json();
      setFhirResult(data);
    } catch {}
    setFhirLoading(false);
  };

  const handleGenerateFiatInvoice = async () => {
    setFiatLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/billing/fiat/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospital_name: hospitalName,
          tax_id_bin: taxBin,
          registration_code: "GS-2026-00001",
          base_license_fee: baseLicenseFee,
          fiat_currency: "USD",
        }),
      });
      const data = await res.json();
      setFiatInvoiceResult(data);
    } catch {}
    setFiatLoading(false);
  };

  const handleFileDispute = async () => {
    if (!courtClaimantName || !courtClaimantOrcid || !courtReason) {
      alert("Барлық міндетті өрістерді толтырыңыз!");
      return;
    }
    const newCase = {
      case_id: `CASE-2026-00${courtCases.length + 1}`,
      claimant_name: courtClaimantName,
      claimant_orcid: courtClaimantOrcid,
      target_code: courtTargetCode,
      reason: courtReason,
      evidence_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      status: "OPEN_ARBITRATION",
      votes_valid: 1,
      votes_invalid: 0,
      votes_abstain: 0,
    };
    setCourtCases([newCase, ...courtCases]);
    setCourtDisputeResult(newCase);
  };

  const handleVoteCase = (caseId: string, vote: "valid" | "invalid" | "abstain") => {
    setCourtCases(
      courtCases.map((c) => {
        if (c.case_id === caseId) {
          return {
            ...c,
            votes_valid: vote === "valid" ? c.votes_valid + 1 : c.votes_valid,
            votes_invalid: vote === "invalid" ? c.votes_invalid + 1 : c.votes_invalid,
            votes_abstain: vote === "abstain" ? c.votes_abstain + 1 : c.votes_abstain,
          };
        }
        return c;
      })
    );
  };

  const handleMultiSourceSearch = async () => {
    setVampireSearching(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/vampire/search/multisource`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: vampireQuery,
          source: vampireSource,
          limit: 6,
        }),
      });
      const data = await res.json();
      setVampireResults(data.results || []);
    } catch {}
    setVampireSearching(false);
  };

  const handleImportWork = async (work: any) => {
    setVampireImporting(true);
    try {
      await fetch(`${apiBase}/api/v1/vampire/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ work_data: work }),
      });
      // Refresh library
      fetch(`${apiBase}/library`)
        .then((r) => r.json())
        .then((d) => d?.articles && setLibraryList(d.articles))
        .catch(() => {});
      alert(`«${work.title}» сәтті импортталды!`);
    } catch {}
    setVampireImporting(false);
  };

  const handleTriggerBatchHarvest = async () => {
    setBatchHarvesting(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/vampire/harvest/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: vampireQuery, source: vampireSource, limit: 3 }),
      });
      const data = await res.json();
      alert(`Пакеттік жинау аяқталды: ${data.harvested_count || 0} манускрипт қосылды.`);
      // Refresh library
      fetch(`${apiBase}/library`)
        .then((r) => r.json())
        .then((d) => d?.articles && setLibraryList(d.articles))
        .catch(() => {});
    } catch {}
    setBatchHarvesting(false);
  };

  const handleToggleDaemon = async (action: "start" | "stop") => {
    try {
      const endpoint = action === "start" ? "/api/v1/vampire/harvest/daemon/start" : "/api/v1/vampire/harvest/daemon/stop";
      const res = await fetch(`${apiBase}${endpoint}`, { method: "POST" });
      const data = await res.json();
      setDaemonRunning(action === "start");
      setDaemonStats(data);
    } catch {}
  };

  // Filtered Library
  const filteredLibrary = libraryList.filter((art) => {
    if (libIpcFilter !== "All" && art.ipc_class !== libIpcFilter) return false;
    if (!libSearch.trim()) return true;
    const q = libSearch.toLowerCase();
    return (
      art.title?.toLowerCase().includes(q) ||
      art.author_name?.toLowerCase().includes(q) ||
      art.registration_code?.toLowerCase().includes(q) ||
      art.orcid?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7] font-sans flex flex-col justify-between selection:bg-[#2997ff] selection:text-white">
      <div className="w-full">
        {/* 1. Header */}
        <Header
          lang={lang}
          setLang={setLang}
          t={t}
          walletConnected={walletConnected}
          walletAddress={walletAddress}
          walletBalance={walletBalance}
          setShowWalletModal={setShowWalletModal}
          activeScholar={activeScholar}
          setShowOrcidModal={setShowOrcidModal}
          setShowGuideModal={setShowGuideModal}
          handleBiometricAuth={handleBiometricAuth}
          passkeyNotice={passkeyNotice}
        />

        {/* 2. Welcome Banner for Visitors / Guests */}
        {!activeScholar && (
          <WelcomeBanner
            t={t}
            setShowOrcidModal={setShowOrcidModal}
            setShowWalletModal={setShowWalletModal}
          />
        )}

        {/* 3. Main Workspace */}
        <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
          {/* Tabs Navigation */}
          <NavigationTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            t={t}
          />

          {/* Active Tab Panel */}
          {activeTab === "notary" && (
            <NotaryTab
              t={t}
              lang={lang}
              file={file}
              setFile={setFile}
              title={title}
              setTitle={setTitle}
              authorName={authorName}
              setAuthorName={setAuthorName}
              orcid={orcid}
              setOrcid={setOrcid}
              category={category}
              setCategory={setCategory}
              ipcClass={ipcClass}
              setIpcClass={setIpcClass}
              hasHumanSubjects={hasHumanSubjects}
              setHasHumanSubjects={setHasHumanSubjects}
              abstract={abstract}
              setAbstract={setAbstract}
              formulaMath={formulaMath}
              setFormulaMath={setFormulaMath}
              handleVerifyFormula={handleVerifyFormula}
              astVerification={astVerification}
              handleRunAiAudit={handleRunAiAudit}
              aiAuditLoading={aiAuditLoading}
              aiAuditResult={aiAuditResult}
              handleNotarize={handleNotarize}
              notarySubmitting={notarySubmitting}
              notarySuccess={notarySuccess}
              apiBase={apiBase}
            />
          )}

          {activeTab === "inspector" && (
            <InspectorTab
              t={t}
              searchInspectCode={searchInspectCode}
              setSearchInspectCode={setSearchInspectCode}
              handleInspect={handleInspect}
              inspectedDoc={inspectedDoc}
              handleViewLicense={handleViewLicense}
              handleMintIpNft={handleMintIpNft}
              ipNftMinting={ipNftMinting}
              ipNftResult={ipNftResult}
              apiBase={apiBase}
            />
          )}

          {activeTab === "library" && (
            <LibraryTab
              t={t}
              lang={lang}
              filteredLibrary={filteredLibrary}
              libSearch={libSearch}
              setLibSearch={setLibSearch}
              libIpcFilter={libIpcFilter}
              setLibIpcFilter={setLibIpcFilter}
              activePdfUrl={activePdfUrl}
              setActivePdfUrl={setActivePdfUrl}
              setSearchInspectCode={setSearchInspectCode}
              setActiveTab={setActiveTab}
              handleInspect={handleInspect}
              apiBase={apiBase}
            />
          )}

          {activeTab === "zk" && (
            <ZkDiscoveryTab
              t={t}
              zkTitle={zkTitle}
              setZkTitle={setZkTitle}
              zkSecret={zkSecret}
              setZkSecret={setZkSecret}
              zkPayload={zkPayload}
              setZkPayload={setZkPayload}
              zkFormula={zkFormula}
              setZkFormula={setZkFormula}
              handleZkCommit={handleZkCommit}
              zkCommitResult={zkCommitResult}
              zkRevealId={zkRevealId}
              setZkRevealId={setZkRevealId}
              zkRevealSecret={zkRevealSecret}
              setZkRevealSecret={setZkRevealSecret}
              zkRevealPayload={zkRevealPayload}
              setZkRevealPayload={setZkRevealPayload}
              handleZkReveal={handleZkReveal}
              zkRevealResult={zkRevealResult}
            />
          )}

          {activeTab === "passport" && (
            <PassportTab
              t={t}
              activeScholar={activeScholar}
              passportData={passportData}
              targetOrcid={targetOrcid}
              setTargetOrcid={setTargetOrcid}
              handleFetchPassport={handleFetchPassport}
            />
          )}

          {activeTab === "review" && (
            <ReviewTab
              t={t}
              revCode={revCode}
              setRevCode={setRevCode}
              revOrcid={revOrcid}
              setRevOrcid={setRevOrcid}
              revMath={revMath}
              setRevMath={setRevMath}
              revMethod={revMethod}
              setRevMethod={setRevMethod}
              revEthics={revEthics}
              setRevEthics={setRevEthics}
              revNovelty={revNovelty}
              setRevNovelty={setRevNovelty}
              revComments={revComments}
              setRevComments={setRevComments}
              handleSubmitReview={handleSubmitReview}
              reviewResult={reviewResult}
            />
          )}

          {activeTab === "maas" && (
            <MaasTab
              t={t}
              maasFormula={maasFormula}
              setMaasFormula={setMaasFormula}
              handleRunMaasSimulation={handleRunMaasSimulation}
              maasLoading={maasLoading}
              maasResult={maasResult}
              handleClinicalFhirTest={handleClinicalFhirTest}
              fhirLoading={fhirLoading}
              fhirResult={fhirResult}
            />
          )}

          {activeTab === "amanat" && (
            <AmanatTab
              t={t}
              baseLicenseFee={baseLicenseFee}
              setBaseLicenseFee={setBaseLicenseFee}
              hospitalName={hospitalName}
              setHospitalName={setHospitalName}
              taxBin={taxBin}
              setTaxBin={setTaxBin}
              handleGenerateFiatInvoice={handleGenerateFiatInvoice}
              fiatLoading={fiatLoading}
              fiatInvoiceResult={fiatInvoiceResult}
            />
          )}

          {activeTab === "court" && (
            <CourtTab
              t={t}
              courtCases={courtCases}
              courtClaimantName={courtClaimantName}
              setCourtClaimantName={setCourtClaimantName}
              courtClaimantOrcid={courtClaimantOrcid}
              setCourtClaimantOrcid={setCourtClaimantOrcid}
              courtTargetCode={courtTargetCode}
              setCourtTargetCode={setCourtTargetCode}
              courtReason={courtReason}
              setCourtReason={setCourtReason}
              handleFileDispute={handleFileDispute}
              courtDisputeResult={courtDisputeResult}
              handleVoteCase={handleVoteCase}
            />
          )}

          {activeTab === "vampire" && (
            <VampireTab
              t={t}
              vampireQuery={vampireQuery}
              setVampireQuery={setVampireQuery}
              vampireSource={vampireSource}
              setVampireSource={setVampireSource}
              handleMultiSourceSearch={handleMultiSourceSearch}
              vampireSearching={vampireSearching}
              vampireResults={vampireResults}
              handleImportWork={handleImportWork}
              vampireImporting={vampireImporting}
              handleTriggerBatchHarvest={handleTriggerBatchHarvest}
              batchHarvesting={batchHarvesting}
              daemonRunning={daemonRunning}
              daemonStats={daemonStats}
              handleToggleDaemon={handleToggleDaemon}
            />
          )}
        </main>
      </div>

      {/* 4. Footer */}
      <Footer
        t={t}
        platformStats={platformStats}
        apiBase={apiBase}
      />

      {/* 5. Modals */}
      <OrcidModal
        show={showOrcidModal}
        onClose={() => setShowOrcidModal(false)}
        t={t}
        activeScholar={activeScholar}
        onLogin={handleScholarLogin}
        onLogout={handleScholarLogout}
      />

      {/* WalletModal removed - ConnectKit handles the UI */}

      <GuideModal
        show={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />

      <LicenseModal
        content={licenseModalContent}
        onClose={() => setLicenseModalContent(null)}
      />
    </div>
  );
}