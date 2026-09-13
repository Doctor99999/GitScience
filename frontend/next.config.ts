import type { NextConfig } from "next";

// Security-заголовки для server-режима (next start / standalone за nginx).
// ВАЖНО: при STATIC_EXPORT (GitHub Pages) заголовки задаёт CDN через public/_headers.
const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://orcid.org",
      "font-src 'self' data: https://fonts.googleapis.com https://fonts.gstatic.com",
      "connect-src 'self' https://pub.orcid.org https://api.openalex.org https://export.arxiv.org https://europepmc.org https://www.ebi.ac.uk https://polygon-rpc.com https://mainnet.base.org https://gitscience-api.onrender.com http://127.0.0.1:8000 wss://relay.walletconnect.com https://*.walletconnect.com",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  ...(process.env.STATIC_EXPORT === "true"
    ? { output: "export" as const, basePath: "/GitScience" }
    : { output: "standalone" as const }),
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;