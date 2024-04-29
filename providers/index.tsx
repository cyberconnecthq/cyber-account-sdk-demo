"use client";
import React from "react";
import { http, createConfig } from "wagmi";
import { polygonAmoy } from "wagmi/chains";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();
const config = createConfig({
  chains: [polygonAmoy],
  transports: {
    [polygonAmoy.id]: http("https://polygon-amoy.blockpi.network/v1/rpc/public"),
  },
});

const Provider = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <WagmiProvider config={config}>{children}</WagmiProvider>
  </QueryClientProvider>
);

export default Provider;
