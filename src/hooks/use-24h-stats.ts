import { useState, useEffect, useRef } from 'react';
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
  const { prices: basePrices, highLowData, lastUpdated: basePricesLastUpdated } = useBasePrices();

  const symbol = selectedPair.split('/')[0].toLowerCase();

  const highRef = useRef<number | null>(null);
  const lowRef = useRef<number | null>(null);
  const basePriceRef = useRef<number | null>(null);

  const [stats, setStats] = useState<Stats24h>({
    absoluteChange: 0,
    percentageChange: 0,
    high24h: 0,
    low24h: 0,
    loading: true,
    error: null,
  });

  const isInitialized = useRef(false);

  useEffect(() => {
    isInitialized.current = false;
    highRef.current = null;
    lowRef.current = null;
    basePriceRef.current = null;
    setStats({
        absoluteChange: 0, percentageChange: 0, high24h: 0, low24h: 0,
        loading: true, error: null
    });

    if (basePricesLastUpdated === null) {
        return;
    }

    const basePrice = basePrices[symbol];
    const initialHighLow = highLowData?.[symbol];

    if (basePrice === undefined) {
      setStats({
        absoluteChange: 0, percentageChange: 0, high24h: 0, low24h: 0,
        loading: false, error: 'Base price not available',
      });
      return;
    }

    basePriceRef.current = basePrice;

    const initialHigh = initialHighLow?.high ?? basePrice;
    const initialLow = initialHighLow?.low ?? basePrice;

    highRef.current = initialHigh;
    lowRef.current = initialLow;

    const initialAbsChange = 0;
    const initialPercChange = 0;

    setStats({
      absoluteChange: initialAbsChange,
      percentageChange: initialPercChange,
      high24h: highRef.current,
      low24h: lowRef.current,
      loading: false,
      error: null,
    });

    isInitialized.current = true;

  }, [symbol, basePrices, highLowData, basePricesLastUpdated]);

  useEffect(() => {
    if (!isInitialized.current || highRef.current === null || lowRef.current === null || basePriceRef.current === null) {
      return;
    }

    const currentPrice = currentPrices[symbol]?.price;
    const basePrice = basePriceRef.current;

    if (currentPrice === undefined) {
        return;
    }

    const previousLow = lowRef.current;
    const previousHigh = highRef.current;

    let boundsChanged = false;
    if (currentPrice > highRef.current) {
        highRef.current = currentPrice;
        boundsChanged = true;
    }
    if (currentPrice < lowRef.current) {
        lowRef.current = currentPrice;
        boundsChanged = true;
    }

    const absoluteChange = currentPrice - basePrice;
    const percentageChange = basePrice === 0 ? 0 : (absoluteChange / basePrice) * 100;

    setStats(prev => ({
        ...prev,
        absoluteChange,
        percentageChange,
        high24h: highRef.current!,
        low24h: lowRef.current!,
        error: null
    }));

  }, [currentPrices, symbol]);

  return stats;
}