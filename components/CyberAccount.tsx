import { useEffect, useState } from "react";
import { useAccount, usePublicClient, useWalletClient, useConfig } from "wagmi";
import {
  createKernelAccountClient,
  createKernelV2Account,
  KernelSmartAccount,
  KernelAccountClient,
} from "@zerodev/sdk";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import {
  http,
  encodeFunctionData,
  parseAbi,
  Transport,
  Chain,
  createClient,
  Client,
  Account,
  WalletClient,
  PublicClient,
  zeroAddress,
} from "viem";
import { optimismSepolia } from "viem/chains";
import {
  walletClientToSmartAccountSigner,
  UserOperation as GenericUserOperation,
  ENTRYPOINT_ADDRESS_V06,
  smartAccountActions,
} from "permissionless";
import { Button } from "@/components/ui/button";
import {
  ENTRYPOINT_ADDRESS_V06_TYPE,
  GetEntryPointVersion,
} from "permissionless/types";
import {
  signerToSessionKeyValidator,
  ParamOperator,
  oneAddress,
  serializeSessionKeyAccount,
  deserializeSessionKeyAccountV2 as deserializeSessionKeyAccount,
} from "@zerodev/session-key";
import { SmartAccount, SmartAccountSigner } from "permissionless/accounts";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { Checkbox } from "@/components/ui/checkbox";

type UserOperation = GenericUserOperation<
  GetEntryPointVersion<ENTRYPOINT_ADDRESS_V06_TYPE>
>;

type CyberPaymasterRPCSchema = [
  {
    Method: "cc_sponsorUserOperation";
    Parameters: [
      Omit<UserOperation, "nonce"> & {
        nonce: null;
        value: string;
      },
      {
        owner: string;
      },
    ];
    ReturnType: { userOperation: UserOperation };
  },
];

type CyberPaymasterClient = Client<
  Transport,
  Chain,
  Account | undefined,
  CyberPaymasterRPCSchema,
  {
    sponsorUserOperation: ({
      userOperation,
    }: {
      userOperation: UserOperation;
    }) => Promise<UserOperation>;
  }
>;

BigInt.prototype.toJSON = function () {
  return this.toString();
};

const BUNDLER_RPC = `https://api.stg.cyberconnect.dev/cyberaccount/bundler/v1/rpc?chainId=${optimismSepolia.id}&appId=6c6e8152-5343-4505-81a3-cf97cf5873ca`;
const PAYMASTER_URL = `https://api.stg.cyberconnect.dev/cyberaccount/paymaster/v1/rpc?chainId=${optimismSepolia.id}&appId=6c6e8152-5343-4505-81a3-cf97cf5873ca`;

const contractAddress = "0x34bE7f35132E97915633BC1fc020364EA5134863";

const contractABI = parseAbi([
  "function mint(address _to) public",
  "function balanceOf(address owner) external view returns (uint256 balance)",
]);

function CyberAccount() {
  const [cyberAccount, setCyberAccount] = useState<KernelSmartAccount>();
  const [cyberAccountSessionKeyAccount, setCyberAccountSessionKeyAccount] =
    useState<KernelSmartAccount>();
  const { address: eoaAddress } = useAccount();
  const config = useConfig();
  const publicClient = usePublicClient({ config });
  const walletClientQuery = useWalletClient({
    account: eoaAddress,
  });
  const [smartAccountSigner, setSmartAccountSigner] =
    useState<SmartAccountSigner>();
  const [cyberAccountClient, setCyberAccountClient] =
    useState<KernelAccountClient<Transport, Chain, KernelSmartAccount>>();
  const [
    cyberAccountSessionKeyAccountClient,
    setCyberAccountSessionKeyAccountClient,
  ] = useState<KernelAccountClient<Transport, Chain, KernelSmartAccount>>();

  useEffect(() => {
    if (smartAccountSigner || !walletClientQuery.data || !publicClient) return;

    const signer = createSmartAccountSigner(walletClientQuery.data);

    (async () => {
      // ------------------- Create CyberAccount -------------------
      const cyberAccount = await createCyberAccount(publicClient, { signer });
      const accountClient = await createAccountClient({
        signer,
        account: cyberAccount,
      });

      setSmartAccountSigner(signer);
      setCyberAccountClient(accountClient);
      setCyberAccount(cyberAccount);
    })();
  }, [walletClientQuery, smartAccountSigner, eoaAddress, publicClient]);

  const createSmartAccountSigner = (
    walletClient: WalletClient<Transport, Chain, Account>,
  ) => {
    const signer = walletClientToSmartAccountSigner(walletClient);

    setSmartAccountSigner(signer);

    return signer;
  };

  const getSessionKeyValidator = async (
    publicClient: PublicClient,
    {
      signer,
      masterAccount,
    }: { signer: SmartAccountSigner; masterAccount: KernelSmartAccount },
  ) => {
    return await signerToSessionKeyValidator(publicClient, {
      signer,
      validatorData: {
        paymaster: zeroAddress,
        permissions: [
          {
            target: contractAddress,
            valueLimit: BigInt(0),
            abi: contractABI,
            functionName: "mint",
            args: [
              {
                operator: ParamOperator.EQUAL,
                value: masterAccount.address,
              },
            ],
          },
        ],
      },
    });
  };

  const createSessionKeyAccount = async (
    publicClient: PublicClient,
    {
      masterAccountSigner,
      signer,
      masterAccount,
    }: {
      masterAccountSigner: SmartAccountSigner;
      signer: SmartAccountSigner;
      masterAccount: KernelSmartAccount;
    },
  ) => {
    const ecdsaValidator = await getEcdsaValidator(publicClient, {
      signer: masterAccountSigner,
    });

    const sessionKeyValidator = await getSessionKeyValidator(publicClient, {
      signer,
      masterAccount,
    });

    const sessionKeyAccount = await createKernelV2Account(publicClient, {
      plugins: {
        sudo: ecdsaValidator,
        regular: sessionKeyValidator,
      },
    });

    return sessionKeyAccount;
  };

  const getEcdsaValidator = async (
    publicClient: PublicClient,
    { signer }: { signer: SmartAccountSigner },
  ) => {
    const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
      signer,
      validatorAddress: "0x417f5a41305ddc99d18b5e176521b468b2a31b86",
    });

    return ecdsaValidator;
  };

  const createCyberAccount = async (
    publicClient: PublicClient,
    {
      signer,
    }: {
      signer: SmartAccountSigner;
    },
  ) => {
    const ecdsaValidator = await getEcdsaValidator(publicClient, { signer });

    const account = await createKernelV2Account(publicClient, {
      plugins: {
        sudo: ecdsaValidator,
      },
    });

    return account;
  };

  const createCyberPaymasterClient = ({
    url,
    jwt,
    signer,
  }: {
    url: string;
    jwt: string;
    signer: SmartAccountSigner;
  }) => {
    const client = createClient({
      chain: optimismSepolia,
      transport: http(url, {
        fetchOptions: {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        },
      }),
    }).extend((baseClient) => {
      const client = baseClient as Client as CyberPaymasterClient;

      return {
        async sponsorUserOperation({
          userOperation,
        }: {
          userOperation: Omit<UserOperation, "nonce"> & {
            nonce: null;
          };
        }) {
          const result = await client.request({
            method: "cc_sponsorUserOperation",
            params: [
              {
                value: "0",
                ep: ENTRYPOINT_ADDRESS_V06,
                ...userOperation,
                nonce: null,
              },
              {
                owner: signer.address,
              },
            ],
          });

          return result.userOperation;
        },
      };
    });

    return client as Client as CyberPaymasterClient;
  };

  const createAccountClient = async ({
    account,
    signer,
  }: {
    account: KernelSmartAccount;
    signer: SmartAccountSigner;
  }) => {
    const authResponse = await fetch("/api/auth", {
      method: "POST",
      body: JSON.stringify({ sender: account.address }),
    }).then((res) => res.json());

    const paymasterClient = createCyberPaymasterClient({
      signer,
      url: PAYMASTER_URL,
      jwt: authResponse.token,
    });

    const kernelClient = createKernelAccountClient({
      account: account,
      chain: optimismSepolia,
      transport: http(BUNDLER_RPC),

      // Enable paymaster will cause error:: SessionKeyValidator: No matching permission found for the userOp
      sponsorUserOperation: paymasterClient?.sponsorUserOperation
        ? async ({ userOperation }) =>
            await paymasterClient.sponsorUserOperation({ userOperation })
        : undefined,
    });

    return kernelClient as KernelAccountClient<
      Transport,
      Chain,
      KernelSmartAccount
    >;
  };

  const mint = async () => {
    if (!cyberAccountClient || !cyberAccount) return;

    const hash = await cyberAccountClient.sendTransaction({
      to: contractAddress,
      value: BigInt(0),
      data: encodeFunctionData({
        abi: contractABI,
        functionName: "mint",
        args: [cyberAccount.address],
      }),
    });

    alert(hash);
  };

  const mintWithSessionKeyAccount = async () => {
    if (!cyberAccountSessionKeyAccountClient || !cyberAccount) return;

    const hash = await cyberAccountSessionKeyAccountClient?.sendTransaction({
      to: contractAddress,
      value: BigInt(0),
      data: encodeFunctionData({
        abi: contractABI,
        functionName: "mint",
        args: [cyberAccount.address],
      }),
    });

    alert(hash);
  };

  const generateSessionKeyAccount = async () => {
    if (!publicClient || !smartAccountSigner || !cyberAccount) return;

    let cyberAccountSessionKeyAccount: KernelSmartAccount;

    // ------------------- Create SessionKeyAccount -------------------
    const sessionPrivateKey = generatePrivateKey();
    const sessionKeySigner = privateKeyToAccount(sessionPrivateKey);

    cyberAccountSessionKeyAccount = await createSessionKeyAccount(
      publicClient,
      {
        masterAccountSigner: smartAccountSigner,
        signer: sessionKeySigner,
        masterAccount: cyberAccount,
      },
    );

    const serializedAccount = await serializeSessionKeyAccount(
      cyberAccountSessionKeyAccount,
      sessionPrivateKey,
    );

    console.log("serializedAccount", serializedAccount);

    const sessionKeyAccountClient = await createAccountClient({
      signer: smartAccountSigner,
      account: cyberAccountSessionKeyAccount,
    });

    console.log({ cyberAccountSessionKeyAccount });

    setCyberAccountSessionKeyAccount(cyberAccountSessionKeyAccount);
    setCyberAccountSessionKeyAccountClient(sessionKeyAccountClient);
  };

  return (
    <div className="flex flex-col gap-y-4">
      <div>
        <p className="text-lg font-bold">CyberAccount</p>
        {cyberAccount && <div>{cyberAccount.address}</div>}
      </div>
      <div>
        <p className="text-lg font-bold">CyberAccount Session Key Account</p>
        {cyberAccountSessionKeyAccount && (
          <div>{cyberAccountSessionKeyAccount.address}</div>
        )}
      </div>
      <div className="flex flex-col gap-y-4">
        <Button onClick={generateSessionKeyAccount}>
          Generate Session Key Account
        </Button>
        <Button onClick={mint}>Mint With CyberAccount</Button>
        <Button onClick={mintWithSessionKeyAccount}>
          Mint With Session Key Account
        </Button>
      </div>
    </div>
  );
}

export default CyberAccount;
