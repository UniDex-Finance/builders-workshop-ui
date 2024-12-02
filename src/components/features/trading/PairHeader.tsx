import React, { useState, useMemo } from "react";
import { useMarketData } from "../../../hooks/use-market-data";
import { usePrices } from "../../../lib/websocket-price-context";
import { ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";
import { Search } from "lucide-react";
import { cn } from "../../../lib/utils";
import {
  TokenIcon,
  TokenPairDisplay,
  PrefetchTokenImages,
} from "../../../hooks/use-token-icon";
import { useGTradeMarketData } from "../../../hooks/use-gtrade-market-data";
import { usePairPrecision } from "../../../hooks/use-pair-precision";
import { use24hChange } from "../../../hooks/use-24h-change";

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

export const PairHeader: React.FC<PairHeaderProps> = ({
  selectedPair,
  onPairChange,
}) => {
  const [rateTimeframe, setRateTimeframe] = useState<TimeframeRate>("1h");
  const [searchQuery, setSearchQuery] = React.useState("");
  const { formatPairPrice } = usePairPrecision();
  
  const { marketData: unidexMarketData, allMarkets, loading: unidexLoading, error: unidexError } = useMarketData({
    selectedPair,
  });
  const { markets: gtradeMarkets, loading: gtradeLoading, error: gtradeError } = useGTradeMarketData();

  const gtradeMarket = gtradeMarkets.find(m => m.name === selectedPair);

  const combinedData = useMemo(() => {
    if (!unidexMarketData || !gtradeMarket) return null;

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

    const avgBorrowRateLong = calculateWeightedBorrowRate(
      unidexMarketData.borrowRateForLong,
      gtradeMarket.borrowingFees.borrowRateForLong,
      unidexMarketData.maxLongOpenInterest - unidexMarketData.longOpenInterest,
      gtradeMarket.openInterest.max - gtradeMarket.openInterest.long
    );

    const avgBorrowRateShort = calculateWeightedBorrowRate(
      unidexMarketData.borrowRateForShort,
      gtradeMarket.borrowingFees.borrowRateForShort,
      unidexMarketData.maxShortOpenInterest - unidexMarketData.shortOpenInterest,
      gtradeMarket.openInterest.max - gtradeMarket.openInterest.short
    );

    return {
      longOpenInterest: unidexMarketData.longOpenInterest + gtradeMarket.openInterest.long,
      shortOpenInterest: unidexMarketData.shortOpenInterest + gtradeMarket.openInterest.short,
      maxLongOpenInterest: unidexMarketData.maxLongOpenInterest + gtradeMarket.openInterest.max,
      maxShortOpenInterest: unidexMarketData.maxShortOpenInterest + gtradeMarket.openInterest.max,
      longShortRatio: {
        longPercentage: ((unidexMarketData.longOpenInterest + gtradeMarket.openInterest.long) / 
          (unidexMarketData.longOpenInterest + unidexMarketData.shortOpenInterest + 
           gtradeMarket.openInterest.long + gtradeMarket.openInterest.short)) * 100,
        shortPercentage: ((unidexMarketData.shortOpenInterest + gtradeMarket.openInterest.short) / 
          (unidexMarketData.longOpenInterest + unidexMarketData.shortOpenInterest + 
           gtradeMarket.openInterest.long + gtradeMarket.openInterest.short)) * 100,
      },
      borrowRateForLong: avgBorrowRateLong,
      borrowRateForShort: avgBorrowRateShort,
      fundingRate: unidexMarketData.fundingRate,
    };
  }, [unidexMarketData, gtradeMarket]);

  const { prices } = usePrices();
  const basePair = selectedPair.split("/")[0].toLowerCase();
  const currentPrice = prices[basePair]?.price;

  const filteredMarkets = allMarkets.filter((market) =>
    market.pair.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatPrice = (pair: string) => {
    const basePair = pair.split("/")[0].toLowerCase();
    const price = prices[basePair]?.price;
    return formatPairPrice(pair, price);
  };

  const formatFundingRate = (rate: number) => {
    return `${rate.toFixed(4)}%`;
  };

  const { absoluteChange, percentageChange, loading: changeLoading, error: changeError } = use24hChange(selectedPair);

  if (unidexError || gtradeError) {
    return (
      <div className="flex items-center justify-center p-4 text-red-500">
        Error loading market data: {unidexError?.message || gtradeError?.message}
      </div>
    );
  }

  if (unidexLoading || gtradeLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        Loading market data...
      </div>
    );
  }

  if (!combinedData) {
    return (
      <div className="flex items-center justify-center p-4">
        No market data available for {selectedPair}
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
            <div className="flex min-w-[130px] pr-2 border-r">
              <Select value={selectedPair} onValueChange={onPairChange}>
                <SelectTrigger className="w-full h-full p-0 bg-transparent border-0 shadow-none cursor-pointer focus:ring-0 hover:bg-muted/60">
                  <div className="flex items-center px-4">
                    <TokenIcon pair={selectedPair} size={28} className="mr-2" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 px-2 mb-1 text-xs text-muted-foreground">
                        <span>{selectedPair}</span>
                      </div>
                      <div className="px-2 font-mono font-bold text-left text-sm min-w-[90px]">
                        {formatPairPrice(selectedPair, currentPrice)}
                      </div>
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent 
                  className="w-[900px] bg-[hsl(var(--component-background))] overflow-hidden p-0"
                >
                  <div className="flex flex-col h-[500px]">
                    <PrefetchTokenImages pairs={allMarkets.map((market) => market.pair)} />
                    <div className="sticky top-0 z-20 bg-[hsl(var(--component-background))] shadow-sm">
                      <div className="px-4 py-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Search pairs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full py-2 pl-8 pr-4 text-xs bg-transparent border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-ring"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-5 px-4 py-2 text-xs font-medium border-b text-muted-foreground bg-muted/30">
                        <div className="w-[180px]">Pair</div>
                        <div className="w-[140px]">Market Price</div>
                        <div className="w-[140px]">Long Liquidity</div>
                        <div className="w-[140px]">Short Liquidity</div>
                        <div className="w-[140px]">Funding Rate</div>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {filteredMarkets.map((market) => (
                        <SelectItem
                          key={market.pair}
                          value={market.pair}
                          className="px-4 py-2 cursor-pointer hover:bg-muted/60"
                        >
                          <div className="grid items-center grid-cols-5 text-xs">
                            <div className="w-[180px]">
                              <TokenPairDisplay pair={market.pair} />
                            </div>
                            <div className="w-[140px]">{formatPrice(market.pair)}</div>
                            <div className="w-[140px]">${formatNumber(market.availableLiquidity.long)}</div>
                            <div className="w-[140px]">${formatNumber(market.availableLiquidity.short)}</div>
                            <div className="w-[140px]">
                              <span
                                className={cn(
                                  market.fundingRate > 0
                                    ? "text-[#22c55e]"
                                    : market.fundingRate < 0
                                    ? "text-[#ef4444]"
                                    : "text-foreground"
                                )}
                              >
                                {formatFundingRate(market.fundingRate)}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  </div>
                </SelectContent>
              </Select>
            </div>

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
                  <TooltipContent className="bg-[#2b2b36] border-none">
                    <p className="text-sm text-white">
                      There are currently ${formatCompactNumber(combinedData.longOpenInterest)} worth of {selectedPair} positions open with only ${formatCompactNumber(combinedData.maxLongOpenInterest - combinedData.longOpenInterest)} left before the open interest cap is reached
                    </p>
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
                  <TooltipContent className="bg-[#2b2b36] border-none">
                    <p className="text-sm text-white">
                      There are currently ${formatCompactNumber(combinedData.shortOpenInterest)} worth of {selectedPair} positions open with only ${formatCompactNumber(combinedData.maxShortOpenInterest - combinedData.shortOpenInterest)} left before the open interest cap is reached
                    </p>
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
                            ? "text-green-500"
                            : "text-red-500"
                        )}
                      >
                        {getAnnualizedRate(combinedData.fundingRate).toFixed(4)}%
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#2b2b36] border-none">
                    <p className="text-sm text-white whitespace-pre-line">
                      {getAnnualizedRate(combinedData.fundingRate) >= 0 
                        ? `Long positions are paying a rate of ${getAnnualizedRate(combinedData.fundingRate).toFixed(4)}% to short positions every ${rateTimeframe}.\n\nTherefore, short positions are being paid a rate of ${getAnnualizedRate(combinedData.fundingRate).toFixed(4)}% every ${rateTimeframe}.`
                        : `Short positions are paying a rate of ${Math.abs(getAnnualizedRate(combinedData.fundingRate)).toFixed(4)}% to long positions every ${rateTimeframe}.\n\nTherefore, long positions are being paid a rate of ${Math.abs(getAnnualizedRate(combinedData.fundingRate)).toFixed(4)}% every ${rateTimeframe}.`
                      }
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Borrow Rates Group */}
            <div className="flex items-center px-4 min-w-[220px]">
              <div className="flex gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Borrowing (L)</div>
                  <div className="text-sm text-red-500">
                    {getAnnualizedRate(combinedData.borrowRateForLong).toFixed(4)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Borrowing (S)</div>
                  <div className="text-sm text-red-500">
                    {getAnnualizedRate(combinedData.borrowRateForShort).toFixed(4)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PairHeader;
