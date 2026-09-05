import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Web3Provider } from "./Web3Provider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0b0e14",
};

export const metadata: Metadata = {
  title: "GitScience™ — Sovereign Platform of Decentralized Science",
  description: "Interactive scientific manuscripts, executable AST formulas, and decentralized notary.",
  other: {
    // Academic Highwire Press metadata for Google Scholar
    "citation_title": "Клиническая оценка риска коронарных осложнений и валидация моделей",
    "citation_author": "Yeshimov, Salauat Abiltaevich",
    "citation_publication_date": "2026/06/01",
    "citation_journal_title": "GitScience™ Open Repository",
    "citation_issn": "2949-0000",
    "citation_pdf_url": "https://gitscience.org/api/v1/manuscript/export/pdf",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Anybody:wght@700;800;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full w-full flex flex-col bg-[var(--background)] overflow-x-hidden">
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}