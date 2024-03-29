"use client";
import WalletOptions from "@/components/WalletOptions";
import WalletAccount from "@/components/WalletAccount";
import CyberAccount from "@/components/CyberAccount";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-3xl font-bold">CyberAccount SDK V2 Demo</h1>
      <div className="flex flex-col gap-y-4 mt-8">
        <WalletOptions />
        <WalletAccount />
        <CyberAccount />
      </div>
    </main>
  );
}
