import { useState, useEffect } from 'react';
import { usePrices } from '../lib/websocket-price-context';
import { useBasePrices } from '../lib/daily-base-prices-context';

interface Stats24h {
  absoluteChange: number;
  percentageChange: number;
  high24h: number;
  low24h: number;
  loading: boolean;
  error: string | null;
}

export function use24hStats(selectedPair: string): Stats24h {
  const { prices: currentPrices } = usePrices();
  const { prices: basePrices, lastUpdated, highLowData } = useBasePrices();
  const [stats, setStats] = useState<Stats24h>({
    absoluteChange: 0,
    percentageChange: 0,
    high24h: 0,
    low24h: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const symbol = selectedPair.split('/')[0].toLowerCase();
    const currentPrice = currentPrices[symbol]?.price;
    const basePrice = basePrices[symbol];
    const highLow = highLowData?.[symbol];

    if (basePrice === undefined) {
      setStats({
        absoluteChange: 0,
        percentageChange: 0,
        high24h: 0,
        low24h: 0,
        loading: false,
        error: 'Base price not available',
      });
      return;
    }

    if (currentPrice === undefined) {
      setStats({
        absoluteChange: 0,
        percentageChange: 0,
        high24h: 0,
        low24h: 0,
        loading: false,
        error: 'Current price not available',
      });
      return;
    }

    const absoluteChange = currentPrice - basePrice;
    const percentageChange = (absoluteChange / basePrice) * 100;
    
    // Use high/low from API if available, otherwise calculate best guess
    const high24h = highLow?.high || Math.max(currentPrice, basePrice);
    const low24h = highLow?.low || Math.min(currentPrice, basePrice);

    setStats({
      absoluteChange,
      percentageChange,
      high24h,
      low24h,
      loading: false,
      error: null,
    });
  }, [currentPrices, basePrices, highLowData, selectedPair]);

  return stats;
} 