import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Hex } from "viem";
import { optimismSepolia } from "viem/chains";
import { Loader2 } from "lucide-react";

const SwapSigner = ({
  cyberAccount,
  swap,
  loading,
  hash,
}: {
  cyberAccount?: string;
  swap: (newSigner?: Hex) => Promise<void>;
  loading: boolean;
  hash?: string;
}) => {
  const [newSigner, setNewSigner] = useState<Hex>();

  return (
    <div className="w-full border-2 border-black rounded-md p-4 flex flex-col items-center gap-y-4">
      <p className="text-lg font-bold">Change Signer</p>
      <Input
        placeholder="New Signer Address"
        onChange={(e) => setNewSigner(e.target.value as Hex)}
      />
      <Button
        className="w-full"
        onClick={() => swap(newSigner)}
        disabled={!cyberAccount}
      >
        {loading ? <Loader2 className="animate-spin" /> : "Change"}
      </Button>
      <div>
        Change Signer Result:{" "}
        {hash ? (
          <a
            className="text-blue-500"
            target="_blank"
            href={"https://sepolia-optimism.etherscan.io/tx/" + hash}
          >
            Transaction Hash
          </a>
        ) : (
          "-"
        )}
      </div>
    </div>
  );
};

export default SwapSigner;
