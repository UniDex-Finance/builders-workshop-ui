import { useMemo } from 'react';
import { useMarketData } from './use-market-data';

interface PrecisionConfig {
  minDecimals: number;
  maxDecimals: number;
}

// Default precision configuration
const DEFAULT_PRECISION: PrecisionConfig = {
  minDecimals: 5,
  maxDecimals: 5
};

// Special cases for specific pairs
const PRECISION_OVERRIDES: Record<string, PrecisionConfig> = {
  'BTC/USD': { minDecimals: 2, maxDecimals: 2 },
  'ETH/USD': { minDecimals: 2, maxDecimals: 2 },
  'S/USD': { minDecimals: 4, maxDecimals: 4 },
  'SOL/USD': { minDecimals: 3, maxDecimals: 3 },
  'DOGE/USD': { minDecimals: 4, maxDecimals: 4 },
  'PEPE/USD': { minDecimals: 9, maxDecimals: 9 },
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
};

export const usePairPrecision = () => {
  const { allMarkets } = useMarketData({});

  const pairPrecisionMap = useMemo(() => {
    const map = new Map<string, PrecisionConfig>();
    
    // Initialize with all available pairs
    allMarkets.forEach(market => {
      // Check if there's a specific override for this pair
      const override = PRECISION_OVERRIDES[market.pair];
      if (override) {
        map.set(market.pair, override);
      } else {
        // If no override exists, use the default precision
        map.set(market.pair, DEFAULT_PRECISION);
      }
    });

    return map;
  }, [allMarkets]);

  const formatPairPrice = (pair: string, price: number | undefined): string => {
    if (price === undefined) return '...';
    
    const precision = pairPrecisionMap.get(pair) || DEFAULT_PRECISION;
    
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: precision.minDecimals,
      maximumFractionDigits: precision.maxDecimals,
      useGrouping: true
    }).format(price);
  };

  return {
    getPrecision: (pair: string) => pairPrecisionMap.get(pair) || DEFAULT_PRECISION,
    formatPairPrice,
  };
}; 