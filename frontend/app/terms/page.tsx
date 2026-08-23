import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#070d18] text-slate-100 p-6 sm:p-12 font-sans max-w-4xl mx-auto space-y-6">
      <Link href="/" className="text-xs font-mono text-emerald-400 hover:underline inline-flex items-center gap-1">
        ← Басты бетке қайту (Return Home)
      </Link>
      
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-50">GitScience™ Protocol Terms of Service</h1>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Last Updated: 2026-08-23 • Statutory Prior Art & Fair-Share Consensus (55/15/30)
        </p>
      </div>

      <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-emerald-400">1. Statutory Prior Art Disclosure</h2>
          <p>
            GitScience provides irrevocable cryptographic priority timestamping in accordance with 
            <strong> 35 U.S.C. § 102</strong> (United States Patent Act), 
            <strong> EPC Article 54(2)</strong> (European Patent Convention), and 
            <strong> WIPO Paris Convention Article 4</strong>. Deposited manuscripts receive permanent SHA-256 and Bitcoin OTS anchors.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-cyan-400">2. Research Use Only (RUO) & Clinical CDSS Notice</h2>
          <p>
            All mathematical models, AST evaluations, and MaaS endpoints are distributed strictly under 
            <strong> Research Use Only (RUO Class I)</strong> guidelines. Deterministic simulations are intended for peer review, validation, and academic discourse, not unverified autonomous medical decisions.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-purple-400">3. Amanat Fair-Share Revenue Consensus (55/15/30)</h2>
          <p>
            Commercial institutional licensing proceeds are routed strictly per protocol consensus:
            <br />• <strong>55% Author Pool:</strong> Distributed to authors based on CRediT CASRAI contributor weights.
            <br />• <strong>15% Infrastructure & Peer Review Pool:</strong> Compensating independent peer reviewers and node operators.
            <br />• <strong>30% Protocol Founder Treasury:</strong> Reserved for founder R&D and core network stewardship.
            <br />• <strong>+20% B2B Gross-Up:</strong> Institutional surcharge levied on corporate buyers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-amber-400">4. Scientific Court & Decentralized Arbitration</h2>
          <p>
            Disputes over prior art priority, plagiarism, or author omission are adjudicated transparently via the Science Court jury staking protocol.
          </p>
        </section>
      </div>
    </div>
  );
}
