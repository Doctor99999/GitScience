import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Включаем статическую генерацию для развертывания на GitHub Pages
  output: "export",
  
  // Отключаем серверную оптимизацию изображений, так как GitHub Pages — статический хостинг
  images: {
    unoptimized: true,
  },
};

export default nextConfig;