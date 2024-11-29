import { useState, useEffect } from 'react';
import { GTRADE_PAIR_MAPPING, getUnidexPairFromGTradePair } from './use-gtrade-pairs';

interface GTradeMarket {
  name: string;
  marketKey: number;
  from: string;
  to: string;
  category: number;
  leverage: {
    min: number;
    max: number;
  };
  openInterest: {
    long: number;
    short: number;
    max: number;
  };
  borrowingFees: {
    borrowRateForLong: number;
    borrowRateForShort: number;
    dailyRateForLong: number;
    dailyRateForShort: number;
  };
  tradingFees: {
    totalPositionSizeFeeP: number;
    totalLiqCollateralFeeP: number;
    oraclePositionSizeFeeP: number;
    minPositionSizeUsd: number;
  };
  spread: number;
  isSuspended: boolean;
  utilization: {
    long: number;
    short: number;
  };
}

interface GTradeMarketsResponse {
  success: boolean;
  markets: GTradeMarket[];
}

export function useGTradeMarketData() {
  const [markets, setMarkets] = useState<GTradeMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const response = await fetch('https://unidexv4-api-production.up.railway.app/api/gtrade/markets');
        const data: GTradeMarketsResponse = await response.json();

        if (data.success) {
          // Filter markets to only include those we support
          const supportedMarkets = data.markets.filter(market => {
            // Check if this gTrade market maps to one of our supported pairs
            return Object.values(GTRADE_PAIR_MAPPING).includes(market.marketKey);
          });

          // Map the markets to include our internal pair mapping
          const mappedMarkets = supportedMarkets.map(market => {
            const unidexPair = getUnidexPairFromGTradePair(market.marketKey);
            return {
              ...market,
              unidexPair // Add the corresponding Unidex pair name if it exists
            };
          });

          setMarkets(mappedMarkets);
          console.log('Mapped gTrade markets:', mappedMarkets);
        } else {
          throw new Error('Failed to fetch gTrade markets');
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching gTrade markets:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch markets'));
        setLoading(false);
      }
    };

    fetchMarkets();
    
    // Set up polling every 30 seconds
    const interval = setInterval(fetchMarkets, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    markets,
    loading,
    error
  };
}