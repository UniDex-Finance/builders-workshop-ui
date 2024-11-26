import React, { useState } from "react";
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
import { Search } from "lucide-react";
import { cn } from "../../../lib/utils";
import {
  TokenIcon,
  TokenPairDisplay,
  PrefetchTokenImages,
} from "../../../hooks/use-token-icon";

interface PairHeaderProps {
  selectedPair: string;
  onPairChange: (value: string) => void;
}

type TimeframeRate = "1h" | "1d" | "1y";

export const PairHeader: React.FC<PairHeaderProps> = ({
  selectedPair,
  onPairChange,
}) => {
  const [rateTimeframe, setRateTimeframe] = useState<TimeframeRate>("1h");
  const [searchQuery, setSearchQuery] = React.useState("");
  const { marketData, allMarkets, loading, error } = useMarketData({
    selectedPair,
  });

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
    if (!price) return "...";
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 4,
      minimumFractionDigits: 4,
    }).format(price);
  };

  const formatFundingRate = (rate: number) => {
    return `${rate.toFixed(4)}%`;
  };

  if (error) {
    return (
      <div className="flex items-center justify-center p-4 text-red-500">
        Error loading market data: {error.message}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        Loading market data...
      </div>
    );
  }

  if (!marketData) {
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
          <div
            className="flex items-center text-sm flex-nowrap"
            style={{ width: "fit-content", minWidth: "1200px" }}
          >
            {/* Price Group with Pair Selector */}
            <div className="flex min-w-[130px] pr-2 border-r">
              <Select value={selectedPair} onValueChange={onPairChange}>
                <SelectTrigger className="w-full h-full p-0 bg-transparent border-0 shadow-none cursor-pointer focus:ring-0 hover:bg-muted/60">
                  <div className="flex items-center px-3">
                    {/* <TokenIcon pair={selectedPair} size={32} className="mr-2" /> */}
                    <div className="flex flex-col min-w-[100px]">
                      <div className="flex items-center gap-2 px-2 mb-1 text-muted-foreground">
                        <span>{selectedPair}</span>
                      </div>
                      <div className="px-2 font-mono font-bold text-left text-md ">
                        $
                        {currentPrice
                          ? currentPrice.toLocaleString()
                          : "Loading..."}
                      </div>
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent className="w-[900px] bg-[hsl(var(--component-background))] overflow-hidden p-0">
                  <div className="flex flex-col h-[500px]">
                    <PrefetchTokenImages
                      pairs={allMarkets.map((market) => market.pair)}
                    />
                    <div className="sticky top-0 z-20 bg-[hsl(var(--component-background))] shadow-sm">
                      <div className="px-4 py-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Search pairs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full py-2 pl-8 pr-4 text-sm bg-transparent border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-ring"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-5 px-4 py-2 text-sm font-medium border-b text-muted-foreground bg-muted/30">
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
                          <div className="grid items-center grid-cols-5 text-sm">
                            <div className="w-[180px]">
                              <TokenPairDisplay pair={market.pair} />
                            </div>
                            <div className="w-[140px]">
                              ${formatPrice(market.pair)}
                            </div>
                            <div className="w-[140px]">
                              ${formatNumber(market.availableLiquidity.long)}
                            </div>
                            <div className="w-[140px]">
                              ${formatNumber(market.availableLiquidity.short)}
                            </div>
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

            {/* Open Interest Group */}
            <div className="flex items-center space-x-8 px-4 border-r min-w-[300px]">
              <div>
                <div className="text-muted-foreground">Long OI</div>
                <div>
                  ${marketData.longOpenInterest.toLocaleString()} / $
                  {marketData.maxLongOpenInterest.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Short OI</div>
                <div>
                  ${marketData.shortOpenInterest.toLocaleString()} / $
                  {marketData.maxShortOpenInterest.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Long/Short Ratio Group */}
            <div className="flex items-center px-4 border-r min-w-[200px]">
              <div className="w-full">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-green-500">
                    <span className="text-muted-foreground">(L)</span>{" "}
                    {marketData.longShortRatio.longPercentage.toFixed(1)}%
                  </span>
                  <span className="text-red-500">
                    {marketData.longShortRatio.shortPercentage.toFixed(1)}%{" "}
                    <span className="text-muted-foreground">(S)</span>
                  </span>
                </div>
                <div className="w-full h-2 overflow-hidden rounded-full bg-red-500/20">
                  <div
                    className="h-full transition-all duration-300 ease-in-out rounded-l-full bg-green-500/50"
                    style={{
                      width: `${marketData.longShortRatio.longPercentage}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Borrow Rates Group */}
            <div className="flex items-center px-4 min-w-[220px]">
              <div className="flex gap-4">
                <div>
                  <div className="text-muted-foreground">Borrowing (L)</div>
                  <div className="text-red-500">
                    {getAnnualizedRate(marketData.borrowRateForLong).toFixed(4)}
                    %
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Borrowing (S)</div>
                  <div className="text-red-500">
                    {getAnnualizedRate(marketData.borrowRateForShort).toFixed(
                      4
                    )}
                    %
                  </div>
                </div>
              </div>
            </div>

            {/* Funding Rate Group */}
            <div className="flex items-center px-4 border-l min-w-[160px]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Funding Rate</span>
                  <button
                    onClick={() => setRateTimeframe(nextTimeframe())}
                    className="px-2 py-0.5 text-xs rounded bg-secondary hover:bg-secondary/80"
                  >
                    {rateTimeframe}
                  </button>
                </div>
                <div
                  className={
                    getAnnualizedRate(marketData.fundingRate) >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }
                >
                  {getAnnualizedRate(marketData.fundingRate).toFixed(4)}%
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
