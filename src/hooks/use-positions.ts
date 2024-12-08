import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { usePrices } from '../lib/websocket-price-context';
import { useSmartAccount } from './use-smart-account';
import { lensAbi } from '../lib/abi/lens';
import { arbitrum } from 'viem/chains';
import { TRADING_PAIRS } from './use-market-data';
import { GTRADE_PAIR_MAPPING, getUnidexPairFromGTradePair } from './trading-hooks/gtrade-hooks/use-gtrade-pairs';

const LENS_CONTRACT_ADDRESS = '0xeae57c7bce5caf160343a83440e98bc976ab7274' as `0x${string}`;
const SCALING_FACTOR = 30; // For formatUnits
const GTRADE_API_URL = 'https://unidexv4-api-production.up.railway.app/api/gtrade/positions';

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

export function usePositions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const { prices } = usePrices();
  const { smartAccount } = useSmartAccount();

  // Use only the contract polling, remove manual interval
  const { data: contractResult, isError, isLoading, refetch } = useReadContract({
    address: LENS_CONTRACT_ADDRESS,
    abi: lensAbi,
    functionName: 'getUserAlivePositions',
    args: smartAccount?.address ? [smartAccount.address as `0x${string}`] : undefined,
    query: {
      enabled: Boolean(smartAccount?.address),
      refetchInterval: 4000,
      // Add stale time to prevent unnecessary refetches
      staleTime: 3000,
    },
    chainId: arbitrum.id
  });

  // Memoize the fetch function to prevent unnecessary recreations
  const fetchGTradePositions = async (address: string): Promise<Position[]> => {
    try {
      const response = await fetch(`${GTRADE_API_URL}?address=${address}`);
      if (!response.ok) {
        throw new Error('Failed to fetch gTrade positions');
      }
      
      const positions = await response.json();
      return positions
        .map((pos: any) => {
          // Get the market name from the marketKey using our pair mapping
          const market = getUnidexPairFromGTradePair(pos.marketKey);
          if (!market) {
            console.warn(`Unknown market key: ${pos.marketKey}`);
            return undefined;
          }

          const symbol = market.split('/')[0].toLowerCase();
          const currentPrice = prices[symbol]?.price;
          
          // Calculate PnL including fees
          const totalPnl = pos.unrealizedPnl.pnl - pos.totalFees;
          
          return {
            market,
            size: pos.notionalValue.toString(),
            entryPrice: pos.avgEntryPrice.toString(),
            markPrice: currentPrice?.toFixed(2) || 'Loading...',
            pnl: totalPnl >= 0 ? `+$${totalPnl.toFixed(2)}` : `-$${Math.abs(totalPnl).toFixed(2)}`,
            positionId: `g-${pos.index}`, // Use the index as the position ID with 'g-' prefix
            isLong: pos.side === 0, // 0 for LONG, 1 for SHORT
            margin: (pos.notionalValue / pos.leverage).toString(),
            liquidationPrice: pos.liquidationPrice.toString(),
            fees: {
              positionFee: (pos.totalFees * 0.1).toFixed(2), // Assuming 10% of total fees is position fee
              borrowFee: pos.owedInterest.toString(),
              fundingFee: ((pos.totalFees * 0.9) - pos.owedInterest).toFixed(2) // Remaining fees minus interest
            }
          } as Position;
        })
        .filter((pos: Position | undefined): pos is Position => pos !== undefined);
    } catch (error) {
      console.error('Error fetching gTrade positions:', error);
      return [];
    }
  };

  // Update positions only when contract data or smart account changes
  // Remove prices from dependencies unless absolutely needed
  useEffect(() => {
    async function fetchAllPositions() {
      if (!smartAccount?.address) {
        setPositions([]);
        return;
      }

      try {
        // Fetch gTrade positions
        const gTradePositions = await fetchGTradePositions(smartAccount.address);

        // Process UniDEX positions
        let unidexPositions: Position[] = [];
        if (contractResult && Array.isArray(contractResult)) {
          const [posIds, positionsData, , , paidFeesData, accruedFeesData] = contractResult;

          if (positionsData.length) {
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

        setPositions([...unidexPositions, ...gTradePositions]);
      } catch (error) {
        console.error('Error fetching positions:', error);
      }
    }

    fetchAllPositions();
  }, [contractResult, smartAccount?.address]);

  // Separate effect for updating prices only
  useEffect(() => {
    if (positions.length === 0) return;
    
    const updatedPositions = positions.map(position => {
      const priceKey = getPriceKeyFromTokenId(position.positionId);
      const currentPrice = priceKey && prices[priceKey]?.price;
      
      return {
        ...position,
        markPrice: currentPrice ? currentPrice.toFixed(2) : position.markPrice,
      };
    });

    setPositions(updatedPositions);
  }, [prices]);

  return {
    positions,
    loading: isLoading,
    error: isError ? new Error('Failed to fetch positions') : null,
    refetch
  };
}
