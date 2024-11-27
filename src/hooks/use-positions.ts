import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { usePrices } from '../lib/websocket-price-context';
import { useSmartAccount } from './use-smart-account';
import { lensAbi } from '../lib/abi/lens';
import { arbitrum } from 'viem/chains';
import { TRADING_PAIRS } from './use-market-data';
import { useGTradeSdk } from './use-gtrade-sdk';
import { getPositions } from "@gainsnetwork/trading-sdk/lib/adapters/kwenta";

const LENS_CONTRACT_ADDRESS = '0xeae57c7bce5caf160343a83440e98bc976ab7274' as `0x${string}`;
const SCALING_FACTOR = 30; // For formatUnits

export interface Position {
  market: string;
  size: string;
  entryPrice: string;
  markPrice: string;
  pnl: string;
  positionId: string;
  isLong: boolean;
  margin: string;
  liquidationPrice: string;
  fees: {
    positionFee: string;
    borrowFee: string;
    fundingFee: string;
  };
}

interface ContractPosition {
  owner: `0x${string}`;
  refer: `0x${string}`;
  isLong: boolean;
  tokenId: bigint;
  averagePrice: bigint;
  collateral: bigint;
  fundingIndex: bigint;
  lastIncreasedTime: bigint;
  size: bigint;
  accruedBorrowFee: bigint;
}


interface ContractPaidFees {
  paidPositionFee: bigint;
  paidBorrowFee: bigint;
  paidFundingFee: bigint;
}

interface ContractAccruedFees {
  positionFee: bigint;
  borrowFee: bigint;
  fundingFee: bigint;
}

interface GTradePosition {
  marketKey: number;
  user: string;
  side: number; // 0 for LONG, 1 for SHORT
  avgEntryPrice: number;
  notionalValue: number;
  size: number;
  owedInterest: number;
  totalFees: number;
  liquidationPrice: number;
  leverage: number;
  unrealizedPnl: {
    pnl: number;
    netPnlPct: number;
  };
}

// Helper function to get price key from token ID
function getPriceKeyFromTokenId(tokenId: string): string {
  const market = TRADING_PAIRS[tokenId];
  if (!market) return '';
  
  // Extract the token symbol before /USD and convert to lowercase
  const symbol = market.split('/')[0].toLowerCase();
  return symbol;
}

function calculateLiquidationPrice(
  position: ContractPosition, 
  entryPrice: number,
  accruedFees: { borrowFee: bigint; fundingFee: bigint }
): string {
  const margin = Number(formatUnits(position.collateral, SCALING_FACTOR));
  const size = Number(formatUnits(position.size, SCALING_FACTOR));
  
  // Convert fees to numbers
  const totalFees = Number(formatUnits(accruedFees.borrowFee + accruedFees.fundingFee, SCALING_FACTOR));
  
  // We want: (priceDiff * size / entryPrice) - fees = -0.9 * margin
  // Rearranging for priceDiff:
  // priceDiff * size / entryPrice = (-0.9 * margin) + fees
  // priceDiff = ((-0.9 * margin) + fees) * entryPrice / size
  
  const targetPnL = (-0.9 * margin) + totalFees;
  const requiredPriceDiff = (targetPnL * entryPrice) / size;

  if (position.isLong) {
    return (entryPrice + requiredPriceDiff).toFixed(2);
  } else {
    return (entryPrice - requiredPriceDiff).toFixed(2);
  }
}

function calculatePnL(
  position: ContractPosition,
  currentPrice: number,
  paidFees: ContractPaidFees,
  accruedFees: ContractAccruedFees
): { pnl: string; fees: { positionFee: string; borrowFee: string; fundingFee: string; } } {
  const entryPrice = Number(formatUnits(position.averagePrice, SCALING_FACTOR));
  const size = Number(formatUnits(position.size, SCALING_FACTOR));

  if (isNaN(entryPrice) || isNaN(currentPrice) || isNaN(size)) {
    return {
      pnl: 'N/A',
      fees: { positionFee: '0', borrowFee: '0', fundingFee: '0' }
    };
  }

  const priceDiff = position.isLong ?
    (currentPrice - entryPrice) :
    (entryPrice - currentPrice);

  const rawPnL = (priceDiff * size / entryPrice);

  // Convert fees
  const totalPositionFee = Number(formatUnits(paidFees.paidPositionFee + accruedFees.positionFee, SCALING_FACTOR));
  const totalBorrowFee = Number(formatUnits(paidFees.paidBorrowFee + accruedFees.borrowFee, SCALING_FACTOR));
  const totalFundingFee = Number(formatUnits(paidFees.paidFundingFee + accruedFees.fundingFee, SCALING_FACTOR));

  const finalPnL = rawPnL - totalPositionFee - totalBorrowFee - totalFundingFee;

  return {
    pnl: finalPnL >= 0 ?
      `+$${finalPnL.toFixed(2)}` :
      `-$${Math.abs(finalPnL).toFixed(2)}`,
    fees: {
      positionFee: totalPositionFee.toFixed(2),
      borrowFee: totalBorrowFee.toFixed(2),
      fundingFee: totalFundingFee.toFixed(2)
    }
  };
}

// Add this helper function at the top with other helpers
function calculateGTradePnL(
  position: GTradePosition,
  currentPrice: number
): { pnl: number; netPnlPct: number } {
  const { avgEntryPrice, notionalValue, side } = position;
  
  // Calculate position size in base currency (e.g., LINK)
  const sizeInToken = notionalValue / avgEntryPrice;
  
  // Calculate PnL
  const priceDiff = side === 0 ? // 0 is LONG
    (currentPrice - avgEntryPrice) :
    (avgEntryPrice - currentPrice);
  
  const pnl = priceDiff * sizeInToken;
  const netPnlPct = (priceDiff / avgEntryPrice) * 100;
  
  return { pnl, netPnlPct };
}

export function usePositions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const { prices } = usePrices();
  const { smartAccount } = useSmartAccount();
  const gTradeSdk = useGTradeSdk();
  const [isGTradeInitialized, setIsGTradeInitialized] = useState(false);

  // Initialize gTrade SDK only once
  useEffect(() => {
    async function initializeGTrade() {
      if (!isGTradeInitialized && gTradeSdk) {
        try {
          await gTradeSdk.initialize();
          setIsGTradeInitialized(true);
        } catch (error) {
          console.error('Failed to initialize gTrade SDK:', error);
        }
      }
    }

    initializeGTrade();
  }, [gTradeSdk, isGTradeInitialized]);

  // Existing UniDEX contract read with 5s polling
  const { data: contractResult, isError, isLoading, refetch } = useReadContract({
    address: LENS_CONTRACT_ADDRESS,
    abi: lensAbi,
    functionName: 'getUserAlivePositions',
    args: smartAccount?.address ? [smartAccount.address as `0x${string}`] : undefined,
    query: {
      enabled: Boolean(smartAccount?.address),
      refetchInterval: 5000
    },
    chainId: arbitrum.id // Explicitly set chainId to Arbitrum
  });

  // Separate effect for fetching positions with proper dependencies
  useEffect(() => {
    async function fetchAllPositions() {
      if (!smartAccount?.address || !isGTradeInitialized || !gTradeSdk) {
        setPositions([]);
        return;
      }

      try {
        // Fetch gTrade positions
        const state = await gTradeSdk.getState();
        if (!state) {
          console.warn('gTrade state is null');
          return;
        }

        const userTrades = await gTradeSdk.getUserTrades(smartAccount.address);
        console.log('userTrades', userTrades);
        if (!userTrades) {
          console.warn('No user trades found');
          return;
        }

        const gTradePositions = getPositions(state, userTrades);
        if (!gTradePositions?.length) {
          console.debug('No gTrade positions found');
        }

        // Format gTrade positions
        const formattedGTradePositions = (gTradePositions || []).map((pos: GTradePosition): Position => {
          const currentPrice = prices[state.pairs[pos.marketKey].from.toLowerCase()]?.price;
          const pnlCalc = currentPrice ? 
            calculateGTradePnL(pos, currentPrice) : 
            { pnl: 0, netPnlPct: 0 };

          // Get the actual trade index from the raw trade data
          const rawTrade = userTrades.find(t => 
            t.trade.pairIndex === pos.marketKey && 
            t.trade.user.toLowerCase() === pos.user.toLowerCase()
          );

          return {
            market: `${state.pairs[pos.marketKey].from}/${state.pairs[pos.marketKey].to}`,
            size: pos.notionalValue.toFixed(2),
            entryPrice: pos.avgEntryPrice.toFixed(2),
            markPrice: currentPrice?.toFixed(2) || 'Loading...',
            pnl: pnlCalc.pnl >= 0 
              ? `+$${pnlCalc.pnl.toFixed(2)}`
              : `-$${Math.abs(pnlCalc.pnl).toFixed(2)}`,
            positionId: `g-${rawTrade?.trade.index ?? 0}-${pos.user}`,
            isLong: pos.side === 0,
            margin: (pos.notionalValue / pos.leverage).toFixed(2),
            liquidationPrice: pos.liquidationPrice.toFixed(2),
            fees: {
              positionFee: (pos.totalFees * 0.1).toFixed(2),
              borrowFee: pos.owedInterest.toFixed(2),
              fundingFee: ((pos.totalFees * 0.9) - pos.owedInterest).toFixed(2)
            }
          };
        });

        console.log('formattedGTradePositions', formattedGTradePositions);

        // Process UniDEX positions
        let unidexPositions: Position[] = [];
        if (contractResult && Array.isArray(contractResult)) {
          const [posIds, positionsData, , , paidFeesData, accruedFeesData] = contractResult;

          if (!positionsData.length) {
            unidexPositions = [];
          } else {
            unidexPositions = positionsData.map((position: ContractPosition, index: number) => {
              const tokenId = position.tokenId.toString();
              const market = TRADING_PAIRS[tokenId] || `Token${tokenId}/USD`;
              const priceKey = getPriceKeyFromTokenId(tokenId);
              const currentPrice = priceKey && prices[priceKey]?.price;
              const entryPrice = Number(formatUnits(position.averagePrice, SCALING_FACTOR));
            
              const { pnl, fees } = currentPrice ?
                calculatePnL(
                  position,
                  currentPrice,
                  paidFeesData[index],
                  accruedFeesData[index]
                ) :
                { pnl: 'Loading...', fees: { positionFee: '0', borrowFee: '0', fundingFee: '0' } };
            
              return {
                positionId: posIds[index].toString(),
                market,
                size: Number(formatUnits(position.size, SCALING_FACTOR)).toFixed(2),
                entryPrice: entryPrice.toFixed(2),
                markPrice: currentPrice ? currentPrice.toFixed(2) : 'Loading...',
                pnl,
                isLong: position.isLong,
                margin: Number(formatUnits(position.collateral, SCALING_FACTOR)).toFixed(2),
                liquidationPrice: currentPrice ? calculateLiquidationPrice(
                  position, 
                  entryPrice,
                  accruedFeesData[index]
                ) : 'Loading...',
                fees
              };
            });
          }
        }

        // Combine both position types
        setPositions([...unidexPositions, ...formattedGTradePositions]);
      } catch (error) {
        console.error('Error fetching positions:', error);
      }
    }

    // Set up polling for gTrade positions
    const intervalId = setInterval(fetchAllPositions, 5000);
    fetchAllPositions(); // Initial fetch

    return () => clearInterval(intervalId);
  }, [
    contractResult,
    prices,
    smartAccount?.address,
    gTradeSdk,
    isGTradeInitialized
  ]);

  return {
    positions,
    loading: isLoading || !isGTradeInitialized,
    error: isError ? new Error('Failed to fetch positions') : null,
    refetch: async () => {
      refetch();
      // Manual refresh of gTrade positions will happen automatically via polling
    }
  };
}
