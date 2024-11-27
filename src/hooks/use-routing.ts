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

    const routes: Record<RouteId, RouteInfo> = {
      unidexv4: {
        id: 'unidexv4',
        name: 'UniDex',
        tradingFee: market.longTradingFee / 10,
        available: true,
        minMargin: MIN_MARGIN.unidexv4
      },
      gtrade: {
        id: 'gtrade',
        name: 'gTrade',
        tradingFee: 0.0006,
        available: isGTradeSupported,
        minMargin: MIN_MARGIN.gtrade,
        reason: isGTradeSupported ? undefined : 'Pair not supported on gTrade'
      }
    };

    // Find best route considering minimum margins
    const bestRoute = Object.entries(routes)
      .filter(([_, info]) => info.available)
      .reduce((best, [routeId, info]) => {
        // If current margin is less than gTrade minimum, force unidexv4
        if (currentMargin < MIN_MARGIN.gtrade) {
          return 'unidexv4';
        }
        // Otherwise choose based on fees
        return !best || info.tradingFee < routes[best].tradingFee 
          ? routeId as RouteId 
          : best;
      }, 'unidexv4' as RouteId);

    return {
      bestRoute,
      routes
    };
  }, [assetId, allMarkets, currentMargin]);

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