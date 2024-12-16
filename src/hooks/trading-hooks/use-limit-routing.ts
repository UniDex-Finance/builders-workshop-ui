import { useMarketOrderActions } from './unidex-hooks/use-market-order-actions';
import { useSmartAccount } from '../use-smart-account';

interface LimitOrderParams {
  pair: number;
  isLong: boolean;
  price: number;
  margin: number;
  size: number;
  takeProfit: string;
  stopLoss: string;
  referrer?: string;
}

export function useLimitRouting() {
  const { placeLimitOrder } = useMarketOrderActions();
  const { kernelClient, smartAccount } = useSmartAccount();

  const executeLimitOrder = async (params: LimitOrderParams) => {
    if (!kernelClient || !smartAccount?.address) {
      throw new Error("Wallet not connected");
    }

    console.log('Executing limit order:', params);
    
    return placeLimitOrder(
      params.pair,
      params.isLong,
      params.price,
      0,
      params.margin,
      params.size,
      params.takeProfit,
      params.stopLoss,
      params.referrer
    );
  };

  return {
    executeLimitOrder
  };
} 