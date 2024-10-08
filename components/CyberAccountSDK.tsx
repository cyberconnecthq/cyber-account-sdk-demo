import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  useAccount,
  usePublicClient,
  useWalletClient,
  useConfig,
  useSignMessage,
} from "wagmi";
import {
  encodeAbiParameters,
  encodeFunctionData,
  hexToBytes,
  parseAbi,
  parseAbiParameters,
  encodePacked,
  type Hex,
  type Address,
  type Chain,
} from "viem";
import { Button } from "@/components/ui/button";
import { ParamOperator } from "@zerodev/session-key";
import {
  CyberBundler,
  CyberAccount,
  CyberPaymaster,
  CyberAccountNotDeployedError,
  getAllCyberAccounts,
} from "@cyberlab/cyber-account";
import { walletClientToSmartAccountSigner } from "permissionless";
import {
  createSessionKeyAccount,
  createSessionKeyAccountClient,
  serializeSessionKeyAccount,
  deserializeSessionKeyAccount,
  type SessionKeyAccount,
  type SessionKeyAccountClient,
} from "@cyberlab/cyber-account-plugins";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import SwapSigner from "./SwapSigner";
import { useWriteContract } from "wagmi";
import abi from "@/app/abi.json";
import { Hash } from "viem";

const sessionPrivateKey = generatePrivateKey();
const sessionKeySigner = privateKeyToAccount(sessionPrivateKey);

BigInt.prototype.toJSON = function () {
  return this.toString();
};

const APP_ID = "6c6e8152-5343-4505-81a3-cf97cf5873ca";
const BUNDLER_RPC = `https://api.stg.cyberconnect.dev/cyberaccount/bundler/v1/rpc`;
const PAYMASTER_URL = `https://api.stg.cyberconnect.dev/cyberaccount/paymaster/v1/rpc`;

const contractAddress = "0x34bE7f35132E97915633BC1fc020364EA5134863";

const contractABI = parseAbi([
  "function mint(address _to) public",
  "function balanceOf(address owner) external view returns (uint256 balance)",
]);

function CyberAccountSDK({ currentChain }: { currentChain: Chain }) {
  const [cyberAccount, setCyberAccount] = useState<CyberAccount>();
  const [currentOwnerAddress, setCurrentOwnerAddress] = useState<
    Address | undefined | false
  >();
  const [isChanged, setIsChanged] = useState<boolean | undefined>(undefined);
  const [isDeployed, setIsDeployed] = useState<boolean | undefined>(undefined);
  const [cyberAccountsByEOA, setCyberAccountsByEOA] =
    useState<CyberAccount[]>();

  const [sessionKeyAccount, setSessionKeyAccount] =
    useState<SessionKeyAccount>();

  const [sessionKeyAccountClient, setSessionKeyAccountClient] =
    useState<SessionKeyAccountClient>();

  const [serializedSessionKeyAccount, setSerializedSessionKeyAccount] =
    useState<string>();

  const [deserializedSessionKeyAccount, setDeserializedSessionKeyAccount] =
    useState<SessionKeyAccount>();

  const [
    deserializedSessionKeyAccountClient,
    setDeserializedSessionKeyAccountClient,
  ] = useState<SessionKeyAccountClient>();

  const [mintWithCyberAccountHash, setMintWithCyberAccountHash] = useState<{
    address: Address;
    hash: string;
  }>();
  const [mintWithSessionKeyAccountHash, setMintWithSessionKeyAccountHash] =
    useState<string>();

  const [mintingWithCyberAccount, setMintingWithCyberAccount] = useState("");
  const [swapingSigner, setSwapingSigner] = useState("");
  const [swapSignerHash, setSwapSignerHash] = useState<{
    address: Address;
    hash: string;
  }>();
  const [mintingWithSessionKeyAccount, setMintingWithSessionKeyAccount] =
    useState(false);

  const [generatingSessionKeyAccount, setGeneratingSessionKeyAccount] =
    useState(false);

  const [creatingSessionKeyAccountClient, setCreatingSessionKeyAccountClient] =
    useState(false);
  const [serializingSessionKeyAccount, setSerializingSessionKeyAccount] =
    useState(false);
  const [deserializingSessionKeyAccount, setDeserializingSessionKeyAccount] =
    useState(false);

  const [
    mintingWithDeserializedSessionKeyAccount,
    setMintingWithDeserializedSessionKeyAccount,
  ] = useState(false);

  const [
    mintWithDeserializedSessionKeyAccountHash,
    setMintWithDeserializedSessionKeyAccountHash,
  ] = useState<string>();

  const { address: eoaAddress } = useAccount();
  const config = useConfig();
  const publicClient = usePublicClient({ config });
  const walletClientQuery = useWalletClient({
    account: eoaAddress,
  });
  const { signMessageAsync } = useSignMessage();
  const { writeContract } = useWriteContract();

  useEffect(() => {
    if (!eoaAddress) {
      return;
    }

    const cyberBundler = new CyberBundler({
      rpcUrl: BUNDLER_RPC,
      appId: APP_ID,
    });

    const sign = async (message: Hex) => {
      return await signMessageAsync({
        account: eoaAddress,
        message: { raw: message },
      });
    };

    const cyberPaymaster = new CyberPaymaster({
      rpcUrl: PAYMASTER_URL,
      appId: APP_ID,
      generateJwt: async (cyberAccount: string) => {
        const authResponse = await fetch("/api/auth", {
          method: "POST",
          body: JSON.stringify({ sender: cyberAccount }),
        }).then((res) => res.json());

        return authResponse.token;
      },
    });

    const cyberAccount = new CyberAccount({
      chain: {
        id: currentChain.id,
        testnet: true,
      },
      owner: {
        address: eoaAddress,
        signMessage: sign,
      },
      bundler: cyberBundler,
      // paymaster: cyberPaymaster,
    });

    cyberAccount
      .checkOwner()
      .then((res) => {
        setIsChanged(res.isChanged);
        setIsDeployed(true);
        if (res.isChanged) {
          setCurrentOwnerAddress(res.currentOwner);
        } else {
          setCurrentOwnerAddress(false);
        }
      })
      .catch((e) => {
        if (e instanceof CyberAccountNotDeployedError) {
          setCurrentOwnerAddress(false);
          setIsChanged(false);
          setIsDeployed(false);
        }
      });
    setCyberAccount(cyberAccount);
  }, [eoaAddress, signMessageAsync, currentChain]);

  useEffect(() => {
    if (!eoaAddress) return;
    const sign = async (message: Hex) => {
      return await signMessageAsync({
        account: eoaAddress,
        message: { raw: message },
      });
    };

    const cyberBundler = new CyberBundler({
      rpcUrl: BUNDLER_RPC,
      appId: APP_ID,
    });

    getAllCyberAccounts({
      chain: {
        id: currentChain.id,
        testnet: true,
      },
      owner: {
        address: eoaAddress,
        signMessage: sign,
      },
      bundler: cyberBundler,
    }).then((accounts) => {
      setCyberAccountsByEOA(accounts);
    });
  }, [eoaAddress, signMessageAsync, currentChain?.id]);

  const handleSwapSigner = async (
    cyberAccount?: CyberAccount,
    newSigner?: Hex,
  ) => {
    if (newSigner && cyberAccount) {
      setSwapingSigner(cyberAccount.address);
      const res = await cyberAccount
        .sendTransaction({
          to: "0x417f5a41305DDc99D18B5E176521b468b2a31B86",
          data: encodeFunctionData({
            abi: abi,
            functionName: "enable",
            args: [encodePacked(["bytes"], [newSigner])],
          }),
        })
        .finally(() => {
          setSwapingSigner("");
        });

      if (res) {
        setSwapSignerHash({ address: cyberAccount.address, hash: res });
      }
    }
  };

  const mint = async ({ cyberAccount }: { cyberAccount: CyberAccount }) => {
    if (!cyberAccount) return;

    setMintingWithCyberAccount(cyberAccount.address);
    const res = await cyberAccount
      .sendTransaction({
        to: contractAddress,
        value: BigInt(0),
        data: encodeFunctionData({
          abi: contractABI,
          functionName: "mint",
          args: [cyberAccount.address],
        }),
      })
      .finally(() => {
        setMintingWithCyberAccount("");
      });

    if (res) {
      setMintWithCyberAccountHash({ address: cyberAccount.address, hash: res });
    }
  };

  const createClient = async () => {
    if (!sessionKeyAccount || !cyberAccount) return;

    setCreatingSessionKeyAccountClient(true);

    const sessionKeyAccountClient = await createSessionKeyAccountClient(
      sessionKeyAccount,
      cyberAccount,
    );

    setCreatingSessionKeyAccountClient(false);
    setSessionKeyAccountClient(sessionKeyAccountClient);
  };

  const createClientWithDeseralizedSessionKeyAccount = async () => {
    if (!deserializedSessionKeyAccount || !cyberAccount) return;

    const sessionKeyAccountClient = await createSessionKeyAccountClient(
      deserializedSessionKeyAccount,
      cyberAccount,
    );

    setDeserializedSessionKeyAccountClient(sessionKeyAccountClient);
  };

  const generateSessionKeyAccount = async () => {
    // @ts-ignore
    const signer = walletClientToSmartAccountSigner(walletClientQuery.data);
    if (!cyberAccount) {
      return;
    }
    setGeneratingSessionKeyAccount(true);
    const sessionKeyAccount = await createSessionKeyAccount({
      signer,
      cyberAccount,
      sessionKeySigner,
      validatorData: {
        // paymaster: oneAddress,
        permissions: [
          {
            target: contractAddress,
            valueLimit: BigInt(0),
            abi: contractABI,
            functionName: "mint",
            args: [
              {
                operator: ParamOperator.EQUAL,
                value: cyberAccount.address,
              },
            ],
          },
        ],
      },
    });

    setGeneratingSessionKeyAccount(false);

    setSessionKeyAccount(sessionKeyAccount);
  };

  const serialize = async () => {
    if (!sessionKeyAccount || !cyberAccount || !publicClient) return;

    setSerializingSessionKeyAccount(true);

    const serializedAccount = await serializeSessionKeyAccount(
      sessionKeyAccount,
      sessionPrivateKey,
    );

    setSerializingSessionKeyAccount(false);
    setSerializedSessionKeyAccount(serializedAccount);
  };

  const deserialize = async () => {
    if (!serializedSessionKeyAccount || !cyberAccount?.publicClient) {
      return;
    }

    setDeserializingSessionKeyAccount(true);
    const deserializedSessionKeyAccount = await deserializeSessionKeyAccount(
      cyberAccount.publicClient,
      serializedSessionKeyAccount,
    );

    setDeserializingSessionKeyAccount(false);
    setDeserializedSessionKeyAccount(deserializedSessionKeyAccount);
  };

  const mintWithSessionKeyAccount = async () => {
    if (sessionKeyAccountClient && cyberAccount) {
      setMintingWithSessionKeyAccount(true);

      const res = await sessionKeyAccountClient?.sendTransaction({
        to: contractAddress,
        value: BigInt(0),
        data: encodeFunctionData({
          abi: contractABI,
          functionName: "mint",
          args: [cyberAccount.address],
        }),
      });

      setMintingWithSessionKeyAccount(false);
      setMintWithSessionKeyAccountHash(res);
    }
  };

  const mintWithDeserializedSessionKeyAccount = async () => {
    if (deserializedSessionKeyAccountClient && cyberAccount) {
      setMintingWithDeserializedSessionKeyAccount(true);

      const res = await deserializedSessionKeyAccountClient?.sendTransaction({
        to: contractAddress,
        value: BigInt(0),
        data: encodeFunctionData({
          abi: contractABI,
          functionName: "mint",
          args: [cyberAccount.address],
        }),
      });

      setMintingWithDeserializedSessionKeyAccount(false);
      setMintWithDeserializedSessionKeyAccountHash(res);
    }
  };

  return (
    <div className="flex flex-col gap-y-8 w-[500px]">
      <div className="flex flex-col gap-y-2 justify-center">
        <p className="text-lg font-bold mt-3">CyberAccount</p>
        <div>
          <span className="font-bold text-sm"> Address </span>:{" "}
          {cyberAccount?.address || "-"}
        </div>
        <div>
          <span className="font-bold text-sm">Deployed: </span>
          {isDeployed !== undefined ? isDeployed.toString() : "-"}
        </div>
        <div>
          <span className="font-bold text-sm">Owner Changed: </span>
          {isChanged !== undefined ? isChanged.toString() : "-"}
        </div>
        <div>
          <span className="font-bold text-sm">Current Owner Address: </span>
          {currentOwnerAddress !== undefined
            ? currentOwnerAddress || cyberAccount?.owner.address
            : "-"}
        </div>
        {isChanged && (
          <p className="text-red-500 text-sm">
            This CyberAccount has been changed to a new owner. Switch to the new
            owner to send transactions.
          </p>
        )}
        <p className="text-lg font-bold mt-8">All CyberAccounts by EOA</p>
        <div className="divide-y flex flex-col gap-y-4 divide-black divide-dotted">
          {(cyberAccountsByEOA?.length ?? 0) > 0
            ? cyberAccountsByEOA?.map((account) => (
                <div
                  key={account.address}
                  className="flex flex-col gap-y-4 pt-4"
                >
                  <div>Address: {account.address}</div>
                  <Button
                    onClick={() => mint({ cyberAccount: account })}
                    disabled={!cyberAccount}
                  >
                    {mintingWithCyberAccount === account.address ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Mint with this CyberAccount"
                    )}
                  </Button>
                  <div>
                    Mint result:{" "}
                    {mintWithCyberAccountHash?.address === account.address ? (
                      <a
                        className="text-blue-500"
                        target="_blank"
                        href={
                          currentChain?.blockExplorers?.default.url +
                          "/tx/" +
                          mintWithCyberAccountHash.hash
                        }
                      >
                        Transaction Hash
                      </a>
                    ) : (
                      "-"
                    )}
                  </div>
                  <SwapSigner
                    cyberAccount={account.address}
                    swap={(newSigner) => handleSwapSigner(account, newSigner)}
                    loading={swapingSigner === account?.address}
                    hash={
                      swapSignerHash?.address &&
                      swapSignerHash.address === account?.address
                        ? swapSignerHash?.hash
                        : undefined
                    }
                  />
                </div>
              ))
            : "none"}
        </div>
      </div>
      <div className="flex flex-col gap-y-4 mt-8">
        <p className="text-lg font-bold">Session Key Account</p>
        {<div>Address: {sessionKeyAccount?.address || "-"}</div>}
        <Button
          onClick={generateSessionKeyAccount}
          disabled={!cyberAccount || !!sessionKeyAccount}
        >
          {generatingSessionKeyAccount ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Generate Session Key Account"
          )}
        </Button>
      </div>
      <div className="flex flex-col gap-y-4 mt-8">
        <p className="text-lg font-bold">Session Key Account Client</p>
        <div>
          Session Key Account Client Status:{" "}
          {sessionKeyAccountClient ? "Created" : "Not Created"}
        </div>
        <Button
          onClick={createClient}
          disabled={
            !sessionKeyAccount || !cyberAccount || !!sessionKeyAccountClient
          }
        >
          {creatingSessionKeyAccountClient ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Create Session Key Account Client"
          )}
        </Button>
        <Button
          onClick={mintWithSessionKeyAccount}
          disabled={!sessionKeyAccountClient}
        >
          {mintingWithSessionKeyAccount ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Mint With Session Key Account"
          )}
        </Button>
        <div>
          Mint result:{" "}
          {mintWithSessionKeyAccountHash ? (
            <a
              className="text-blue-500"
              target="_blank"
              href={
                currentChain?.blockExplorers?.default.url +
                "/tx/" +
                mintWithSessionKeyAccountHash
              }
            >
              Transaction Hash
            </a>
          ) : (
            "-"
          )}
        </div>
      </div>
      <div className="flex flex-col gap-y-4 mt-8">
        <p className="text-lg font-bold">Serialize Session Key Account</p>
        {
          <div className="w-full break-all max-h-[200px] overflow-scroll">
            {serializedSessionKeyAccount || "No serialized account yet"}
          </div>
        }
        <Button
          onClick={serialize}
          disabled={!sessionKeyAccount || !cyberAccount}
        >
          {serializingSessionKeyAccount ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Serialize"
          )}
        </Button>
      </div>
      <div className="flex flex-col gap-y-4 mt-8">
        <p className="text-lg font-bold">Deserialize Session Key Account</p>
        <div>
          Address:{" "}
          {deserializedSessionKeyAccount?.address ||
            "No deserialized account yet"}
        </div>
        <Button
          onClick={deserialize}
          disabled={!serializedSessionKeyAccount || !cyberAccount?.publicClient}
        >
          {deserializingSessionKeyAccount ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Deserialize"
          )}
        </Button>
      </div>
      <div className="flex flex-col gap-y-4 mt-8">
        <p className="text-lg font-bold">
          Deserialized Session Key Account Client
        </p>
        <div>
          Deserialized Session Key Account Client Status:{" "}
          {deserializedSessionKeyAccountClient ? "Created" : "Not Created"}
        </div>
        <Button
          onClick={createClientWithDeseralizedSessionKeyAccount}
          disabled={
            !deserializedSessionKeyAccount ||
            !cyberAccount ||
            !!deserializedSessionKeyAccountClient
          }
        >
          Create Session Key Account Client (Deserialized)
        </Button>
        <Button
          onClick={mintWithDeserializedSessionKeyAccount}
          disabled={!deserializedSessionKeyAccountClient}
        >
          {mintingWithDeserializedSessionKeyAccount ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Mint With Session Key Account (Deserialized)"
          )}
        </Button>
        <div>
          Mint result:{" "}
          {mintWithDeserializedSessionKeyAccountHash ? (
            <a
              className="text-blue-500"
              target="_blank"
              href={
                currentChain?.blockExplorers?.default.url +
                "/tx/" +
                mintWithDeserializedSessionKeyAccountHash
              }
            >
              Transaction Hash
            </a>
          ) : (
            "-"
          )}
        </div>
      </div>
    </div>
  );
}

export default CyberAccountSDK;
