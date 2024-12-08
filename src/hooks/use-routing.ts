// hooks/use-routing.ts
import { useMemo } from 'react';
import { useMarketOrderActions } from './unidex-hooks/use-market-order-actions';
import { useGTradeOrderActions } from './use-gtrade-order-actions';
import { useMarketData } from './use-market-data';
import { GTRADE_PAIR_MAPPING } from './use-gtrade-pairs';

export type RouteId = 'unidexv4' | 'gtrade';

interface RouteInfo {
  id: RouteId;
  name: string;
  tradingFee: number;
  available: boolean;
  minMargin: number;
  reason?: string;
}

interface OrderParams {
  pair: number;
  isLong: boolean;
  price: number;
  slippagePercent: number;
  margin: number;
  size: number;
  orderType: "market" | "limit";
  takeProfit?: string;
  stopLoss?: string;
  referrer?: string;
}

const MIN_MARGIN = {
  unidexv4: 1,
  gtrade: 5
} as const;

export function useRouting(assetId: string, amount: string, leverage: string, isLong: boolean) {
  const { placeMarketOrder: placeUnidexOrder } = useMarketOrderActions();
  const { placeGTradeOrder } = useGTradeOrderActions();
  const { allMarkets } = useMarketData();

  const currentMargin = useMemo(() => {
    if (!amount || !leverage) return 0;
    return parseFloat(amount) / parseFloat(leverage);
  }, [amount, leverage]);

  const routingInfo = useMemo(() => {
    const market = allMarkets.find(m => m.assetId === assetId);
    if (!market) {
      return {
        bestRoute: 'unidexv4' as RouteId,
        routes: {
          unidexv4: {
            id: 'unidexv4',
            name: 'UniDex',
            tradingFee: 0,
            available: false,
            minMargin: MIN_MARGIN.unidexv4,
            reason: 'Market not found'
          }
        }
      };
    }

    const isGTradeSupported = GTRADE_PAIR_MAPPING[market.pair] !== undefined;
    const orderSize = parseFloat(amount || '0');

    // Get relevant liquidity based on position direction
    const relevantLiquidity = isLong 
      ? market.availableLiquidity?.long || 0
      : market.availableLiquidity?.short || 0;

    // Check if UniDex has enough liquidity for the specific direction
    const hasUnidexLiquidity = orderSize <= relevantLiquidity;

    // Check margin requirements
    const meetsUnidexMargin = currentMargin >= MIN_MARGIN.unidexv4;
    const meetsGTradeMargin = currentMargin >= MIN_MARGIN.gtrade;

    // UniDex should be available if it has liquidity AND meets minimum margin
    const unidexAvailable = hasUnidexLiquidity && meetsUnidexMargin;
    
    // gTrade should only be available if UniDex doesn't have liquidity
    const gTradeAvailable = isGTradeSupported && meetsGTradeMargin && !hasUnidexLiquidity;

    const routes: Record<RouteId, RouteInfo> = {
      unidexv4: {
        id: 'unidexv4',
        name: 'UniDex',
        tradingFee: market.longTradingFee / 100,
        available: unidexAvailable,
        minMargin: MIN_MARGIN.unidexv4,
        reason: !hasUnidexLiquidity 
          ? 'Insufficient liquidity on UniDex'
          : !meetsUnidexMargin 
          ? 'Minimum margin requirement not met'
          : undefined
      },
      gtrade: {
        id: 'gtrade',
        name: 'gTrade',
        tradingFee: 0.0006,
        available: gTradeAvailable,
        minMargin: MIN_MARGIN.gtrade,
        reason: !isGTradeSupported 
          ? 'Pair not supported on gTrade'
          : hasUnidexLiquidity
          ? 'Using UniDex liquidity'
          : !meetsGTradeMargin
          ? 'Minimum margin requirement not met'
          : undefined
      }
    };

    // Simplified routing logic:
    // If UniDex has liquidity and meets margin requirements, use it
    // Otherwise, fall back to gTrade if available
    let bestRoute: RouteId = 'unidexv4';
    
    if (unidexAvailable) {
      bestRoute = 'unidexv4';
    } else if (gTradeAvailable) {
      bestRoute = 'gtrade';
    }

    return {
      bestRoute,
      routes
    };
  }, [assetId, allMarkets, currentMargin, amount, isLong]);

  const executeOrder = async (params: OrderParams) => {
    if (routingInfo.bestRoute === 'gtrade') {
      // When using gTrade, directly place the order without deposit checks
      return placeGTradeOrder(
        params.pair,
        params.isLong,
        params.price,
        params.slippagePercent,
        params.margin,
        params.size,
        params.orderType,
        params.takeProfit,
        params.stopLoss
      );
    } else {
      // Original Unidex logic with deposit checks remains unchanged
      return placeUnidexOrder(
        params.pair,
        params.isLong,
        params.price,
        params.slippagePercent,
        params.margin,
        params.size,
        params.takeProfit,
        params.stopLoss,
        params.referrer
      );
    }
  };

  return {
    ...routingInfo,
    executeOrder
  };
}