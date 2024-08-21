import * as React from "react";
import { useConnect, useDisconnect, useSwitchChain, useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { testnetChains } from "../rpcClient";
import * as Select from "@radix-ui/react-select";

const WalletOptions = () => {
  const { chainId, address } = useAccount();
  const { connectors, connect } = useConnect();
  const { switchChain, switchChainAsync } = useSwitchChain();
  const { disconnect } = useDisconnect();
  const [selectedChain, setSelectedChain] = React.useState(
    testnetChains.find((c) => c.id === chainId) || testnetChains[0]
  );
  React.useEffect(() => {
    if (address) {
      if (chainId !== selectedChain.id) {
        switchChainAsync({
          chainId: selectedChain.id,
        }).catch((err) => {
          console.error("🚀 ~ WalletOptions ~ switch chain - err", err);
        });
      }
    }
  }, [address, chainId, selectedChain.id, switchChainAsync]);

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
      <Select.Root
        defaultValue={selectedChain.id.toString()}
        onValueChange={(value) => {
          const _selectedChain = testnetChains.find(
            (c) => c.id.toString() === value
          );
          if (_selectedChain) {
            setSelectedChain(_selectedChain);
            switchChainAsync({
              chainId: _selectedChain.id,
            }).catch((err) => {
              console.error("🚀 ~ WalletOptions ~ switch chain - err", err);
            });
          }
        }}
      >
        <Select.Trigger>
          <Select.Value
            placeholder="select a network"
            className="w-full font-bold text-left"
          >
            Network: {selectedChain.name}
          </Select.Value>
          <Select.Icon />
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            className="z-10 bg-white px-4 py-8 shadow-2xl"
            position="popper"
          >
            <Select.ScrollUpButton />
            <Select.Viewport>
              <Select.Group>
                {testnetChains.map((chain) => (
                  <Select.Item
                    className="cursor-pointer"
                    key={chain.id}
                    value={chain.id.toString()}
                    onSelect={() => {
                      setSelectedChain(chain);
                      switchChain({
                        chainId: chain.id,
                      });
                    }}
                  >
                    {chain.name}
                  </Select.Item>
                ))}
              </Select.Group>
            </Select.Viewport>
            <Select.ScrollDownButton />
            <Select.Arrow />
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
};

export default WalletOptions;
