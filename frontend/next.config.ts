import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.STATIC_EXPORT === "true" ? { output: "export" as const, basePath: "/GitScience" } : {}),
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;