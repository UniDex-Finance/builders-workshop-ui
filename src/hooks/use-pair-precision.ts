import { useMemo } from 'react';
import { useMarketData } from './use-market-data';

// Move these outside the component to prevent recreating on each render
const DEFAULT_PRECISION = {
  minDecimals: 5,
  maxDecimals: 5
} as const;

const PRECISION_OVERRIDES = {
  'BTC/USD': { minDecimals: 2, maxDecimals: 2 },
  'ETH/USD': { minDecimals: 2, maxDecimals: 2 },
  'FTM/USD': { minDecimals: 4, maxDecimals: 4 },
  'SOL/USD': { minDecimals: 3, maxDecimals: 3 },
  'DOGE/USD': { minDecimals: 4, maxDecimals: 4 },
  'PEPE/USD': { minDecimals: 8, maxDecimals: 8 },
  'AAVE/USD': { minDecimals: 3, maxDecimals: 3 },
  'AVAX/USD': { minDecimals: 4, maxDecimals: 4 },
  'TAO/USD': { minDecimals: 3, maxDecimals: 3 },
  'XAU/USD': { minDecimals: 2, maxDecimals: 2 },
  'XAG/USD': { minDecimals: 2, maxDecimals: 2 },
  'QQQ/USD': { minDecimals: 2, maxDecimals: 2 },
  'SPY/USD': { minDecimals: 2, maxDecimals: 2 },
  'GMCI30/USD': { minDecimals: 2, maxDecimals: 2 },
  'GMCL2/USD': { minDecimals: 2, maxDecimals: 2 },
  'GMMEME/USD': { minDecimals: 2, maxDecimals: 2 },
} as const;

// Create a memoized formatter instance
const createNumberFormatter = (minDecimals: number, maxDecimals: number) => 
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
    useGrouping: true
  });

// Cache formatters to avoid recreating them
const formatterCache = new Map<string, Intl.NumberFormat>();

export const usePairPrecision = () => {
  const { allMarkets } = useMarketData({});

  const pairPrecisionMap = useMemo(() => {
    const map = new Map();
    
    allMarkets.forEach(market => {
      const override = PRECISION_OVERRIDES[market.pair as keyof typeof PRECISION_OVERRIDES];
      const precision = override || DEFAULT_PRECISION;
      map.set(market.pair, precision);
      
      // Pre-cache formatter for this precision configuration
      const cacheKey = `${precision.minDecimals}-${precision.maxDecimals}`;
      if (!formatterCache.has(cacheKey)) {
        formatterCache.set(
          cacheKey,
          createNumberFormatter(precision.minDecimals, precision.maxDecimals)
        );
      }
    });

    return map;
  }, [allMarkets]);

  const formatPairPrice = useMemo(() => {
    return (pair: string, price: number | undefined): string => {
      if (price === undefined) return '...';
      
      const precision = pairPrecisionMap.get(pair) || DEFAULT_PRECISION;
      const cacheKey = `${precision.minDecimals}-${precision.maxDecimals}`;
      const formatter = formatterCache.get(cacheKey) || 
        createNumberFormatter(precision.minDecimals, precision.maxDecimals);
      
      return formatter.format(price);
    };
  }, [pairPrecisionMap]);

  const getPrecision = useMemo(() => {
    return (pair: string) => pairPrecisionMap.get(pair) || DEFAULT_PRECISION;
  }, [pairPrecisionMap]);

  return {
    getPrecision,
    formatPairPrice,
  };
}; 