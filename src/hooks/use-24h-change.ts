import { useState, useEffect } from 'react';
import { usePrices } from '../lib/websocket-price-context';

interface PriceData {
  s: string;
  t: number[];
  o: number[];
  h: number[];
  l: number[];
  c: number[];
  v: number[];
}

interface Change24h {
  absoluteChange: number;
  percentageChange: number;
  loading: boolean;
  error: string | null;
}

export function use24hChange(selectedPair: string): Change24h {
  const [change, setChange] = useState<Change24h>({
    absoluteChange: 0,
    percentageChange: 0,
    loading: true,
    error: null,
  });
  
  const { prices } = usePrices();
  
  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        // Get base symbol (e.g., "btc" from "BTC/USD")
        const symbol = selectedPair.split('/')[0].toLowerCase();
        
        // Get UTC timestamp for 24 hours ago
        const now = Math.floor(Date.now() / 1000);
        const twentyFourHoursAgo = now - (24 * 60 * 60);
        
        // Fetch historical data
        const response = await fetch(
          `https://charting.molten.exchange/tradingview?symbol=${symbol}&resolution=1&from=${twentyFourHoursAgo}&to=${now}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch price data');
        }
        
        const data: PriceData = await response.json();
        
        if (data.s !== 'ok' || !data.c || data.c.length === 0) {
          throw new Error('Invalid price data received');
        }
        
        // Get current price from websocket prices
        const currentPrice = prices[symbol]?.price;
        
        if (!currentPrice) {
          throw new Error('Current price not available');
        }
        
        // Get the closing price from 24h ago
        const previousPrice = data.c[0];
        
        // Calculate changes
        const absoluteChange = currentPrice - previousPrice;
        const percentageChange = (absoluteChange / previousPrice) * 100;
        
        setChange({
          absoluteChange,
          percentageChange,
          loading: false,
          error: null,
        });
        
      } catch (error) {
        setChange({
          absoluteChange: 0,
          percentageChange: 0,
          loading: false,
          error: error instanceof Error ? error.message : 'An error occurred',
        });
      }
    };
    
    fetchPriceData();
    
    // Set up interval to fetch every minute
    const interval = setInterval(fetchPriceData, 60000);
    
    return () => clearInterval(interval);
  }, [selectedPair, prices]);
  
  return change;
} 