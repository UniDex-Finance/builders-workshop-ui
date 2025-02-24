import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'viem';
import { arbitrum, optimism, sepolia, base, mainnet } from 'wagmi/chains';
import { type Chain } from 'viem'

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

// Create and export the config
export const config = getDefaultConfig({
  appName: 'RainbowKit App',
  projectId: '51445d14652b7a86dab5f5d7a4b8b70c',
  chains,
  transports: {
    [mainnet.id]: http(process.env.NEXT_PUBLIC_ETH_RPC || 'https://rpc.ankr.com/eth'),
    [arbitrum.id]: http(process.env.NEXT_PUBLIC_ARBITRUM_RPC || 'https://rpc.ankr.com/arbitrum'),
    [optimism.id]: http(process.env.NEXT_PUBLIC_OPTIMISM_RPC || 'https://rpc.ankr.com/optimism'),
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC || 'https://rpc.ankr.com/base'),
    [sonic.id]: http(process.env.NEXT_PUBLIC_SONIC_RPC || 'https://rpc.soniclabs.com'),
  },
  ssr: true,
});
