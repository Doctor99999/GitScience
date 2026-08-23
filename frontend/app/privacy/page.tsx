import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#070d18] text-slate-100 p-6 sm:p-12 font-sans max-w-4xl mx-auto space-y-6">
      <Link href="/" className="text-xs font-mono text-emerald-400 hover:underline inline-flex items-center gap-1">
        ← Басты бетке қайту (Return Home)
      </Link>
      
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-50">GitScience™ Privacy & Data Governance</h1>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Compliant with ISO 14721 OAIS, GDPR Article 89 (Scientific Research), and HIPAA De-Identification
        </p>
      </div>

      <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-emerald-400">1. Zero-Knowledge Proofs & Confidentiality</h2>
          <p>
            GitScience allows researchers to deposit pre-publication discoveries via blind SHA-256 commitments without revealing underlying formulas or proprietary hypothesis texts until explicitly unlocked.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-cyan-400">2. ORCID & Scholar Identifiers</h2>
          <p>
            ORCID iDs, institutional affiliations, and publication metadata are indexed solely to establish immutable scientific priority and legitimate royalty distribution. We do not sell or monetize personal researcher telemetry.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-purple-400">3. Human Subjects & Bioethics Compliance</h2>
          <p>
            Any manuscript involving patient clinical data must declare ethical approval (IRB/LEK approval code) in compliance with the WMA Declaration of Helsinki. Patient identifiable data is strictly forbidden from public depository payloads.
          </p>
        </section>
      </div>
    </div>
  );
}
