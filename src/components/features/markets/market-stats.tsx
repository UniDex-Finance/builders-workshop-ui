import { useEffect } from 'react';
import { cn } from "../../../lib/utils";
import { use24hStats } from "../../../hooks/use-24h-stats";
import { usePairPrecision } from "../../../hooks/use-pair-precision";

interface MarketStatsProps {
  pair: string;
  onPercentageChange?: (value: number) => void;
}

interface PriceValueProps {
  pair: string;
  quoteToken: string;
}

export const MarketPriceChange = ({ 
  pair, 
  onPercentageChange
}: MarketStatsProps) => {
  const { percentageChange, error, loading } = use24hStats(pair);
  
  useEffect(() => {
    if (onPercentageChange && !error) {
      onPercentageChange(percentageChange);
    }
  }, [percentageChange, error, onPercentageChange, pair]);
  
  if (loading) {
    return <span className="text-muted-foreground">Loading...</span>;
  }
  
  if (error) {
    return <span className="text-muted-foreground">-</span>;
  }
  
  return (
    <span className={cn(
      percentageChange >= 0 ? "text-[color:var(--color-long)]" : "text-[color:var(--color-short)]"
    )}>
      {percentageChange >= 0 ? "+" : ""}{percentageChange.toFixed(2)}%
    </span>
  );
};

export const MarketHighValue = ({ pair, quoteToken }: PriceValueProps) => {
  const { high24h, error, loading } = use24hStats(pair);
  const { formatPairPrice } = usePairPrecision();
  
  if (loading) {
    return <span className="text-muted-foreground">Loading...</span>;
  }
  
  if (error) {
    return <span className="text-muted-foreground">-</span>;
  }
  
  return (
    <div className="flex items-center justify-end gap-1">
      <span className="font-medium">{formatPairPrice(pair, high24h)}</span>
      <span className="text-xs text-muted-foreground">{quoteToken}</span>
    </div>
  );
};

export const MarketLowValue = ({ pair, quoteToken }: PriceValueProps) => {
  const { low24h, error, loading } = use24hStats(pair);
  const { formatPairPrice } = usePairPrecision();
  
  if (loading) {
    return <span className="text-muted-foreground">Loading...</span>;
  }
  
  if (error) {
    return <span className="text-muted-foreground">-</span>;
  }
  
  return (
    <div className="flex items-center justify-end gap-1">
      <span className="font-medium">{formatPairPrice(pair, low24h)}</span>
      <span className="text-xs text-muted-foreground">{quoteToken}</span>
    </div>
  );
}; 