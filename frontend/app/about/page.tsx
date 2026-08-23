import Link from "next/link";

export default function AboutProtocolPage() {
  return (
    <div className="min-h-screen bg-[#070d18] text-slate-100 p-6 sm:p-12 font-sans max-w-4xl mx-auto space-y-6">
      <Link href="/" className="text-xs font-mono text-emerald-400 hover:underline inline-flex items-center gap-1">
        ← Басты бетке қайту (Return Home)
      </Link>
      
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-50">About GitScience™ Sovereign Protocol</h1>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Protocol Architect & Founder: Salauat Abiltayevich Yeshimov (ORCID: 0009-0003-3929-3605)
        </p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
        <section className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2">
          <h2 className="text-base font-bold text-emerald-400">🏛️ The 4 Statutory Pillars of GitScience™</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <strong className="text-cyan-300 block mb-1">1. 📜 Certificate (WIPO Prior Art)</strong>
              <span>Irrevocable priority timestamping under 35 U.S.C. § 102 and WIPO Paris Convention Article 4.</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <strong className="text-emerald-300 block mb-1">2. ⚖️ License (B2B MaaS)</strong>
              <span>Open-access Creative Commons along with enterprise clinical decision support agreements.</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <strong className="text-purple-300 block mb-1">3. 🛡️ Patent (Sovereign IP-NFT)</strong>
              <span>EIP-2981 compatible tokenization providing defensive shielding against patent trolls.</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <strong className="text-amber-300 block mb-1">4. 🧬 Authorship (CRediT 14 Roles)</strong>
              <span>Fair and auditable contributor role distribution linked to verified ORCID iDs.</span>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-100">Executable Science & Safe AST</h2>
          <p>
            Traditional academic publishing relies on static PDFs where equations cannot be recomputed or verified.
            GitScience introduces isolated <strong>Safe Abstract Syntax Tree (Safe AST)</strong> evaluation, enabling live mathematical homeostasis modeling across clinical oncology, physiology, and bioinformatics in sub-millisecond execution times.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-100">Preserving the Amanat of Scientific Truth</h2>
          <p>
            Rooted in the ancient ethical principle of <em>Amanat</em> (sacred trust), the protocol guarantees that every scientific contribution receives indelible credit, unalterable priority, and fair compensation.
          </p>
        </section>
      </div>
    </div>
  );
}
