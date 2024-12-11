// hooks/use-routing.ts
import { useMemo } from 'react';
import { useMarketOrderActions } from './unidex-hooks/use-market-order-actions';
import { useGTradeOrderActions } from './gtrade-hooks/use-gtrade-order-actions';
import { useMarketData } from '../use-market-data';
import { GTRADE_PAIR_MAPPING } from './gtrade-hooks/use-gtrade-pairs';
import { getCustomNonceKeyFromString } from "@zerodev/sdk";
import { ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import { useSmartAccount } from '../use-smart-account';
import { useBalances } from '../use-balances';

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

interface SplitOrderInfo {
  unidex: {
    size: number;
    margin: number;
  } | null;
  gtrade: {
    size: number;
    margin: number;
  } | null;
}

interface TransactionCall {
  to: string;
  data: string;
  value: bigint;
}

export function useRouting(assetId: string, amount: string, leverage: string, isLong: boolean) {
  const { placeMarketOrder, prepare: prepareUnidex } = useMarketOrderActions();
  const { placeGTradeOrder, prepare: prepareGTrade } = useGTradeOrderActions();
  const { allMarkets } = useMarketData();
  const { smartAccount, kernelClient } = useSmartAccount();
  const { balances } = useBalances("arbitrum");

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

  const splitOrderInfo = useMemo((): SplitOrderInfo => {
    const orderSize = parseFloat(amount || '0');
    const market = allMarkets.find(m => m.assetId === assetId);
    if (!market || !orderSize) {
      return { unidex: null, gtrade: null };
    }

    const relevantLiquidity = isLong 
      ? market.availableLiquidity?.long || 0
      : market.availableLiquidity?.short || 0;

    const isGTradeSupported = GTRADE_PAIR_MAPPING[market.pair] !== undefined;
    
    // Calculate how much can go to UniDex
    let unidexSize = Math.min(orderSize, relevantLiquidity);
    const unidexMargin = unidexSize / parseFloat(leverage || '1');
    
    // If unidex margin is below minimum, route everything to gTrade
    if (unidexMargin < MIN_MARGIN.unidexv4) {
      unidexSize = 0;
    }

    // Calculate remaining size for gTrade
    const gtradeSize = orderSize - unidexSize;
    const gtradeMargin = gtradeSize / parseFloat(leverage || '1');

    console.log('Order Split Details:', {
      totalOrderSize: orderSize,
      availableLiquidity: relevantLiquidity,
      unidex: {
        size: unidexSize,
        margin: unidexMargin,
        minMargin: MIN_MARGIN.unidexv4,
        belowMinMargin: unidexMargin < MIN_MARGIN.unidexv4
      },
      gtrade: {
        size: gtradeSize,
        margin: gtradeMargin,
        minMargin: MIN_MARGIN.gtrade,
        belowMinMargin: gtradeMargin < MIN_MARGIN.gtrade,
        supported: isGTradeSupported
      }
    });

    return {
      unidex: unidexSize > 0 ? { size: unidexSize, margin: unidexMargin } : null,
      gtrade: gtradeSize > 0 && isGTradeSupported && gtradeMargin >= MIN_MARGIN.gtrade
        ? { size: gtradeSize, margin: gtradeMargin }
        : null
    };
  }, [assetId, amount, leverage, allMarkets, isLong]);

  const executeOrder = async (params: OrderParams) => {
    if (!kernelClient || !smartAccount?.address) {
      throw new Error("Wallet not connected");
    }

    const split = splitOrderInfo;
    console.log('Split order info:', split);

    if (split.unidex && split.gtrade) {
      console.log('Preparing split orders...');
      try {
        // Check balances
        const marginWalletBalance = parseFloat(balances?.formattedMusdBalance || "0");
        const onectBalance = parseFloat(balances?.formattedUsdcBalance || "0");
        const gtradeMarginNeeded = split.gtrade.margin;

        const shortfall = Math.max(0, gtradeMarginNeeded - onectBalance);
        const canWithdrawFromMargin = shortfall > 0 && marginWalletBalance >= shortfall;

        let withdrawalCall = null;
        if (canWithdrawFromMargin) {
          // Prepare withdrawal transaction with exact shortfall amount
          try {
            const withdrawalResponse = await fetch(
              "https://unidexv4-api-production.up.railway.app/api/wallet",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: "withdraw",
                  tokenAddress: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
                  amount: shortfall.toString(),
                  smartAccountAddress: smartAccount.address,
                }),
              }
            );

            if (!withdrawalResponse.ok) {
              const errorData = await withdrawalResponse.text();
              console.error('Withdrawal API error:', {
                status: withdrawalResponse.status,
                statusText: withdrawalResponse.statusText,
                error: errorData
              });
              throw new Error(`Failed to prepare withdrawal: ${errorData}`);
            }

            const withdrawalData = await withdrawalResponse.json();
            console.log('Withdrawal data:', withdrawalData);

            withdrawalCall = {
              to: withdrawalData.vaultAddress as `0x${string}`,
              data: withdrawalData.calldata as `0x${string}`,
              value: 0n
            };
          } catch (error) {
            console.error('Withdrawal preparation error:', error);
            throw error;
          }
        }

        // Prepare orders
        const [unidexOrder, gtradeOrder] = await Promise.all([
          prepareUnidex(
            params.pair,
            params.isLong,
            params.price,
            params.slippagePercent,
            split.unidex.margin,
            split.unidex.size,
            params.takeProfit,
            params.stopLoss,
            params.referrer
          ),
          prepareGTrade(
            params.pair,
            params.isLong,
            params.price,
            params.slippagePercent,
            split.gtrade.margin,
            split.gtrade.size,
            params.orderType,
            params.takeProfit,
            params.stopLoss
          )
        ]);

        // Combine all transactions
        const allCalls = [
          ...(withdrawalCall ? [withdrawalCall] : []),
          ...unidexOrder.calls,
          ...gtradeOrder.calls
        ] as TransactionCall[];

        console.log('Combined transactions:', allCalls);

        return kernelClient.sendTransactions({
          transactions: allCalls.map(call => ({
            to: call.to as `0x${string}`,
            data: call.data as `0x${string}`,
            value: call.value || 0n
          }))
        });
      } catch (error) {
        console.error('Error executing split orders:', error);
        throw error;
      }
    } else {
      console.log('Executing single order:', split.unidex ? 'unidex' : 'gtrade');
      // Single order - use default behavior
      if (split.unidex) {
        return placeMarketOrder(
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
      } else {
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
      }
    }
  };

  return {
    ...routingInfo,
    splitOrderInfo,
    executeOrder
  };
}