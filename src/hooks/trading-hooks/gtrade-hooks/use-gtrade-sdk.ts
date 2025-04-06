// hooks/use-gtrade-sdk.ts
import { useMemo } from 'react';
import { TradingSDK, SupportedChainId } from "@gainsnetwork/trading-sdk";
import { usePublicClient } from 'wagmi';

// Define the specific RPC URL
const nodiesRpcUrl = "https://arbitrum-one-rpc.publicnode.com";

export function useGTradeSdk() {
  const publicClient = usePublicClient();
  
  const sdk = useMemo(() => {
    try {
      if (!publicClient) {
        console.warn('Gtrade: Public client not available');
        return null;
      }

      // Use the defined Nodies RPC URL directly
      const rpcUrl = nodiesRpcUrl;

      console.log('Gtrade: Using RPC URL:', rpcUrl); // Log the RPC being used

      const tradingSdk = new TradingSDK({ 
        chainId: SupportedChainId.Arbitrum,
        rpcProviderUrl: rpcUrl
      });

      return tradingSdk;
    } catch (error) {
      console.error('Gtrade: Error initializing gTrade SDK:', error);
      return null;
    }
  }, [publicClient]);

  return sdk;
}