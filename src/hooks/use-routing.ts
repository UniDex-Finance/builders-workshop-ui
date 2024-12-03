// hooks/use-routing.ts
import { useMemo } from 'react';
import { useMarketOrderActions } from './use-market-order-actions';
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

export function useRouting(assetId: string, amount: string, leverage: string) {
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

    // Calculate available liquidity for UniDex
    const unidexLongLiquidity = market.availableLiquidity?.long || 0;
    const unidexShortLiquidity = market.availableLiquidity?.short || 0;

    // Check if UniDex has enough liquidity for the full order
    const hasUnidexLiquidity = orderSize <= unidexLongLiquidity && orderSize <= unidexShortLiquidity;

    const routes: Record<RouteId, RouteInfo> = {
      unidexv4: {
        id: 'unidexv4',
        name: 'UniDex',
        tradingFee: market.longTradingFee / 10,
        available: hasUnidexLiquidity,
        minMargin: MIN_MARGIN.unidexv4,
        reason: hasUnidexLiquidity ? undefined : 'Insufficient liquidity on UniDex'
      },
      gtrade: {
        id: 'gtrade',
        name: 'gTrade',
        tradingFee: 0.0006,
        available: isGTradeSupported && !hasUnidexLiquidity, // Only available if UniDex lacks liquidity
        minMargin: MIN_MARGIN.gtrade,
        reason: !isGTradeSupported 
          ? 'Pair not supported on gTrade'
          : hasUnidexLiquidity 
          ? 'Using UniDex liquidity first'
          : undefined
      }
    };

    // Determine best route
    let bestRoute: RouteId = 'unidexv4';

    // If current margin is less than gTrade minimum, force unidexv4
    if (currentMargin < MIN_MARGIN.gtrade) {
      bestRoute = 'unidexv4';
    } 
    // If UniDex has liquidity, always use it first
    else if (hasUnidexLiquidity) {
      bestRoute = 'unidexv4';
    }
    // If UniDex doesn't have enough liquidity and gTrade is available, use gTrade
    else if (isGTradeSupported) {
      bestRoute = 'gtrade';
    }

    return {
      bestRoute,
      routes
    };
  }, [assetId, allMarkets, currentMargin, amount]);

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