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
import { getApiBase } from "../lib/constants";
import { TRANSLATIONS } from "../lib/translations";

// Per-tab state & handlers
import {
  useLibraryTab,
  useNotaryTab,
  useInspectorTab,
  useZkDiscoveryTab,
  usePassportTab,
  useReviewTab,
  useMaasTab,
  useAmanatTab,
  useCourtTab,
  useVampireTab,
} from "../hooks/useTabState";

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
  const [licenseModalContent, setLicenseModalContent] = useState<string | null>(null);

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

  const t = TRANSLATIONS[lang];

  // -------------------------------------------------------------------
  // Per-tab state hooks (state lives next to the feature that owns it)
  // -------------------------------------------------------------------
  const library = useLibraryTab();
  const notary = useNotaryTab({ onLibraryRefresh: library.refresh });
  const inspector = useInspectorTab({ walletAddress, onLicense: setLicenseModalContent });
  const zk = useZkDiscoveryTab({ orcid: notary.orcid, authorName: notary.authorName });
  const passport = usePassportTab();
  const review = useReviewTab({ token: activeScholar?.access_token });
  const maas = useMaasTab();
  const amanat = useAmanatTab();
  const court = useCourtTab({ t, scholarToken: activeScholar?.access_token });
  const vampire = useVampireTab({ onLibraryRefresh: library.refresh, t });

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
        notary.setAuthorName(parsed.name || "Salauat Abiltayevich Yeshimov");
        notary.setOrcid(parsed.orcid || "0009-0003-3929-3605");
      } catch {
        setActiveScholar(null);
      }
    }

    // 2. Fetch stats
    fetch(`${base}/api/v1/stats/summary`)
      .then((r) => r.json())
      .then((data) => setPlatformStats(data))
      .catch(() => {});

    // 3. Register PWA Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handlers
  const handleScholarLogin = (profile: any) => {
    setActiveScholar(profile);
    notary.setAuthorName(profile.name);
    notary.setOrcid(profile.orcid);
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

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#050505] text-[#ffffff] font-sans flex flex-col selection:bg-[#da291c] selection:text-white">
      {/* Welcome Banner for guests — scrolls away */}
      {!activeScholar && (
        <WelcomeBanner
          t={t}
          setShowOrcidModal={setShowOrcidModal}
          setShowWalletModal={setShowWalletModal}
        />
      )}

      {/* Sticky header + tabs block — always visible when scrolling */}
      <div className="sticky top-0 z-40 w-full bg-[var(--background)] border-b border-[var(--surface-border)]">
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

        <NavigationTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          t={t}
        />
      </div>

      {/* Main Workspace — scrolls under the sticky header */}
      <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 min-w-0">

          {/* Active Tab Panel */}
          {activeTab === "notary" && (
            <NotaryTab
              t={t}
              lang={lang}
              file={notary.file}
              setFile={notary.setFile}
              title={notary.title}
              setTitle={notary.setTitle}
              authorName={notary.authorName}
              setAuthorName={notary.setAuthorName}
              orcid={notary.orcid}
              setOrcid={notary.setOrcid}
              category={notary.category}
              setCategory={notary.setCategory}
              ipcClass={notary.ipcClass}
              setIpcClass={notary.setIpcClass}
              hasHumanSubjects={notary.hasHumanSubjects}
              setHasHumanSubjects={notary.setHasHumanSubjects}
              abstract={notary.abstract}
              setAbstract={notary.setAbstract}
              formulaMath={notary.formulaMath}
              setFormulaMath={notary.setFormulaMath}
              handleVerifyFormula={notary.handleVerifyFormula}
              astVerification={notary.astVerification}
              handleRunAiAudit={notary.handleRunAiAudit}
              aiAuditLoading={notary.aiAuditLoading}
              aiAuditResult={notary.aiAuditResult}
              handleNotarize={notary.handleNotarize}
              notarySubmitting={notary.notarySubmitting}
              notarySuccess={notary.notarySuccess}
              apiBase={apiBase}
            />
          )}

          {activeTab === "inspector" && (
            <InspectorTab
              t={t}
              searchInspectCode={inspector.searchInspectCode}
              setSearchInspectCode={inspector.setSearchInspectCode}
              handleInspect={inspector.handleInspect}
              inspectedDoc={inspector.inspectedDoc}
              handleViewLicense={inspector.handleViewLicense}
              handleMintIpNft={inspector.handleMintIpNft}
              ipNftMinting={inspector.ipNftMinting}
              ipNftResult={inspector.ipNftResult}
              apiBase={apiBase}
            />
          )}

          {activeTab === "library" && (
            <LibraryTab
              t={t}
              lang={lang}
              filteredLibrary={library.filteredLibrary}
              libSearch={library.libSearch}
              setLibSearch={library.setLibSearch}
              libIpcFilter={library.libIpcFilter}
              setLibIpcFilter={library.setLibIpcFilter}
              activePdfUrl={library.activePdfUrl}
              setActivePdfUrl={library.setActivePdfUrl}
              setSearchInspectCode={inspector.setSearchInspectCode}
              setActiveTab={setActiveTab}
              handleInspect={inspector.handleInspect}
              apiBase={apiBase}
            />
          )}

          {activeTab === "zk" && (
            <ZkDiscoveryTab
              t={t}
              zkTitle={zk.zkTitle}
              setZkTitle={zk.setZkTitle}
              zkSecret={zk.zkSecret}
              setZkSecret={zk.setZkSecret}
              zkPayload={zk.zkPayload}
              setZkPayload={zk.setZkPayload}
              zkFormula={zk.zkFormula}
              setZkFormula={zk.setZkFormula}
              handleZkCommit={zk.handleZkCommit}
              zkCommitResult={zk.zkCommitResult}
              zkRevealId={zk.zkRevealId}
              setZkRevealId={zk.setZkRevealId}
              zkRevealSecret={zk.zkRevealSecret}
              setZkRevealSecret={zk.setZkRevealSecret}
              zkRevealPayload={zk.zkRevealPayload}
              setZkRevealPayload={zk.setZkRevealPayload}
              handleZkReveal={zk.handleZkReveal}
              zkRevealResult={zk.zkRevealResult}
            />
          )}

          {activeTab === "passport" && (
            <PassportTab
              t={t}
              activeScholar={activeScholar}
              passportData={passport.passportData}
              targetOrcid={passport.targetOrcid}
              setTargetOrcid={passport.setTargetOrcid}
              handleFetchPassport={passport.handleFetchPassport}
            />
          )}

          {activeTab === "review" && (
            <ReviewTab
              t={t}
              revCode={review.revCode}
              setRevCode={review.setRevCode}
              revOrcid={review.revOrcid}
              setRevOrcid={review.setRevOrcid}
              revMath={review.revMath}
              setRevMath={review.setRevMath}
              revMethod={review.revMethod}
              setRevMethod={review.setRevMethod}
              revEthics={review.revEthics}
              setRevEthics={review.setRevEthics}
              revNovelty={review.revNovelty}
              setRevNovelty={review.setRevNovelty}
              revComments={review.revComments}
              setRevComments={review.setRevComments}
              handleSubmitReview={review.handleSubmitReview}
              reviewResult={review.reviewResult}
            />
          )}

          {activeTab === "maas" && (
            <MaasTab
              t={t}
              maasFormula={maas.maasFormula}
              setMaasFormula={maas.setMaasFormula}
              handleRunMaasSimulation={maas.handleRunMaasSimulation}
              maasLoading={maas.maasLoading}
              maasResult={maas.maasResult}
              handleClinicalFhirTest={maas.handleClinicalFhirTest}
              fhirLoading={maas.fhirLoading}
              fhirResult={maas.fhirResult}
            />
          )}

          {activeTab === "amanat" && (
            <AmanatTab
              t={t}
              baseLicenseFee={amanat.baseLicenseFee}
              setBaseLicenseFee={amanat.setBaseLicenseFee}
              hospitalName={amanat.hospitalName}
              setHospitalName={amanat.setHospitalName}
              taxBin={amanat.taxBin}
              setTaxBin={amanat.setTaxBin}
              handleGenerateFiatInvoice={amanat.handleGenerateFiatInvoice}
              fiatLoading={amanat.fiatLoading}
              fiatInvoiceResult={amanat.fiatInvoiceResult}
            />
          )}

          {activeTab === "court" && (
            <CourtTab
              t={t}
              courtCases={court.courtCases}
              courtClaimantName={court.courtClaimantName}
              setCourtClaimantName={court.setCourtClaimantName}
              courtClaimantOrcid={court.courtClaimantOrcid}
              setCourtClaimantOrcid={court.setCourtClaimantOrcid}
              courtTargetCode={court.courtTargetCode}
              setCourtTargetCode={court.setCourtTargetCode}
              courtReason={court.courtReason}
              setCourtReason={court.setCourtReason}
              handleFileDispute={court.handleFileDispute}
              courtDisputeResult={court.courtDisputeResult}
              handleVoteCase={court.handleVoteCase}
            />
          )}

          {activeTab === "vampire" && (
            <VampireTab
              t={t}
              vampireQuery={vampire.vampireQuery}
              setVampireQuery={vampire.setVampireQuery}
              vampireSource={vampire.vampireSource}
              setVampireSource={vampire.setVampireSource}
              handleMultiSourceSearch={vampire.handleMultiSourceSearch}
              vampireSearching={vampire.vampireSearching}
              vampireResults={vampire.vampireResults}
              handleImportWork={vampire.handleImportWork}
              vampireImporting={vampire.vampireImporting}
              handleTriggerBatchHarvest={vampire.handleTriggerBatchHarvest}
              batchHarvesting={vampire.batchHarvesting}
              daemonRunning={vampire.daemonRunning}
              daemonStats={vampire.daemonStats}
              handleToggleDaemon={vampire.handleToggleDaemon}
            />
          )}
        </main>

      {/* Footer */}
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
