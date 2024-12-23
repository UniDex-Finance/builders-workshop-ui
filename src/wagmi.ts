import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'viem';
import { arbitrum, optimism, sepolia, base } from 'wagmi/chains';

// Define chains
const chains = [
  arbitrum,
  optimism,
  base,
  ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' ? [sepolia] : []),
] as const;

// Create and export the config
export const config = getDefaultConfig({
  appName: 'RainbowKit App',
  projectId: '51445d14652b7a86dab5f5d7a4b8b70c',
  chains,
  transports: {
    [arbitrum.id]: http(process.env.NEXT_PUBLIC_ARBITRUM_RPC || 'https://rpc.ankr.com/arbitrum'),
    [optimism.id]: http(process.env.NEXT_PUBLIC_OPTIMISM_RPC || 'https://rpc.ankr.com/optimism'),
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC || 'https://rpc.ankr.com/base'),
  },
  ssr: true,
});
