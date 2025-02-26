import React, { useState, useMemo } from "react";
import { useMarketData } from "../../../hooks/use-market-data";
import { usePrices } from "../../../lib/websocket-price-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";
import { cn } from "../../../lib/utils";
import { usePairPrecision } from "../../../hooks/use-pair-precision";
import { use24hChange } from "../../../hooks/use-24h-change";
import { useGTradeMarketData } from "../../../hooks/trading-hooks/gtrade-hooks/use-gtrade-market-data";
import { PairSelector } from "./PairSelector";

interface PairHeaderProps {
  selectedPair: string;
  onPairChange: (value: string) => void;
}

type TimeframeRate = "1h" | "1d" | "1y";

const formatCompactNumber = (num: number) => {
  // For numbers less than 100,000, use regular formatting with commas
  if (num < 100000) {
    return num.toLocaleString(undefined, { 
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    });
  }
  
  // For larger numbers, use compact notation
  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
    minimumFractionDigits: 1
  });
  
  return formatter.format(num);
};

const ProgressBar = ({ value, max, label }: { value: number; max: number; label: string }) => (
  <div className="mb-4">
    <div className="flex justify-between mb-1 text-xs">
      <div className="text-muted-foreground">{label} Current</div>
      <div className="text-muted-foreground">{label} Max</div>
    </div>
    <div className="flex justify-between mb-1.5">
      <div className="text-white">${formatCompactNumber(value)}</div>
      <div className="text-white">${formatCompactNumber(max)}</div>
    </div>
    <div className="w-full h-2 overflow-hidden rounded-full" style={{ backgroundColor: '#616161' }}>
      <div 
        className="h-full transition-all rounded-full bg-primary"
        style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
      />
    </div>
  </div>
);

export const PairHeader: React.FC<PairHeaderProps> = ({
  selectedPair,
  onPairChange,
}) => {
  const [rateTimeframe, setRateTimeframe] = useState<TimeframeRate>("1h");
  const { formatPairPrice } = usePairPrecision();
  
  const { marketData: unidexMarketData, loading: unidexLoading, error: unidexError } = useMarketData({
    selectedPair,
  });
  const { markets: gtradeMarkets, loading: gtradeLoading, error: gtradeError } = useGTradeMarketData();

  const gtradeMarket = gtradeMarkets.find(m => m.name === selectedPair);

  const combinedData = useMemo(() => {
    // Default values when no data is available
    const defaultData = {
      longOpenInterest: 0,
      shortOpenInterest: 0,
      maxLongOpenInterest: 0,
      maxShortOpenInterest: 0,
      longShortRatio: {
        longPercentage: 50,
        shortPercentage: 50,
      },
      borrowRateForLong: 0,
      borrowRateForShort: 0,
      fundingRate: 0,
    };

    // If both data sources are missing, return default data
    if (!unidexMarketData && !gtradeMarket) {
      return defaultData;
    }

    const formatBorrowRate = (rate: number) => {
      return rate < 0.0001 ? 0 : Number(rate.toFixed(4));
    };

    const calculateWeightedBorrowRate = (
      rate1: number,     // unidex rate
      rate2: number,     // gtrade rate
      weight1: number,   // unidex liquidity
      weight2: number    // gtrade liquidity
    ) => {
      const formattedRate1 = formatBorrowRate(rate1);
      const formattedRate2 = formatBorrowRate(rate2);
      
      // If both rates are 0, return 0
      if (formattedRate1 === 0 && formattedRate2 === 0) return 0;
      // If one rate is 0, use only the non-zero rate
      if (formattedRate1 === 0) return formattedRate2;
      if (formattedRate2 === 0) return formattedRate1;

      // Calculate total weight
      const totalWeight = weight1 + weight2;
      if (totalWeight === 0) return 0;

      // Calculate weighted average
      return ((formattedRate1 * weight1) + (formattedRate2 * weight2)) / totalWeight;
    };

    // If only UniDex data is available
    if (unidexMarketData && !gtradeMarket) {
      const totalOI = unidexMarketData.longOpenInterest + unidexMarketData.shortOpenInterest;
      const longPercentage = totalOI > 0 
        ? (unidexMarketData.longOpenInterest / totalOI) * 100 
        : 50;
      const shortPercentage = totalOI > 0 
        ? (unidexMarketData.shortOpenInterest / totalOI) * 100 
        : 50;
        
      return {
        longOpenInterest: unidexMarketData.longOpenInterest,
        shortOpenInterest: unidexMarketData.shortOpenInterest,
        maxLongOpenInterest: unidexMarketData.maxLongOpenInterest,
        maxShortOpenInterest: unidexMarketData.maxShortOpenInterest,
        longShortRatio: {
          longPercentage,
          shortPercentage,
        },
        borrowRateForLong: unidexMarketData.borrowRateForLong,
        borrowRateForShort: unidexMarketData.borrowRateForShort,
        fundingRate: unidexMarketData.fundingRate,
      };
    }

    // If only GTrade data is available
    if (!unidexMarketData && gtradeMarket) {
      const totalOI = gtradeMarket.openInterest.long + gtradeMarket.openInterest.short;
      const longPercentage = totalOI > 0 
        ? (gtradeMarket.openInterest.long / totalOI) * 100 
        : 50;
      const shortPercentage = totalOI > 0 
        ? (gtradeMarket.openInterest.short / totalOI) * 100 
        : 50;
        
      return {
        longOpenInterest: gtradeMarket.openInterest.long,
        shortOpenInterest: gtradeMarket.openInterest.short,
        maxLongOpenInterest: gtradeMarket.openInterest.max,
        maxShortOpenInterest: gtradeMarket.openInterest.max,
        longShortRatio: {
          longPercentage,
          shortPercentage,
        },
        borrowRateForLong: gtradeMarket.borrowingFees.borrowRateForLong,
        borrowRateForShort: gtradeMarket.borrowingFees.borrowRateForShort,
        fundingRate: 0, // GTrade might not have funding rate, defaulting to 0
      };
    }

    // Both data sources are available
    // At this point, both unidexMarketData and gtradeMarket are guaranteed to exist
    const unidexData = unidexMarketData!;
    const gtradeData = gtradeMarket!;
    
    const totalOI = unidexData.longOpenInterest + unidexData.shortOpenInterest + 
                     gtradeData.openInterest.long + gtradeData.openInterest.short;
    
    const longPercentage = totalOI > 0 
      ? ((unidexData.longOpenInterest + gtradeData.openInterest.long) / totalOI) * 100 
      : 50;
    
    const shortPercentage = totalOI > 0 
      ? ((unidexData.shortOpenInterest + gtradeData.openInterest.short) / totalOI) * 100 
      : 50;
      
    const avgBorrowRateLong = calculateWeightedBorrowRate(
      unidexData.borrowRateForLong,
      gtradeData.borrowingFees.borrowRateForLong,
      unidexData.maxLongOpenInterest - unidexData.longOpenInterest,
      gtradeData.openInterest.max - gtradeData.openInterest.long
    );

    const avgBorrowRateShort = calculateWeightedBorrowRate(
      unidexData.borrowRateForShort,
      gtradeData.borrowingFees.borrowRateForShort,
      unidexData.maxShortOpenInterest - unidexData.shortOpenInterest,
      gtradeData.openInterest.max - gtradeData.openInterest.short
    );

    return {
      longOpenInterest: unidexData.longOpenInterest + gtradeData.openInterest.long,
      shortOpenInterest: unidexData.shortOpenInterest + gtradeData.openInterest.short,
      maxLongOpenInterest: unidexData.maxLongOpenInterest + gtradeData.openInterest.max,
      maxShortOpenInterest: unidexData.maxShortOpenInterest + gtradeData.openInterest.max,
      longShortRatio: {
        longPercentage,
        shortPercentage,
      },
      borrowRateForLong: avgBorrowRateLong,
      borrowRateForShort: avgBorrowRateShort,
      fundingRate: unidexData.fundingRate,
    };
  }, [unidexMarketData, gtradeMarket]);

  const { absoluteChange, percentageChange, loading: changeLoading, error: changeError } = use24hChange(selectedPair);

  if (unidexError && gtradeError) {
    return (
      <div className="flex items-center justify-center p-4 text-short">
        Error loading market data: {unidexError?.message || gtradeError?.message}
      </div>
    );
  }

  if (unidexLoading && gtradeLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        Loading market data...
      </div>
    );
  }

  const getAnnualizedRate = (rate: number) => {
    switch (rateTimeframe) {
      case "1d":
        return rate * 24;
      case "1y":
        return rate * 24 * 365;
      default:
        return rate;
    }
  };

  const nextTimeframe = (): TimeframeRate => {
    switch (rateTimeframe) {
      case "1h":
        return "1d";
      case "1d":
        return "1y";
      case "1y":
        return "1h";
    }
  };

  return (
    <div className="w-full">
      <div className="p-2 my-2 border rounded-lg shadow-sm bg-[hsl(var(--component-background))] overflow-hidden">
        <div className="overflow-x-auto">
          <div className="flex items-center text-xs flex-nowrap" style={{ width: "fit-content", minWidth: '1200px' }}>
            {/* Price Group with Pair Selector */}
            <PairSelector selectedPair={selectedPair} onPairChange={onPairChange} />

            {/* 24h Change Group */}
            <div className="flex items-center px-4 border-r min-w-[160px]">
              <div>
                <div className="text-xs text-muted-foreground">24h Change</div>
                <div className={cn(
                  "text-sm font-medium",
                  (!changeLoading && !changeError && percentageChange >= 0) ? "text-[#22c55e]" : "text-[#ef4444]"
                )}>
                  {!changeLoading && !changeError ? (
                    <>
                      {absoluteChange >= 0 ? "+" : ""}
                      {formatPairPrice(selectedPair, Math.abs(absoluteChange))} /{" "}
                      {percentageChange >= 0 ? "+" : ""}
                      {percentageChange.toFixed(2)}%
                    </>
                  ) : (
                    "- / -"
                  )}
                </div>
              </div>
            </div>

            {/* Open Interest Group */}
            <div className="flex items-center space-x-8 px-4 border-r min-w-[300px]">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <div className="text-xs text-muted-foreground">Long OI</div>
                      <div className="text-sm">
                        ${formatCompactNumber(combinedData.longOpenInterest)} / $
                        {formatCompactNumber(combinedData.maxLongOpenInterest)}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="z-50 p-4 rounded-md shadow-lg border border-border/40 bg-[#17161d]/80 backdrop-blur-md">
                    <p className="mb-4 text-sm font-medium text-white">Open Interest Distribution</p>
                    {unidexMarketData && (
                      <ProgressBar 
                        value={unidexMarketData.longOpenInterest}
                        max={unidexMarketData.maxLongOpenInterest}
                        label="UniDex"
                      />
                    )}
                    {gtradeMarket && (
                      <ProgressBar 
                        value={gtradeMarket.openInterest.long}
                        max={gtradeMarket.openInterest.max}
                        label="GTrade"
                      />
                    )}
                    {combinedData && (
                      <div className="mt-2 text-xs text-muted-foreground/80">
                        There is <span className="text-white">${formatCompactNumber(combinedData.longOpenInterest)}</span> long positions <br /> open with <span className="text-white">${formatCompactNumber(combinedData.maxLongOpenInterest - combinedData.longOpenInterest)}</span> available.
                      </div>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <div className="text-xs text-muted-foreground">Short OI</div>
                      <div className="text-sm">
                        ${formatCompactNumber(combinedData.shortOpenInterest)} / $
                        {formatCompactNumber(combinedData.maxShortOpenInterest)}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="z-50 p-4 rounded-md shadow-lg border border-border/40 bg-[#17161d]/80 backdrop-blur-md">
                    <p className="mb-4 text-sm font-medium text-white">Open Interest Distribution</p>
                    {unidexMarketData && (
                      <ProgressBar 
                        value={unidexMarketData.shortOpenInterest}
                        max={unidexMarketData.maxShortOpenInterest}
                        label="UniDex"
                      />
                    )}
                    {gtradeMarket && (
                      <ProgressBar 
                        value={gtradeMarket.openInterest.short}
                        max={gtradeMarket.openInterest.max}
                        label="GTrade"
                      />
                    )}
                    {combinedData && (
                      <div className="mt-2 text-xs text-muted-foreground/80">
                        There is <span className="text-white">${formatCompactNumber(combinedData.shortOpenInterest)}</span> short positions <br /> open with <span className="text-white">${formatCompactNumber(combinedData.maxShortOpenInterest - combinedData.shortOpenInterest)}</span> available.
                      </div>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Funding Rate Group */}
            <div className="flex items-center px-4 border-r min-w-[160px]">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Funding Rate</span>
                        <button
                          onClick={() => setRateTimeframe(nextTimeframe())}
                          className="px-2 py-0.5 text-[10px] rounded bg-secondary hover:bg-secondary/80"
                        >
                          {rateTimeframe}
                        </button>
                      </div>
                      <div
                        className={cn(
                          "text-sm",
                          getAnnualizedRate(combinedData.fundingRate) >= 0
                            ? "text-long"
                            : "text-short"
                        )}
                      >
                        {getAnnualizedRate(combinedData.fundingRate).toFixed(4)}%
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="z-50 p-4 rounded-md shadow-lg border border-border/40 bg-[#17161d]/80 backdrop-blur-md">
                    <p className="text-xs text-white whitespace-pre-line">
                      {getAnnualizedRate(combinedData.fundingRate) >= 0 
                        ? <>
                            Long positions are paying a rate of {'\n'}<span className="text-short">{getAnnualizedRate(combinedData.fundingRate).toFixed(4)}%</span> to short positions every {rateTimeframe}.
                            {'\n\n'}
                            Short positions are being paid {'\n'}<span className="text-long">{getAnnualizedRate(combinedData.fundingRate).toFixed(4)}%</span> every {rateTimeframe} from longs.
                          </>
                        : <>
                            Short positions are paying a rate of {'\n'}<span className="text-short">{Math.abs(getAnnualizedRate(combinedData.fundingRate)).toFixed(4)}%</span> to long positions every {rateTimeframe}.
                            {'\n\n'}
                            Long positions are being paid {'\n'}<span className="text-long">{Math.abs(getAnnualizedRate(combinedData.fundingRate)).toFixed(4)}%</span> every {rateTimeframe} from shorts.
                          </>
                      }
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Borrow Rates Group */}
            <div className="flex items-center px-4 min-w-[220px]">
              <div className="flex gap-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <div className="text-xs text-muted-foreground">Borrowing (L)</div>
                        <div className="text-sm text-short">
                          {getAnnualizedRate(combinedData.borrowRateForLong).toFixed(4)}%
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="z-50 w-[300px] p-4 rounded-md shadow-lg border border-border/40 bg-[#17161d]/80 backdrop-blur-md">
                      <p className="mb-4 text-xs text-white">
                        Borrow rate is a fee paid to keep your position open, regardless of market direction.
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">UniDex:</span>
                          <span className="text-short">
                            {unidexMarketData ? getAnnualizedRate(unidexMarketData.borrowRateForLong).toFixed(4) : '0.0000'}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">GTrade:</span>
                          <span className="text-short">
                            {gtradeMarket ? getAnnualizedRate(gtradeMarket.borrowingFees.borrowRateForLong).toFixed(4) : '0.0000'}%
                          </span>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <div className="text-xs text-muted-foreground">Borrowing (S)</div>
                        <div className="text-sm text-short">
                          {getAnnualizedRate(combinedData.borrowRateForShort).toFixed(4)}%
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="z-50 w-[300px] p-4 rounded-md shadow-lg border border-border/40 bg-[#17161d]/80 backdrop-blur-md">
                      <p className="mb-4 text-xs text-white">
                        Borrow rate is a fee paid to keep your position open, regardless of market direction.
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">UniDex:</span>
                          <span className="text-short">
                            {unidexMarketData ? getAnnualizedRate(unidexMarketData.borrowRateForShort).toFixed(4) : '0.0000'}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">GTrade:</span>
                          <span className="text-short">
                            {gtradeMarket ? getAnnualizedRate(gtradeMarket.borrowingFees.borrowRateForShort).toFixed(4) : '0.0000'}%
                          </span>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PairHeader;
