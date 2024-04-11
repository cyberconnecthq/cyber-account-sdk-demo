import * as React from "react";
import { useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { Button } from "@/components/ui/button";
import { polygonMumbai } from "viem/chains";

const WalletOptions = () => {
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const handleSwitch = () => switchChain({ chainId: polygonMumbai.id });

  return (
    <div className="flex flex-col gap-y-4 items-center">
      <div className="flex gap-x-8 justify-center">
        {connectors.map((connector) => (
          <Button key={connector.uid} onClick={() => connect({ connector })}>
            {connector.name}
          </Button>
        ))}

        <Button variant="outline" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
      <p className="w-full">Make sure switching to Polygon Mumbai</p>
      <Button className="w-full" onClick={handleSwitch}>
        Switch to Polygon
      </Button>
    </div>
  );
};

export default WalletOptions;
