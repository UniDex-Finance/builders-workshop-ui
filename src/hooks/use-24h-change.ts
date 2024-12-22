import { useState, useEffect } from 'react';
import { usePrices } from '../lib/websocket-price-context';
import { useBasePrices } from '../lib/daily-base-prices-context';

interface Change24h {
  absoluteChange: number;
  percentageChange: number;
  loading: boolean;
  error: string | null;
}

export function use24hChange(selectedPair: string): Change24h {
  const { prices: currentPrices } = usePrices();
  const { prices: basePrices } = useBasePrices();
  const [change, setChange] = useState<Change24h>({
    absoluteChange: 0,
    percentageChange: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const symbol = selectedPair.split('/')[0].toLowerCase();
    const currentPrice = currentPrices[symbol]?.price;
    const basePrice = basePrices[symbol];

    if (basePrice === undefined) {
      setChange({
        absoluteChange: 0,
        percentageChange: 0,
        loading: false,
        error: 'Base price not available',
      });
      return;
    }

    if (currentPrice === undefined) {
      setChange({
        absoluteChange: 0,
        percentageChange: 0,
        loading: false,
        error: 'Current price not available',
      });
      return;
    }

    const absoluteChange = currentPrice - basePrice;
    const percentageChange = (absoluteChange / basePrice) * 100;

    setChange({
      absoluteChange,
      percentageChange,
      loading: false,
      error: null,
    });
  }, [currentPrices, basePrices, selectedPair]);

  return change;
} 