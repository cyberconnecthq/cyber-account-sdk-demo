"use client";
import React from "react";
import { http, createConfig } from "wagmi";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { testnetChains } from "@/rpcClient";

const queryClient = new QueryClient();
const config = createConfig({
  chains: testnetChains,
  transports: testnetChains.reduce(
    (acc, chain) => ({
      ...acc,
      [chain.id]: http(),
    }),
    {},
  ),
});

const Provider = ({ children }: { children: React.ReactNode }) => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </WagmiProvider>
);

export default Provider;
