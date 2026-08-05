import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Указываем имя твоего репозитория, чтобы стили и скрипты загружались правильно
  basePath: "/GitScience",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;