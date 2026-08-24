"use client";

import React, { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, polygon, base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

// Setup queryClient
const queryClient = new QueryClient();

// Create Wagmi config
const config = createConfig(
  getDefaultConfig({
    // Your dApp's chains
    chains: [polygon, base, mainnet],
    transports: {
      [polygon.id]: http(process.env.NEXT_PUBLIC_POLYGON_RPC_URL || "https://polygon-rpc.com"),
      [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org"),
      [mainnet.id]: http(),
    },
    
    // Required ConnectKit Configuration
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo_project_id",

    // Required App Info
    appName: "GitScience Sovereign Protocol",
    appDescription: "Decentralized Prior Art Notary & MAAS Evaluator",
    appUrl: "https://gitscience.org",
    appIcon: "https://gitscience.org/favicon.ico", // Or appropriate icon
  })
);

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider 
          mode="dark" 
          customTheme={{
            "--ck-font-family": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            "--ck-body-background": "#0b1322",
            "--ck-border-radius": "12px",
            "--ck-primary-button-background": "#0f172a",
            "--ck-primary-button-hover-background": "#1e293b",
          }}
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
