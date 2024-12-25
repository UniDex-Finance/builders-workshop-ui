import { useState, useEffect, useRef } from 'react';
import { TRADING_PAIRS } from './use-market-data';

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

export function useFundingHistory(pair: string, isActive: boolean = false) {
  const [data, setData] = useState<FundingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout>();

  const fetchFundingHistory = async () => {
    try {
      // Find the market ID by matching the pair
      const marketId = Object.entries(TRADING_PAIRS).find(([_, p]) => p === pair)?.[0];
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
      
      // Transform the API data into our FundingData format
      const transformedData: FundingData[] = apiData.history
        .filter(item => item.rate !== "0") // Filter out zero values
        .map(item => ({
          timestamp: parseInt(item.timestamp),
          rate: Number(item.rate)
        }));

      setData(transformedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching funding history:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch funding history'));
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    setLoading(true);
    fetchFundingHistory();
  }, [pair]);

  // Setup polling when active
  useEffect(() => {
    if (isActive) {
      // Clear any existing interval
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }

      // Start polling every minute
      pollingInterval.current = setInterval(() => {
        fetchFundingHistory();
      }, 60000); // 60 seconds

      // Initial fetch when becoming active
      fetchFundingHistory();

      return () => {
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
        }
      };
    } else {
      // Clean up interval when becoming inactive
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = undefined;
      }
    }
  }, [isActive, pair]);

  return { data, loading, error };
} 