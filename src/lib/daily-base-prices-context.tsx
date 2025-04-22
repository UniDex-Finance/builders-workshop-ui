import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface BasePrices {
  [key: string]: number;
}

interface HighLowData {
  [key: string]: {
    high: number;
    low: number;
  };
}

interface BasePricesContextType {
  prices: BasePrices;
  highLowData: HighLowData | null;
  lastUpdated: number | null;
}

const BasePricesContext = createContext<BasePricesContextType>({
  prices: {},
  highLowData: null,
  lastUpdated: null,
});

export function DailyBasePricesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BasePricesContextType>({
    prices: {},
    highLowData: null,
    lastUpdated: null,
  });

  const fetchBasePrices = async () => {
    try {
      const response = await fetch('https://charting.molten.exchange/api/daily-base-prices');
      if (!response.ok) {
        console.error('Failed to fetch daily base prices');
        return;
      }
      
      const data = await response.json();
      setState({
        prices: data.prices,
        highLowData: data.highLowData || null, // Assuming API now returns highLowData
        lastUpdated: Date.now(),
      });
    } catch (error) {
      console.error('Error fetching daily base prices:', error);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchBasePrices();

    // Schedule updates at 00:01 UTC
    const scheduleNextUpdate = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCHours(24, 1, 0, 0); // 00:01 UTC next day
      const timeUntilNextUpdate = tomorrow.getTime() - now.getTime();
      
      return setTimeout(() => {
        fetchBasePrices();
        // Schedule next update after this one completes
        scheduleNextUpdate();
      }, timeUntilNextUpdate);
    };

    const timeout = scheduleNextUpdate();
    return () => clearTimeout(timeout);
  }, []);

  return (
    <BasePricesContext.Provider value={state}>
      {children}
    </BasePricesContext.Provider>
  );
}

export const useBasePrices = () => {
  const context = useContext(BasePricesContext);
  if (context === undefined) {
    throw new Error('useBasePrices must be used within a DailyBasePricesProvider');
  }
  return context;
}; 