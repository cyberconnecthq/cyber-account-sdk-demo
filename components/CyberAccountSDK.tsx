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
} from "viem";
import { optimismSepolia } from "viem/chains";
import { Button } from "@/components/ui/button";
import { ParamOperator } from "@zerodev/session-key";
import {
  CyberBundler,
  CyberAccount,
  CyberPaymaster,
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

function CyberAccountSDK() {
  const [cyberAccount, setCyberAccount] = useState<CyberAccount>();

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

  const [mintWithCyberAccountHash, setMintWithCyberAccountHash] =
    useState<string>();
  const [mintWithSessionKeyAccountHash, setMintWithSessionKeyAccountHash] =
    useState<string>();

  const [mintingWithCyberAccount, setMintingWithCyberAccount] = useState(false);
  const [swapingSigner, setSwapingSigner] = useState(false);
  const [swapSignerHash, setSwapSignerHash] = useState<string>();
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
        id: optimismSepolia.id,
        testnet: true,
      },
      owner: {
        address: eoaAddress,
        signMessage: sign,
      },
      bundler: cyberBundler,
      // paymaster: cyberPaymaster,
    });

    setCyberAccount(cyberAccount);
  }, [eoaAddress]);

  const handleSwapSigner = async (newSigner?: Hex) => {
    if (newSigner && cyberAccount) {
      setSwapingSigner(true);
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
          setSwapingSigner(false);
        });

      setSwapSignerHash(res);
    }
  };

  const mint = async () => {
    if (!cyberAccount) return;

    setMintingWithCyberAccount(true);
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
        setMintingWithCyberAccount(false);
      });

    setMintWithCyberAccountHash(res);
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
      <div className="flex flex-col gap-y-4 justify-center">
        <p className="text-lg font-bold">Cyber Account</p>
        {<div>Address: {cyberAccount?.address || "-"}</div>}
        <Button onClick={mint} disabled={!cyberAccount}>
          {mintingWithCyberAccount ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Mint With CyberAccount"
          )}
        </Button>
        <div>
          Mint result:{" "}
          {mintWithCyberAccountHash ? (
            <a
              className="text-blue-500"
              target="_blank"
              href={
                optimismSepolia.blockExplorers.default.url +
                "/tx/" +
                mintWithCyberAccountHash
              }
            >
              Transaction Hash
            </a>
          ) : (
            "-"
          )}
        </div>
        <SwapSigner
          cyberAccount={cyberAccount?.address}
          swap={handleSwapSigner}
          loading={swapingSigner}
          hash={swapSignerHash}
        />
      </div>
      <div className="flex flex-col gap-y-4">
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
      <div className="flex flex-col gap-y-4">
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
                optimismSepolia.blockExplorers.default.url +
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
      <div className="flex flex-col gap-y-4">
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
      <div className="flex flex-col gap-y-4">
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
      <div className="flex flex-col gap-y-4">
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
                optimismSepolia.blockExplorers.default.url +
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
