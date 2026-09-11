import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Web3Provider } from "./Web3Provider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0e14",
};

export const metadata: Metadata = {
  title: "GitScience™ — Sovereign Platform of Decentralized Science",
  description:
    "Sovereign platform for decentralized science: prior-art defensive publication, immutable OTS/Bitcoin timestamps, Science Court arbitration, ZK discovery guards, and executable AST-validated mathematical models.",
};

// Server-rendered structured data (schema.org). Only factual, platform-level
// nodes live here; per-manuscript ScholarlyArticle markup is served dynamically
// from the backend at /api/v1/notary/jsonld/{code} — never hardcode mock data.
const GITSCIENCE_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://gitscience.org/#organization",
      "name": "GitScience Sovereign Protocol",
      "alternateName": "GitScience",
      "url": "https://gitscience.org",
      "logo": {
        "@type": "ImageObject",
        "url": "https://gitscience.org/vitruvian-logo.jpg",
      },
      "brand": {
        "@type": "Brand",
        "name": "GitScience™",
        "slogan": "Preserving the Amanat of Scientific Truth Worldwide",
      },
      "description":
        "Sovereign platform for decentralized science: prior-art defensive publication, immutable OTS/Bitcoin timestamps, Science Court arbitration, and executable AST-validated mathematical models.",
      "knowsAbout": [
        "defensive publication",
        "prior art",
        "OpenTimestamps",
        "decentralized science",
        "DeSci",
        "science court arbitration",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://gitscience.org/#website",
      "url": "https://gitscience.org",
      "name": "GitScience™ — Sovereign Platform of Decentralized Science",
      "description":
        "Register, timestamp, verify and license your scientific manuscripts. Sovereign prior-art shield with Bitcoin-anchored proofs.",
      "publisher": { "@id": "https://gitscience.org/#organization" },
      "inLanguage": ["en", "ru", "kk"],
    },
    {
      "@type": "WebApplication",
      "@id": "https://gitscience.org/#application",
      "name": "GitScience™",
      "url": "https://gitscience.org",
      "applicationCategory": "ScienceApplication",
      "operatingSystem": "Web",
      "browserRequirements": "Requires JavaScript",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "description":
          "Free registration and timestamping for verified ORCID authors; MaaS licensing for commercial entities.",
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Anybody:wght@700;800;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(GITSCIENCE_JSONLD) }}
        />
      </head>
      <body className="min-h-full w-full flex flex-col bg-[var(--background)] overflow-x-hidden">
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}