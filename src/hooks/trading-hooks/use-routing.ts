// hooks/use-routing.ts
import { useMemo } from 'react';
import { useMarketOrderActions } from './unidex-hooks/use-market-order-actions';
import { useGTradeOrderActions } from './gtrade-hooks/use-gtrade-order-actions';
import { useMarketData } from '../use-market-data';
import { GTRADE_PAIR_MAPPING } from './gtrade-hooks/use-gtrade-pairs';
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

const roundDownTo6Decimals = (num: number): number => {
  return Math.floor(num * 1e6) / 1e6;
};

export function useRouting(assetId: string, amount: string, leverage: string, isLong: boolean) {
  const { placeMarketOrder, prepare: prepareUnidex, checkBalancesAndGetDepositAmount } = useMarketOrderActions();
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
    
    // Round down unidex size
    let unidexSize = roundDownTo6Decimals(Math.min(orderSize, relevantLiquidity));
    const unidexMargin = roundDownTo6Decimals(unidexSize / parseFloat(leverage || '1'));
    
    if (unidexMargin < MIN_MARGIN.unidexv4) {
      unidexSize = 0;
    }

    // Round down gtrade size
    const gtradeSize = roundDownTo6Decimals(orderSize - unidexSize);
    const gtradeMargin = roundDownTo6Decimals(gtradeSize / parseFloat(leverage || '1'));


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

    if (split.unidex && split.gtrade) {
      const marginWalletBalance = parseFloat(balances?.formattedMusdBalance || "0");
      const onectBalance = parseFloat(balances?.formattedUsdcBalance || "0");
      
      // Check if we need to deposit for Unidex portion
      const { needsDeposit, depositAmount } = checkBalancesAndGetDepositAmount(
        split.unidex.margin,
        split.unidex.size
      );

      // If we need to deposit, adjust gTrade size based on remaining 1CT
      if (needsDeposit) {
        const remaining1CTBalance = roundDownTo6Decimals(onectBalance - depositAmount);
        split.gtrade.margin = roundDownTo6Decimals(remaining1CTBalance);
        split.gtrade.size = roundDownTo6Decimals(split.gtrade.margin * parseFloat(leverage));
      } else {
        // Original withdrawal logic for gTrade portion
        const shortfall = roundDownTo6Decimals(Math.max(0, split.gtrade.margin - onectBalance));
        if (shortfall > 0) {
          split.gtrade.margin = roundDownTo6Decimals(onectBalance + shortfall);
          split.gtrade.size = roundDownTo6Decimals(split.gtrade.margin * parseFloat(leverage));
        }
      }

      console.log('=== Fund Flow Analysis ===', {
        currentBalances: {
          marginWallet: marginWalletBalance.toFixed(6),
          onectWallet: onectBalance.toFixed(6)
        },
        requiredAmounts: {
          unidexMargin: roundDownTo6Decimals(split.unidex.margin).toFixed(6),
          unidexDepositNeeded: needsDeposit ? depositAmount.toFixed(6) : "0.000000",
          gtradeMargin: split.gtrade.margin.toFixed(6),
          ...(needsDeposit 
            ? { remaining1CTBalance: (onectBalance - depositAmount).toFixed(6) }
            : { shortfall: roundDownTo6Decimals(Math.max(0, split.gtrade.margin - onectBalance)).toFixed(6) })
        }
      });

      // Prepare orders with adjusted sizes
      const [unidexOrder, gtradeOrder] = await Promise.all([
        prepareUnidex(
          params.pair,
          params.isLong,
          params.price,
          params.slippagePercent,
          roundDownTo6Decimals(split.unidex.margin),
          roundDownTo6Decimals(split.unidex.size),
          params.takeProfit,
          params.stopLoss,
          params.referrer
        ),
        prepareGTrade(
          params.pair,
          params.isLong,
          params.price,
          params.slippagePercent,
          roundDownTo6Decimals(split.gtrade.margin),
          roundDownTo6Decimals(split.gtrade.size),
          params.orderType,
          params.takeProfit,
          params.stopLoss
        )
      ]);

      // Prepare withdrawal if needed (only if we didn't need to deposit)
      let withdrawalCall = null;
      if (!needsDeposit) {
        const shortfall = roundDownTo6Decimals(Math.max(0, split.gtrade.margin - onectBalance));
        if (shortfall > 0) {
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
            throw new Error("Failed to prepare withdrawal");
          }

          const withdrawalData = await withdrawalResponse.json();
          withdrawalCall = {
            to: withdrawalData.vaultAddress as `0x${string}`,
            data: withdrawalData.calldata as `0x${string}`,
            value: 0n
          };
        }
      }

      // Combine all transactions in the correct order
      const allCalls = [
        ...(withdrawalCall ? [withdrawalCall] : []),
        ...unidexOrder.calls,  // This will include deposit transactions if needed
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
    } else if (split.unidex) {
      const marginWalletBalance = parseFloat(balances?.formattedMusdBalance || "0");
      console.log('=== UniDex Only Order ===', {
        margin: roundDownTo6Decimals(split.unidex.margin).toFixed(6),
        size: roundDownTo6Decimals(split.unidex.size).toFixed(6),
        expectedMarginWalletAfter: marginWalletBalance.toFixed(6)
      });
    } else if (split.gtrade) {
      const onectBalance = parseFloat(balances?.formattedUsdcBalance || "0");
      console.log('=== gTrade Only Order ===', {
        margin: roundDownTo6Decimals(split.gtrade.margin).toFixed(6),
        size: roundDownTo6Decimals(split.gtrade.size).toFixed(6),
        tradingFee: roundDownTo6Decimals(split.gtrade.size * 0.0006).toFixed(6),
        expectedOnectWalletAfter: (onectBalance - roundDownTo6Decimals(split.gtrade.margin)).toFixed(6)
      });
    }

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
  };

  return {
    ...routingInfo,
    splitOrderInfo,
    executeOrder
  };
}