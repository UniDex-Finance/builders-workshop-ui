import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useMarketData } from './use-market-data';

export function usePairFromUrl(defaultPair: string = 'ETH/USD') {
  const router = useRouter();
  const [selectedPair, setSelectedPair] = useState(defaultPair);
  const { allMarkets } = useMarketData();

  // Memoize the valid pairs set for faster lookups
  const validPairs = useMemo(() => {
    return new Set(allMarkets.map(m => m.pair));
  }, [allMarkets]);

  // Handle URL changes
  useEffect(() => {
    const { pair } = router.query;
    if (typeof pair === 'string' && validPairs.has(pair)) {
      setSelectedPair(pair);
    }
  }, [router.query, validPairs]);

  // Memoize the setPair function
  const setPair = useCallback((pair: string) => {
    setSelectedPair(pair);
    // Use replaceState instead of push to avoid adding to browser history
    router.replace(`/?pair=${pair}`, undefined, { 
      shallow: true,
      scroll: false // Prevent unnecessary scrolling
    });
  }, [router]);

  return {
    selectedPair,
    setPair,
  };
}