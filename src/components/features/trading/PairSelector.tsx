import React, { useRef, useState, useEffect, useMemo } from "react";
import { Search, Star, ArrowUpDown } from "lucide-react";
import { cn } from "../../../lib/utils";
import { TokenIcon } from "../../../hooks/use-token-icon";
import { useMarketData } from "../../../hooks/use-market-data";
import { usePrices } from "../../../lib/websocket-price-context";
import { usePairPrecision } from "../../../hooks/use-pair-precision";
import { use24hChange } from "../../../hooks/use-24h-change";
import { MarketCategory, AVAILABLE_CATEGORIES, getPairsInCategory } from "../../../lib/market-categories";
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

interface MarketRowProps {
  market: {
    pair: string;
    availableLiquidity: {
      long: number;
      short: number;
    };
    fundingRate: number;
  };
  isFavorite: boolean;
  onToggleFavorite: (pair: string) => void;
  onPercentageChange?: (value: number) => void;
}

const MarketRow: React.FC<MarketRowProps> = ({ market, isFavorite, onToggleFavorite, onPercentageChange }) => {
  const { formatPairPrice } = usePairPrecision();
  const { prices } = usePrices();
  const { percentageChange, error } = use24hChange(market.pair);

  React.useEffect(() => {
    if (onPercentageChange && !error) {
      onPercentageChange(percentageChange);
    }
  }, [percentageChange, error, onPercentageChange]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(market.pair);
  };

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

  return (
    <>
      {/* Desktop layout */}
      <div className="items-center hidden w-full grid-cols-6 text-xs font-normal md:grid">
        <div className="w-[80px] flex items-center gap-1">
          <button
            onClick={handleFavoriteClick}
            className="p-0.5 hover:bg-muted/60 rounded-sm"
          >
            <Star
              className={cn(
                "h-3.5 w-3.5",
                isFavorite
                  ? "fill-[var(--main-accent)] stroke-[var(--main-accent)]"
                  : "text-muted-foreground hover:text-[var(--main-accent)]"
              )}
            />
          </button>
          <div className="flex items-center gap-1">
            <span>{market.pair}</span>
            <span className="px-1 py-1 text-[11px] leading-none font-medium rounded bg-[var(--foreground-accent)] text-[var(--text-accent)]">
              100x
            </span>
          </div>
        </div>
        <div className="w-[100px] text-right font-mono">
          {formatPrice(market.pair)}
        </div>
        <div className="w-[100px] text-right">
          {!error ? (
            <span className={cn(
              percentageChange >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"
            )}>
              {percentageChange >= 0 ? "+" : ""}
               {percentageChange.toFixed(2)}%
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
        <div className="w-[120px] text-right">
          ${formatNumber(market.availableLiquidity.long)}
        </div>
        <div className="w-[120px] text-right">
          ${formatNumber(market.availableLiquidity.short)}
        </div>
        <div className="w-[120px] text-right">
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
      <div className="grid w-full grid-cols-4 text-xs font-normal md:hidden">
        <div className="flex items-center gap-1">
          <button
            onClick={handleFavoriteClick}
            className="p-0.5 hover:bg-muted/60 rounded-sm"
          >
            <Star
              className={cn(
                "h-3.5 w-3.5",
                isFavorite
                  ? "fill-[var(--main-accent)] stroke-[var(--main-accent)]"
                  : "text-muted-foreground hover:text-[var(--main-accent)]"
              )}
            />
          </button>
          <div className="flex items-center gap-1">
            <span>{market.pair}</span>
            <span className="px-1.5 py-0.5 text-[11px] leading-none font-medium rounded bg-[var(--foreground-accent)] text-[var(--text-accent)]">
              100x
            </span>
          </div>
        </div>
        <div className="font-mono text-right">
          {formatPrice(market.pair)}
        </div>
        <div className="text-right">
          {!error ? (
            <span className={cn(
              percentageChange >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"
            )}>
              {percentageChange >= 0 ? "+" : ""}
               {percentageChange.toFixed(2)}%
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
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
    </>
  );
};

type SortField = "24hChange" | "fundingRate" | null;
type SortDirection = "asc" | "desc";

export const PairSelector: React.FC<PairSelectorProps> = ({
  selectedPair,
  onPairChange,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory>("All");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("favoriteMarkets");
    return saved ? JSON.parse(saved) : [];
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { formatPairPrice } = usePairPrecision();
  const { marketData: unidexMarketData, allMarkets } = useMarketData({
    selectedPair,
  });
  const { prices } = usePrices();

  const basePair = selectedPair.split("/")[0].toLowerCase();
  const currentPrice = prices[basePair]?.price;

  useEffect(() => {
    localStorage.setItem("favoriteMarkets", JSON.stringify(favorites));
  }, [favorites]);

  const handleToggleFavorite = (pair: string) => {
    setFavorites(prev => 
      prev.includes(pair)
        ? prev.filter(p => p !== pair)
        : [...prev, pair]
    );
  };

  const filteredMarkets = useMemo(() => {
    return allMarkets.filter((market) => {
      const matchesSearch = market.pair.toLowerCase().includes(searchQuery.toLowerCase());
      const categoryPairs = getPairsInCategory(selectedCategory, allMarkets.map(m => m.pair), favorites);
      return matchesSearch && categoryPairs.includes(market.pair);
    });
  }, [allMarkets, searchQuery, selectedCategory, favorites]);

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const changeRef = useRef(new Map<string, number>());

  const handlePercentageChange = (pair: string) => (value: number) => {
    changeRef.current.set(pair, value);
  };

  const sortedMarkets = useMemo(() => {
    if (!sortField) return filteredMarkets;

    return [...filteredMarkets].sort((a, b) => {
      if (sortField === "24hChange") {
        const changeA = changeRef.current.get(a.pair) || 0;
        const changeB = changeRef.current.get(b.pair) || 0;
        const diff = changeA - changeB;
        return sortDirection === "asc" ? diff : -diff;
      }

      if (sortField === "fundingRate") {
        const diff = a.fundingRate - b.fundingRate;
        return sortDirection === "asc" ? diff : -diff;
      }

      return 0;
    });
  }, [filteredMarkets, sortField, sortDirection]);

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
            "md:w-[800px] w-screen",
            "md:h-[500px] h-[100dvh]",
            "md:border md:rounded-md border-0 rounded-none",
            "md:left-0 left-0",
            "md:top-2 top-0"
          )}
          align="start"
          side="bottom"
          sideOffset={8}
          alignOffset={-8}
        >
          <div className="flex flex-col h-full">
            <div className="sticky top-0 z-20 bg-[hsl(var(--component-background))] shadow-sm">
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
              <div className="px-3 py-2.5">
                <div className="relative">
                  <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search markets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="w-full py-1.5 pr-3 text-xs bg-transparent border rounded-md pl-8 focus:outline-none focus:ring-1 focus:ring-[var(--main-accent)] text-muted-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <div className="flex gap-1.5 px-3 py-2 overflow-x-auto scrollbar-none">
                {AVAILABLE_CATEGORIES.map((category) => (
                  <Button
                    key={category}
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      "h-6 px-2 text-xs font-medium shrink-0",
                      selectedCategory === category
                        ? "text-[var(--main-accent)] hover:text-[var(--main-accent)]"
                        : "text-muted-foreground hover:text-[var(--main-accent)]"
                    )}
                  >
                    {category}
                  </Button>
                ))}
              </div>
              <div className="pt-2">
                {/* Desktop columns */}
                <div className="hidden grid-cols-6 px-3 py-1.5 text-xs font-medium md:grid text-muted-foreground">
                  <div className="w-[80px]">Market</div>
                  <div className="w-[100px] text-right">Oracle Price</div>
                  <div 
                    className="w-[100px] text-right flex items-center justify-end gap-1 cursor-pointer group"
                    onClick={() => handleSort("24hChange")}
                  >
                    24h Change
                    <ArrowUpDown className={cn(
                      "h-3 w-3 transition-colors",
                      sortField === "24hChange" ? "text-[var(--main-accent)]" : "text-muted-foreground group-hover:text-[var(--main-accent)]",
                      sortField === "24hChange" && sortDirection === "asc" && "rotate-180"
                    )} />
                  </div>
                  <div className="w-[120px] text-right">Long Liquidity</div>
                  <div className="w-[120px] text-right">Short Liquidity</div>
                  <div 
                    className="w-[120px] text-right flex items-center justify-end gap-1 cursor-pointer group"
                    onClick={() => handleSort("fundingRate")}
                  >
                    Funding Rate
                    <ArrowUpDown className={cn(
                      "h-3 w-3 transition-colors",
                      sortField === "fundingRate" ? "text-[var(--main-accent)]" : "text-muted-foreground group-hover:text-[var(--main-accent)]",
                      sortField === "fundingRate" && sortDirection === "asc" && "rotate-180"
                    )} />
                  </div>
                </div>
                {/* Mobile columns */}
                <div className="grid grid-cols-4 px-4 py-2 text-xs font-medium md:hidden text-muted-foreground">
                  <div>Market</div>
                  <div className="text-right">Oracle Price</div>
                  <div 
                    className="flex items-center justify-end gap-1 text-right cursor-pointer group"
                    onClick={() => handleSort("24hChange")}
                  >
                    24h Change
                    <ArrowUpDown className={cn(
                      "h-3 w-3 transition-colors",
                      sortField === "24hChange" ? "text-[var(--main-accent)]" : "text-muted-foreground group-hover:text-[var(--main-accent)]",
                      sortField === "24hChange" && sortDirection === "asc" && "rotate-180"
                    )} />
                  </div>
                  <div 
                    className="flex items-center justify-end gap-1 text-right cursor-pointer group"
                    onClick={() => handleSort("fundingRate")}
                  >
                    Funding Rate
                    <ArrowUpDown className={cn(
                      "h-3 w-3 transition-colors",
                      sortField === "fundingRate" ? "text-[var(--main-accent)]" : "text-muted-foreground group-hover:text-[var(--main-accent)]",
                      sortField === "fundingRate" && sortDirection === "asc" && "rotate-180"
                    )} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-custom">
              {sortedMarkets.map((market) => (
                <Button
                  key={market.pair}
                  variant="ghost"
                  className="w-full h-auto px-2 py-2 hover:bg-muted/60"
                  onClick={() => handlePairSelect(market.pair)}
                >
                  <MarketRow
                    market={market}
                    isFavorite={favorites.includes(market.pair)}
                    onToggleFavorite={handleToggleFavorite}
                    onPercentageChange={handlePercentageChange(market.pair)}
                  />
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