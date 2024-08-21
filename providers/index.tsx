"use client";
import React from "react";
import { http, createConfig } from "wagmi";
import { optimismSepolia } from "wagmi/chains";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { testnetChains } from "@/rpcClient";

const queryClient = new QueryClient();
const config = createConfig({
  chains: [
    {
      ...optimismSepolia,
      blockExplorers: {
        default: {
          name: "OP Sepolia Network Explorer",
          url: "https://sepolia-optimism.etherscan.io",
        },
      },
    },
    ...testnetChains,
  ],
  transports: {
    [optimismSepolia.id]: http("https://sepolia.optimism.io	"),
  },
});

const Provider = ({ children }: { children: React.ReactNode }) => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </WagmiProvider>
);

export default Provider;
