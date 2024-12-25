import { useState, useEffect } from 'react';

// Map trading pairs to their market IDs
const MARKET_IDS: Record<string, number> = {
  'BTC/USD': 1,
  'ETH/USD': 2,
  'SOL/USD': 4,
  // Add more pairs as needed
};

interface ApiResponse {
  market: {
    id: number;
    pair: string;
  };
  duration: string;
  granularity: string;
  timeRange: {
    start: string;
    end: string;
  };
  dataPoints: number;
  history: Array<{
    timestamp: string;
    rate: string;
    usdm_price: string;
  }>;
}

export interface FundingData {
  timestamp: number;
  rate: number;
}

export function useFundingHistory(pair: string) {
  const [data, setData] = useState<FundingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchFundingHistory = async () => {
      setLoading(true);
      try {
        const marketId = MARKET_IDS[pair];
        if (!marketId) {
          throw new Error(`Market ID not found for pair ${pair}`);
        }

        const response = await fetch(
          `https://unidexv4-market-data.up.railway.app/api/market/${marketId}/history/duration/30d?granularity=15m`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const apiData: ApiResponse = await response.json();
        
        // Log raw data to see what we're getting
        console.log('Raw API data sample:', {
          firstFew: apiData.history.slice(0, 5),
          total: apiData.history.length
        });

        // Transform the API data into our FundingData format
        const transformedData: FundingData[] = apiData.history
          .filter(item => item.rate !== "0") // Filter out zero values
          .map(item => ({
            timestamp: parseInt(item.timestamp),
            rate: Number(item.rate)
          }));

        console.log('Transformed data sample:', {
          firstFew: transformedData.slice(0, 5),
          total: transformedData.length
        });

        setData(transformedData);
        setError(null);
      } catch (err) {
        console.error('Error fetching funding history:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch funding history'));
      } finally {
        setLoading(false);
      }
    };

    fetchFundingHistory();
  }, [pair]);

  return { data, loading, error };
} 