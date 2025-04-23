import { useState, useEffect, useCallback, useRef } from 'react';
import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { usePrices } from '../../../lib/websocket-price-context'; // Adjust path if needed
import { useSmartAccount } from '../../use-smart-account'; // Adjust path if needed
import { lensAbi } from '../../../lib/abi/lens'; // Adjust path if needed
import { arbitrum } from 'viem/chains';
import { TRADING_PAIRS } from '../../use-market-data'; // Adjust path if needed

// Interfaces (can be moved to a shared types file later)
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

const LENS_CONTRACT_ADDRESS = '0xeae57c7bce5caf160343a83440e98bc976ab7274' as `0x${string}`;
const SCALING_FACTOR = 30;

// Helper functions (can be moved to a shared utils file later)
function getPriceKeyFromTokenId(tokenId: string): string {
  const market = TRADING_PAIRS[tokenId];
  if (!market) return '';
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
  const totalFees = Number(formatUnits(accruedFees.borrowFee + accruedFees.fundingFee, SCALING_FACTOR));
  const targetPnL = (-0.9 * margin) + totalFees;
  if (size === 0 || entryPrice === 0) return '0'; // Avoid division by zero
  const requiredPriceDiff = (targetPnL * entryPrice) / size;

  if (position.isLong) {
    return (entryPrice + requiredPriceDiff).toFixed(10);
  } else {
    return (entryPrice - requiredPriceDiff).toFixed(10);
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

  if (isNaN(entryPrice) || entryPrice === 0 || isNaN(currentPrice) || isNaN(size)) {
    return { pnl: 'N/A', fees: { positionFee: '0', borrowFee: '0', fundingFee: '0' } };
  }

  const priceDiff = position.isLong ? (currentPrice - entryPrice) : (entryPrice - currentPrice);
  const rawPnL = (priceDiff * size / entryPrice);

  const totalPositionFee = Number(formatUnits(paidFees.paidPositionFee + accruedFees.positionFee, SCALING_FACTOR));
  const totalBorrowFee = Number(formatUnits(paidFees.paidBorrowFee + accruedFees.borrowFee, SCALING_FACTOR));
  const totalFundingFee = Number(formatUnits(paidFees.paidFundingFee + accruedFees.fundingFee, SCALING_FACTOR));
  const finalPnL = rawPnL - totalPositionFee - totalBorrowFee - totalFundingFee;

  return {
    pnl: finalPnL >= 0 ? `+$${finalPnL.toFixed(2)}` : `-$${Math.abs(finalPnL).toFixed(2)}`,
    fees: {
      positionFee: totalPositionFee.toFixed(2),
      borrowFee: totalBorrowFee.toFixed(2),
      fundingFee: totalFundingFee.toFixed(2)
    }
  };
}


export function useUnidexPositions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const { prices } = usePrices();
  const { smartAccount } = useSmartAccount();
  const hasFetchedOnce = useRef(false); // Track if we've ever successfully fetched

  const isHookEnabled = Boolean(smartAccount?.address);

  const {
    data: unidexResult,
    isError,
    isLoading: isWagmiLoading, // Use wagmi's loading state directly
    isSuccess,
    refetch
  } = useReadContract({
    address: LENS_CONTRACT_ADDRESS,
    abi: lensAbi,
    functionName: 'getUserAlivePositions',
    args: smartAccount?.address ? [smartAccount.address as `0x${string}`] : undefined,
    query: {
      enabled: isHookEnabled,
      refetchInterval: 500, // Keep interval
      staleTime: 250,
      // Removed notifyOnChangeProps to ensure loading state changes trigger updates if needed
    },
    chainId: arbitrum.id
  });

  // Track if a successful fetch has happened or if the address was removed
  useEffect(() => {
    if (isHookEnabled && isSuccess) {
      hasFetchedOnce.current = true;
    } else if (!isHookEnabled) {
      // Reset when address is removed/hook disabled
      hasFetchedOnce.current = false;
    }
  }, [isSuccess, isHookEnabled]);


  useEffect(() => {
    let processedPositions: Position[] = [];
    // Check if data is valid before processing
     if (
      isHookEnabled && // Ensure hook is enabled before processing
      Array.isArray(unidexResult) &&
      unidexResult.length >= 6 &&
      Array.isArray(unidexResult[0]) && // posIds
      Array.isArray(unidexResult[1]) && // positionsData
      Array.isArray(unidexResult[4]) && // paidFeesData
      Array.isArray(unidexResult[5]) && // accruedFeesData
      // unidexResult[1].length > 0 && // Allow processing empty results if structure is valid
      unidexResult[0].length === unidexResult[1].length && // posIds and positionsData match length
      unidexResult[4].length === unidexResult[0].length && // paidFees match length
      unidexResult[5].length === unidexResult[0].length // accruedFees match length
    ) {
       // ... existing mapping and processing logic ...
      const [posIds, positionsData, , , paidFeesData, accruedFeesData] = unidexResult;

      processedPositions = positionsData.map((position: ContractPosition, index: number) => {
        const paidFeeEntry = paidFeesData[index];
        const accruedFeeEntry = accruedFeesData[index];

        // Should not happen due to checks above, but safeguard
        if (!paidFeeEntry || !accruedFeeEntry) {
           console.warn(`useUnidexPositions: Missing fee data for index ${index}`);
           // Return a minimal placeholder or skip
           return null; // Will be filtered out later
        }

        const tokenId = position.tokenId.toString();
        const market = TRADING_PAIRS[tokenId] || `Token${tokenId}/USD`;
        const priceKey = getPriceKeyFromTokenId(tokenId);
        const currentPrice = priceKey && prices[priceKey]?.price;
        const entryPriceNum = Number(formatUnits(position.averagePrice || 0n, SCALING_FACTOR));
        const entryPrice = isNaN(entryPriceNum) ? 0 : entryPriceNum;

        const { pnl, fees } = (typeof currentPrice === 'number' && !isNaN(currentPrice)) ?
          calculatePnL(position, currentPrice, paidFeeEntry, accruedFeeEntry) :
          { pnl: 'Loading...', fees: { positionFee: '0', borrowFee: '0', fundingFee: '0' } };

        const sizeNum = Number(formatUnits(position.size || 0n, SCALING_FACTOR));
        const marginNum = Number(formatUnits(position.collateral || 0n, SCALING_FACTOR));

        return {
          positionId: posIds[index].toString(),
          market,
          size: isNaN(sizeNum) ? '0.00' : sizeNum.toFixed(2),
          entryPrice: entryPrice.toString(),
          markPrice: (typeof currentPrice === 'number' && !isNaN(currentPrice)) ? currentPrice.toFixed(2) : 'Loading...',
          pnl,
          isLong: position.isLong,
          margin: isNaN(marginNum) ? '0.00' : marginNum.toFixed(2),
          liquidationPrice: (typeof currentPrice === 'number' && !isNaN(currentPrice)) ? calculateLiquidationPrice(position, entryPrice, accruedFeeEntry) : 'Loading...',
          fees
        };
      }).filter((p): p is Position => p !== null); // Filter out any null placeholders


    } else if (!isHookEnabled) {
        processedPositions = []; // Clear if no address
    }
     // Only update if the processed list is different from the current state
    if (JSON.stringify(positions) !== JSON.stringify(processedPositions)) {
        setPositions(processedPositions);
    }
    // Include isHookEnabled in dependency array
  }, [unidexResult, smartAccount?.address, prices, positions, isHookEnabled]);


  // Determine final loading state:
  // Loading is true only if the hook is enabled, wagmi is loading, AND we haven't fetched successfully yet.
  const isLoading = isHookEnabled && isWagmiLoading && !hasFetchedOnce.current;

  return {
    positions,
    loading: isLoading, // Use the refined loading state
    error: isError ? new Error('Failed to fetch UniDex positions') : null,
    refetch
  };
}
