import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http, fallback, type Transport } from 'viem';
import { arbitrum, optimism, sepolia, base, mainnet } from 'wagmi/chains';
import { type Chain } from 'viem'
import { unstable_connector } from 'wagmi';
import { injected } from '@wagmi/connectors';

// Define custom chain
export const sonic = {
  id: 146,
  name: 'Sonic',
  nativeCurrency: { name: 'S', symbol: 'S', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.soniclabs.com'] },
  },
  blockExplorers: {
    default: { name: 'Sonic Explorer', url: 'https://sonicscan.org' },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 60, //double check this
    },
  },
} as const satisfies Chain

// Define chains
const chains = [
  mainnet,
  arbitrum,
  optimism,
  base,
  sonic,
  ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' ? [sepolia] : []),
] as const;

// Define base transports
const transports: Record<number, Transport> = {
  [mainnet.id]: fallback([
    unstable_connector(injected),
    http(process.env.NEXT_PUBLIC_ETH_RPC),
    http('https://rpc.ankr.com/eth'),
    http('https://cloudflare-eth.com'),
    http('https://eth.llamarpc.com'),
  ]),
  [arbitrum.id]: fallback([
    unstable_connector(injected),
    http(process.env.NEXT_PUBLIC_ARBITRUM_RPC),
    http('https://obsidian-rpc-v2.up.railway.app/rpc'),
    http('https://arb1.arbitrum.io/rpc'),
  ]),
  [optimism.id]: fallback([
    unstable_connector(injected),
    http(process.env.NEXT_PUBLIC_OPTIMISM_RPC),
    http('https://rpc.ankr.com/optimism'),
    http('https://mainnet.optimism.io'),
  ]),
  [base.id]: fallback([
    unstable_connector(injected),
    http(process.env.NEXT_PUBLIC_BASE_RPC),
    http('https://rpc.ankr.com/base'),
    http('https://mainnet.base.org'),
  ]),
  [sonic.id]: fallback([
    unstable_connector(injected),
    http(process.env.NEXT_PUBLIC_SONIC_RPC),
    http('https://rpc.soniclabs.com'),
    // Add more http() fallbacks for Sonic here
  ]),
};

// Conditionally add testnet transports
if (process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true') {
  transports[sepolia.id] = fallback([
    unstable_connector(injected),
    http(process.env.NEXT_PUBLIC_SEPOLIA_RPC),
    http('https://rpc.sepolia.org'),
    http('https://rpc2.sepolia.org'),
  ]);
}

// Create and export the config
export const config = getDefaultConfig({
  appName: 'RainbowKit App',
  projectId: '51445d14652b7a86dab5f5d7a4b8b70c',
  chains,
  transports,
  ssr: true,
});
