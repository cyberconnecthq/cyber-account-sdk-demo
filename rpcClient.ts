import { Chain } from "viem";
import {
  bscTestnet,
  lineaTestnet,
  scrollSepolia,
  optimismSepolia,
  mantleTestnet,
  baseSepolia,
  arbitrumSepolia,
  opBNBTestnet,
} from "viem/chains";

export const polygonAmoy = {
  id: 80002,
  name: "Polygon Amoy",
  network: "Polygon Amoy",
  nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  rpcUrls: {
    public: {
      http: ["https://rpc-amoy.polygon.technology/"],
    },
    default: {
      http: ["https://rpc-amoy.polygon.technology"],
    },
  },
  blockExplorers: {
    default: { name: "Explorer", url: "https://www.oklink.com/amoy" },
  },
  testnet: true,
};

export const cyberTestnet = {
  id: 111557560,
  name: "Cyber Testnet",
  network: "Cyber Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.cyber.co"] },
    public: { http: ["https://rpc.testnet.cyber.co"] },
  },
  blockExplorers: {
    default: {
      name: "Cyber Testnet Explorer",
      url: "https://testnet.cyberscan.co/",
    },
  },
};

export const testnetChains: Chain[] = [
  optimismSepolia,
  lineaTestnet,
  arbitrumSepolia,
  opBNBTestnet,
  scrollSepolia,
  bscTestnet,
  baseSepolia,
  polygonAmoy,
  mantleTestnet,
  cyberTestnet,
];
