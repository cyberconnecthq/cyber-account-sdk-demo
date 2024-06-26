"use client";
import WalletOptions from "@/components/WalletOptions";
import WalletAccount from "@/components/WalletAccount";
import CyberAccountSDK from "@/components/CyberAccountSDK";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-3xl font-bold">CyberAccount Demo</h1>
      <div className="flex flex-col gap-y-4 mt-8">
        <WalletOptions />
        <WalletAccount />
        <CyberAccountSDK />
      </div>
    </main>
  );
}
