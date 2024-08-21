"use client";
import { useState } from "react";
import WalletOptions from "@/components/WalletOptions";
import WalletAccount from "@/components/WalletAccount";
import CyberAccountSDK from "@/components/CyberAccountSDK";
import { useAccount } from "wagmi";
import { testnetChains } from "../rpcClient";

export default function Home() {
  const { address, chainId } = useAccount();
  const [currentChain, setCurrentChain] = useState(
    testnetChains.find((c) => c.id === chainId) || testnetChains[0],
  );

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-3xl font-bold">CyberAccount Demo</h1>
      <div className="flex flex-col gap-y-4 mt-8">
        <WalletOptions
          selectedChain={currentChain}
          setSelectedChain={setCurrentChain}
        />
        <WalletAccount />
        <CyberAccountSDK key={address} currentChain={currentChain} />
      </div>
    </main>
  );
}
