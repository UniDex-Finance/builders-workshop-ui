import { useState, useEffect, useCallback, useRef } from 'react';
import { usePrices } from '../../../lib/websocket-price-context'; // Adjust path if needed
import { useSmartAccount } from '../../use-smart-account'; // Adjust path if needed
import { getUnidexPairFromGTradePair } from './use-gtrade-pairs'; // Adjust path if needed
import { Position } from '../unidex-hooks/use-unidex-positions'; // Import Position type from the unidex hook file

const GTRADE_API_URL = 'https://unidexv4-api-production.up.railway.app/api/gtrade/positions';

// Interface for the raw API response structure
interface RawGTradePosition {
  marketKey: string;
  avgEntryPrice: string;
  notionalValue: string;
  side: number; // 0 = long, 1 = short
  totalFees: string;
  leverage: string;
  owedInterest: string;
  index: string;
  // Add any other fields used from the API response
}

// gTrade specific liquidation price calculation (can be moved to utils)
function calculateGTradeLiquidationPrice(
  position: {
    size: string;
    margin: string;
    isLong: boolean;
    entryPrice: string;
    fees: { borrowFee: string; fundingFee: string; }
  }
): string {
  const margin = Number(position.margin);
  const size = Number(position.size);
  const entryPrice = Number(position.entryPrice);
  if (isNaN(margin) || isNaN(size) || isNaN(entryPrice) || entryPrice === 0 || size === 0) return '0'; // Basic validation

  const totalFees = Number(position.fees.borrowFee) + Number(position.fees.fundingFee);
  if (isNaN(totalFees)) return '0'; // Ensure fees are valid

  // Prevent division by zero if size is zero after conversion
  if (size === 0) return '0';

  const targetPnL = (-0.9 * margin) + totalFees;
  const requiredPriceDiff = (targetPnL * entryPrice) / size;

  if (position.isLong) {
    return (entryPrice + requiredPriceDiff).toFixed(10);
  } else {
    return (entryPrice - requiredPriceDiff).toFixed(10);
  }
}


export function useGTradePositions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [rawGTradeData, setRawGTradeData] = useState<RawGTradePosition[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false); // Default to false, set true only when needed
  const [error, setError] = useState<Error | null>(null);
  const { prices } = usePrices();
  const { smartAccount } = useSmartAccount();
  const isFetching = useRef<boolean>(false); // Ref to track ongoing fetches

  // Fetch raw data
  const fetchGTradePositions = useCallback(async (address: string, setLoadingState: boolean = false) => {
    // Prevent concurrent fetches only if already fetching
    if (!address || isFetching.current) return;

    isFetching.current = true;
    // Set loading state only if explicitly requested (initial load / manual refetch)
    if (setLoadingState) {
        setIsLoading(true);
        setError(null); // Clear previous errors on explicit load
    }

    try {
      const response = await fetch(`${GTRADE_API_URL}?address=${address}`);
      if (!response.ok) {
         // Log error but don't throw - just return empty data
         console.error(`Failed to fetch gTrade positions: ${response.statusText} (Status: ${response.status})`);
         setRawGTradeData([]);
         return;
      }
      const fetchedPositions: RawGTradePosition[] = await response.json();

      // Check if the data actually changed before updating state
      if (JSON.stringify(rawGTradeData) !== JSON.stringify(fetchedPositions)) {
          setRawGTradeData(fetchedPositions);
      }
       // If this was an explicit load request, clear potential previous error on success
       if (setLoadingState) {
           setError(null);
       }
    } catch (err) {
      console.error('Error fetching gTrade positions:', err);
      // Don't set error state - just log and continue with empty positions
      // This allows UniDex positions to still be displayed
      setRawGTradeData([]);
    } finally {
      isFetching.current = false;
       // Ensure loading is set back to false only if it was explicitly set true for this fetch
       if (setLoadingState) {
           setIsLoading(false);
       }
    }
    // Dependencies: rawGTradeData for comparison, positions.length for error logic
  }, [rawGTradeData, positions.length]);

  // Effect for interval fetching
  useEffect(() => {
    if (smartAccount?.address) {
      // Trigger initial fetch and set loading state
      fetchGTradePositions(smartAccount.address, true);

      const intervalId = setInterval(() => {
        // Subsequent fetches do not set loading state
        fetchGTradePositions(smartAccount.address, false);
      }, 5000); // Fetch every 5 seconds

      return () => clearInterval(intervalId);
    } else {
      // Reset state if address is removed
      setRawGTradeData([]);
      setPositions([]);
      setIsLoading(false); // Ensure loading is false when no address
      setError(null);
    }
    // Dependency: only address and the fetch function itself
  }, [smartAccount?.address, fetchGTradePositions]);

  // Effect for processing raw data when it or prices change
  useEffect(() => {
      const processedGTradePositions = rawGTradeData.map((pos: RawGTradePosition): Position | null => {
          // Convert marketKey string to number before passing
          const marketKeyNum = Number(pos.marketKey);
          if (isNaN(marketKeyNum)) {
              console.warn(`useGTradePositions: Invalid non-numeric market key: ${pos.marketKey}`);
              return null; // Skip if key is not a valid number
          }

          const market = getUnidexPairFromGTradePair(marketKeyNum);
          if (!market) {
              console.warn(`useGTradePositions: Unknown market key number: ${marketKeyNum}`);
              return null; // Filter out later
          }

          const symbol = market.split('/')[0].toLowerCase();
          const currentPrice = prices[symbol]?.price; // Can be number | "" | undefined
          const entryPriceNum = Number(pos.avgEntryPrice);

          let pnl = 'N/A';
          // Validate currentPrice is a number before using it
          const isCurrentPriceValid = typeof currentPrice === 'number' && !isNaN(currentPrice);

           if (isCurrentPriceValid || !isNaN(entryPriceNum)) { // Check if entry is valid too
               const markPrice = isCurrentPriceValid ? currentPrice : entryPriceNum; // Use valid price
               const size = Number(pos.notionalValue);
               if (!isNaN(size) && !isNaN(entryPriceNum) && entryPriceNum !== 0) { // Ensure size & entry are valid numbers, entry not zero
                   const priceDiff = pos.side === 0 ? (markPrice - entryPriceNum) : (entryPriceNum - markPrice);
                   const rawPnl = (priceDiff * size / entryPriceNum);
                   const totalFees = Number(pos.totalFees);
                   if (!isNaN(totalFees)) {
                        const finalPnl = rawPnl - totalFees;
                        pnl = finalPnl >= 0 ? `+$${finalPnl.toFixed(2)}` : `-$${Math.abs(finalPnl).toFixed(2)}`;
                   }
               }
           }

          const marginStr = (Number(pos.notionalValue) / Number(pos.leverage)).toString();
          const sizeStr = pos.notionalValue.toString();
          const entryPriceStr = pos.avgEntryPrice.toString();
          const borrowFeeStr = pos.owedInterest.toString();
          // Calculate funding fee - handle potential NaN
          const totalFeesNum = Number(pos.totalFees);
          const owedInterestNum = Number(pos.owedInterest);
          const fundingFeeNum = (!isNaN(totalFeesNum) && !isNaN(owedInterestNum)) ? ((totalFeesNum * 0.9) - owedInterestNum) : 0;
          const fundingFeeStr = fundingFeeNum.toFixed(2);

          const positionDataForLiq = {
              size: sizeStr,
              margin: marginStr,
              isLong: pos.side === 0,
              entryPrice: entryPriceStr,
              fees: { borrowFee: borrowFeeStr, fundingFee: fundingFeeStr }
          };

           // Calculate position fee - handle potential NaN
           const notionalValueNum = Number(pos.notionalValue);
           const positionFeeStr = !isNaN(notionalValueNum) ? (notionalValueNum * 0.0006).toFixed(2) : '0.00';


          return {
              market,
              size: sizeStr,
              entryPrice: entryPriceStr,
              markPrice: isCurrentPriceValid ? currentPrice.toFixed(2) : 'N/A',
              pnl,
              positionId: `g-${pos.index}`,
              isLong: pos.side === 0,
              margin: marginStr,
              liquidationPrice: calculateGTradeLiquidationPrice(positionDataForLiq),
              fees: {
                  positionFee: positionFeeStr,
                  borrowFee: borrowFeeStr,
                  fundingFee: fundingFeeStr
              }
          };
      }).filter((p): p is Position => p !== null); // Filter out nulls

      // Only update state if the processed list is different
       if (JSON.stringify(positions) !== JSON.stringify(processedGTradePositions)) {
           setPositions(processedGTradePositions);
       }

  }, [rawGTradeData, prices, positions]); // Added positions for comparison

    // Refetch function
    const refetch = useCallback(() => {
        if (smartAccount?.address) {
           // Manual refetch should trigger loading state
           fetchGTradePositions(smartAccount.address, true);
        }
    }, [smartAccount?.address, fetchGTradePositions]);


  return {
    positions,
    loading: isLoading, // Use the refined loading state
    error: error,
    refetch
  };
}
