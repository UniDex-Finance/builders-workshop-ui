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
  const [initialPrice, setInitialPrice] = useState<number | null>(null);
  const [change, setChange] = useState<Change24h>({
    absoluteChange: 0,
    percentageChange: 0,
    loading: true,
    error: null,
  });
  
  const { prices } = usePrices();
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchInitialPrice = async () => {
      try {
        const symbol = selectedPair.split('/')[0].toLowerCase();
        const now = Math.floor(Date.now() / 1000);
        const twentyFourHoursAgo = now - (24 * 60 * 60);
        
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
        
        const previousPrice = data.c[0];
        
        if (isMounted) {
          setInitialPrice(previousPrice);
          setChange((prev) => ({
            ...prev,
            loading: false,
            error: null,
          }));
        }
      } catch (error) {
        if (isMounted) {
          setChange({
            absoluteChange: 0,
            percentageChange: 0,
            loading: false,
            error: error instanceof Error ? error.message : 'An error occurred',
          });
        }
      }
    };
    
    fetchInitialPrice();
    
    return () => {
      isMounted = false;
    };
  }, [selectedPair]);
  
  useEffect(() => {
    if (initialPrice !== null) {
      const symbol = selectedPair.split('/')[0].toLowerCase();
      const currentPrice = prices[symbol]?.price;
      
      if (currentPrice !== undefined) {
        const absoluteChange = currentPrice - initialPrice;
        const percentageChange = (absoluteChange / initialPrice) * 100;
        
        setChange({
          absoluteChange,
          percentageChange,
          loading: false,
          error: null,
        });
      }
    }
  }, [prices, initialPrice, selectedPair]);
  
  return change;
} 