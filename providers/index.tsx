"use client";
import React from "react";
import { http, createConfig } from "wagmi";
import { polygonMumbai } from "wagmi/chains";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();
const config = createConfig({
  chains: [polygonMumbai],
  transports: {
    [polygonMumbai.id]: http("https://polygon-mumbai-pokt.nodies.app"),
  },
});

const Provider = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <WagmiProvider config={config}>{children}</WagmiProvider>
  </QueryClientProvider>
);

export default Provider;
