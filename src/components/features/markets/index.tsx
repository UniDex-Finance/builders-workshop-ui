'use client'

import { useState, useEffect, useMemo, useRef } from "react"
import { Star } from "lucide-react"
import { Header } from "../../shared/Header"
import { TokenIcon } from "../../../hooks/use-token-icon"
import { cn } from "../../../lib/utils"
import { useMarketData, getPairFullName } from "../../../hooks/use-market-data"
import { usePrices } from "../../../lib/websocket-price-context"
import { usePairPrecision } from "../../../hooks/use-pair-precision"
import { use24hChange } from "../../../hooks/use-24h-change"
import { MarketCategory, AVAILABLE_CATEGORIES, getPairsInCategory, getMarketCategory } from "../../../lib/market-categories"
import { Badge } from "../../ui/badge"
import { use24hStats } from "../../../hooks/use-24h-stats"
import { MarketPriceChange, MarketHighValue, MarketLowValue } from "./market-stats"

export function MarketsDashboard() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("favoriteMarkets");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory>("All");
  
  // Same hooks as PairSelector for consistency
  const { marketData, allMarkets } = useMarketData({});
  const { prices } = usePrices();
  const { formatPairPrice } = usePairPrecision();
  
  // Track 24h change data for each pair
  const changeDataRef = useRef(new Map<string, number>());
  
  // Determine loading state from allMarkets
  const isLoading = !allMarkets || allMarkets.length === 0;

  useEffect(() => {
    localStorage.setItem("favoriteMarkets", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (pair: string) => {
    setFavorites(prev => 
      prev.includes(pair)
        ? prev.filter(p => p !== pair)
        : [...prev, pair]
    );
  };

  // Helper to handle percentage change updates
  const handlePercentageChange = (pair: string, value: number) => {
    changeDataRef.current.set(pair, value);
  };

  // Filter markets based on category
  const filteredMarkets = useMemo(() => {
    if (isLoading) return [];
    
    return allMarkets.filter((market) => {
      const categoryPairs = getPairsInCategory(selectedCategory, allMarkets.map(m => m.pair), favorites);
      return categoryPairs.includes(market.pair);
    });
  }, [allMarkets, selectedCategory, favorites, isLoading]);

  // Group markets: favorites first, then others
  const favoritesMarkets = filteredMarkets.filter(market => favorites.includes(market.pair));
  const otherMarkets = filteredMarkets.filter(market => !favorites.includes(market.pair));
  const groupedMarkets = selectedCategory === "Favorites" 
    ? favoritesMarkets 
    : [...favoritesMarkets, ...otherMarkets];

  // Format market price with proper precision
  const getFormattedPrice = (pair: string) => {
    const basePair = pair.split('/')[0].toLowerCase();
    const price = prices[basePair]?.price;
    return formatPairPrice(pair, price);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <div className="container mx-auto p-4">
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 gap-4">
          {/* Top Row with Two Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Box */}
            <div className="border border-border rounded-lg p-6 min-h-[250px] bg-card">
              <h2 className="text-lg font-medium text-muted-foreground">Left Box</h2>
              <p className="text-muted-foreground">Content will go here</p>
            </div>
            
            {/* Right Box */}
            <div className="border border-border rounded-lg p-6 min-h-[250px] bg-card">
              <h2 className="text-lg font-medium text-muted-foreground">Right Box</h2>
              <p className="text-muted-foreground">Content will go here</p>
            </div>
          </div>
          
          {/* Markets Table Section with Category Navigation */}
          <div className="border border-border rounded-lg p-4 bg-card">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2 overflow-x-auto scrollbar-none">
                {AVAILABLE_CATEGORIES.filter(cat => cat !== "Favorites").map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      "px-2 py-1 text-sm rounded-md whitespace-nowrap border",
                      selectedCategory === category
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/40 text-muted-foreground border-muted/20 hover:bg-muted/20"
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--main-accent)]"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] border-collapse">
                  <thead>
                    <tr className="text-xs uppercase text-muted-foreground">
                      <th className="text-left py-2 px-2 font-medium">Market</th>
                      <th className="text-left py-2 px-2 font-medium">Name</th>
                      <th className="text-left py-2 px-2 font-medium">Category</th>
                      <th className="text-right py-2 px-2 font-medium">Price</th>
                      <th className="text-right py-2 px-2 font-medium">24h High</th>
                      <th className="text-right py-2 px-2 font-medium">24h Low</th>
                      <th className="text-right py-2 px-2 font-medium">24h Chg.</th>
                      <th className="text-center py-2 px-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="w-full">
                    {groupedMarkets.map((market, index) => {
                      const baseToken = market.pair.split('/')[0].toLowerCase();
                      const quoteToken = market.pair.split('/')[1];
                      const isPairFavorite = favorites.includes(market.pair);
                      
                      return (
                        <tr 
                          key={market.pair} 
                          className={cn(
                            "hover:bg-muted/50 text-xs w-full",
                            index % 2 === 0 ? "bg-background" : "bg-muted/10"
                          )}
                        >
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 relative">
                                <TokenIcon 
                                  pair={market.pair} 
                                  size={16} 
                                  className="rounded-full" 
                                  square={true}
                                />
                              </div>
                              <span className="font-medium">
                                {market.pair.split('/')[0]}
                                <span className="text-muted-foreground">
                                  /{market.pair.split('/')[1]}
                                </span>
                              </span>
                              <Badge 
                                variant="outline" 
                                className="bg-muted/40 text-xs font-normal border-muted/30"
                              >
                                10x
                              </Badge>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <span className="text-muted-foreground">{getPairFullName(market.pair)}</span>
                          </td>
                          <td className="py-3 px-2">
                            <span className="text-blue-400 hover:underline cursor-pointer"
                                  onClick={() => {
                                    const categories = getMarketCategory(market.pair);
                                    // Find first category that's not "All" or "Favorites"
                                    const firstSpecificCategory = categories.find(cat => cat !== "All" && cat !== "Favorites");
                                    if (firstSpecificCategory) {
                                      setSelectedCategory(firstSpecificCategory);
                                    }
                                  }}>
                              {(() => {
                                const categories = getMarketCategory(market.pair);
                                // Get the first specific category (not All or Favorites)
                                const firstSpecificCategory = categories.find(cat => cat !== "All" && cat !== "Favorites");
                                return firstSpecificCategory || "Crypto";
                              })()}
                            </span>
                          </td>
                          <td className="text-right py-3 px-2">
                            <div className="flex items-center justify-end gap-1">
                              <span className="font-medium">{getFormattedPrice(market.pair)}</span>
                              <span className="text-xs text-muted-foreground">{quoteToken}</span>
                            </div>
                          </td>
                          <td className="text-right py-3 px-2">
                            <MarketHighValue pair={market.pair} quoteToken={quoteToken} />
                          </td>
                          <td className="text-right py-3 px-2">
                            <MarketLowValue pair={market.pair} quoteToken={quoteToken} />
                          </td>
                          <td className="text-right py-3 px-2">
                            <MarketPriceChange 
                              pair={market.pair} 
                              onPercentageChange={(value) => handlePercentageChange(market.pair, value)} 
                            />
                          </td>
                          <td className="text-center py-3 px-2">
                            <button 
                              onClick={() => toggleFavorite(market.pair)} 
                              className="focus:outline-none"
                            >
                              <Star
                                className={cn(
                                  "w-4 h-4",
                                  isPairFavorite 
                                    ? "fill-yellow-400 text-yellow-400" 
                                    : "text-muted-foreground hover:text-yellow-400"
                                )}
                              />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 