// hooks/use-gtrade-sdk.ts
import { useMemo } from 'react';
import { TradingSDK, SupportedChainId } from "@gainsnetwork/trading-sdk";
import { usePublicClient } from 'wagmi';

export function useGTradeSdk() {
  const publicClient = usePublicClient();
  
  const sdk = useMemo(() => {
    try {
      if (!publicClient) {
        console.warn('Public client not available');
        return null;
      }

      if (!publicClient.transport || !('url' in publicClient.transport)) {
        console.warn('RPC URL not available in transport');
        return null;
      }

      const rpcUrl = publicClient.transport.url;
      if (typeof rpcUrl !== 'string') {
        console.warn('Invalid RPC URL format');
        return null;
      }

      const tradingSdk = new TradingSDK({ 
        chainId: SupportedChainId.Arbitrum,
        rpcProviderUrl: rpcUrl
      });

      return tradingSdk;
    } catch (error) {
      console.error('Error initializing gTrade SDK:', error);
      return null;
    }
  }, [publicClient]);

  return sdk;
}