import * as React from "react";
import { useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";

const WalletOptions = () => {
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();

  return (
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
  );
};

export default WalletOptions;
