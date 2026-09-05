import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/GitScience",
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;