import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/GitScience",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;