import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GitScience™ — Суверенная платформа децентрализованной науки",
  description: "Интерактивные научные манускрипты, исполняемые AST-формулы и децентрализованный нотариат.",
  other: {
    // Академические метатеги Highwire Press для Google Scholar
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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}