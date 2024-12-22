import React, { useRef, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "../../../lib/utils";
import {
  TokenIcon,
  TokenPairDisplay,
  PrefetchTokenImages,
} from "../../../hooks/use-token-icon";
import { useMarketData } from "../../../hooks/use-market-data";
import { usePrices } from "../../../lib/websocket-price-context";
import { usePairPrecision } from "../../../hooks/use-pair-precision";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../ui/popover";
import { Button } from "../../ui/button";
import { ChevronDown } from "lucide-react";

interface PairSelectorProps {
  selectedPair: string;
  onPairChange: (value: string) => void;
}

export const PairSelector: React.FC<PairSelectorProps> = ({
  selectedPair,
  onPairChange,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { formatPairPrice } = usePairPrecision();
  const { marketData: unidexMarketData, allMarkets } = useMarketData({
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
    return formatPairPrice(pair, price);
  };

  const formatFundingRate = (rate: number) => {
    return `${rate.toFixed(4)}%`;
  };

  const handlePairSelect = (pair: string) => {
    onPairChange(pair);
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredMarkets.length > 0) {
      handlePairSelect(filteredMarkets[0].pair);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="flex min-w-[130px] pr-2 border-r">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="w-full h-full p-0 bg-transparent border-0 shadow-none cursor-pointer focus:ring-0 hover:bg-muted/60"
          >
            <div className="flex items-center px-4">
              <TokenIcon pair={selectedPair} size={28} className="mr-2" />
              <div className="flex flex-col">
                <div className="flex items-center gap-2 px-2 mb-1 text-xs text-muted-foreground">
                  <span>{selectedPair}</span>
                  <ChevronDown className="w-4 h-4" />
                </div>
                <div className="px-2 font-mono font-bold text-left text-sm min-w-[90px]">
                  {formatPairPrice(selectedPair, currentPrice)}
                </div>
              </div>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className={cn(
            "p-0 bg-[hsl(var(--component-background))] overflow-hidden",
            // Mobile styles
            "md:w-[900px] w-screen",
            "md:h-[500px] h-[100dvh]",
            "md:border md:rounded-md border-0 rounded-none",
            "md:left-auto left-0",
            "md:top-auto top-0"
          )}
          align="start"
          side="bottom"
          sideOffset={0}
        >
          <div className="flex flex-col h-full">
            <PrefetchTokenImages pairs={allMarkets.map((market) => market.pair)} />
            <div className="sticky top-0 z-20 bg-[hsl(var(--component-background))] shadow-sm">
              {/* Mobile-only header */}
              <div className="flex items-center justify-between p-4 border-b md:hidden">
                <div className="text-sm font-medium">Select Market</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </Button>
              </div>
              <div className="px-4 py-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search markets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="w-full py-2 pr-4 text-sm bg-transparent border rounded-md pl-9 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-ring"
                  />
                </div>
              </div>
              {/* Desktop columns */}
              <div className="hidden grid-cols-5 px-4 py-2 text-xs font-medium border-b md:grid text-muted-foreground bg-muted/30">
                <div className="w-[180px]">Market</div>
                <div className="w-[140px] text-right">Price</div>
                <div className="w-[140px] text-right">Long Liquidity</div>
                <div className="w-[140px] text-right">Short Liquidity</div>
                <div className="w-[140px] text-right">Funding Rate</div>
              </div>
              {/* Mobile columns */}
              <div className="grid grid-cols-3 px-4 py-2 text-xs font-medium border-b md:hidden text-muted-foreground bg-muted/30">
                <div>Market</div>
                <div className="text-right">Price</div>
                <div className="text-right">Funding Rate</div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredMarkets.map((market) => (
                <Button
                  key={market.pair}
                  variant="ghost"
                  className="w-full h-auto px-4 py-3 hover:bg-muted/60"
                  onClick={() => handlePairSelect(market.pair)}
                >
                  {/* Desktop layout */}
                  <div className="items-center hidden w-full grid-cols-5 text-xs md:grid">
                    <div className="w-[180px]">
                      <TokenPairDisplay pair={market.pair} />
                    </div>
                    <div className="w-[140px] text-right font-mono">
                      {formatPrice(market.pair)}
                    </div>
                    <div className="w-[140px] text-right">
                      ${formatNumber(market.availableLiquidity.long)}
                    </div>
                    <div className="w-[140px] text-right">
                      ${formatNumber(market.availableLiquidity.short)}
                    </div>
                    <div className="w-[140px] text-right">
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
                  {/* Mobile layout */}
                  <div className="grid w-full grid-cols-3 text-xs md:hidden">
                    <div className="flex items-center">
                      <TokenPairDisplay pair={market.pair} />
                    </div>
                    <div className="font-mono text-right">
                      {formatPrice(market.pair)}
                    </div>
                    <div className="text-right">
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
                </Button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default PairSelector; 