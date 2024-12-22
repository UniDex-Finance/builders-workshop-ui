import { useState, useEffect } from 'react';
import { usePrices } from '../lib/websocket-price-context';

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
        const response = await fetch('https://charting.molten.exchange/api/daily-base-prices');
        
        if (!response.ok) {
          throw new Error('Failed to fetch price data');
        }
        
        const data = await response.json();
        const basePrice = data.prices[symbol];
        
        if (basePrice === undefined) {
          throw new Error('Price not available for this pair');
        }
        
        if (isMounted) {
          setInitialPrice(basePrice);
          setChange(prev => ({
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