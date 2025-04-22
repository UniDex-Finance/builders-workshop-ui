'use client'

import { useState, useEffect, useMemo, useRef } from "react"
import { Star, Maximize, Minimize, ChevronRight } from "lucide-react"
import { Header } from "../../shared/Header"
import { TokenIcon } from "../../../hooks/use-token-icon"
import { cn } from "../../../lib/utils"
import { useMarketData, getPairShortName } from "../../../hooks/use-market-data"
import { usePrices } from "../../../lib/websocket-price-context"
import { usePairPrecision } from "../../../hooks/use-pair-precision"
import { HeatmapCategory, HEATMAP_CATEGORIES, getHeatmapCategory } from "../../../lib/heatmap-categories"
import { Badge } from "../../ui/badge"
import { MarketPriceChange, MarketHighValue, MarketLowValue } from "./market-stats"
import { MiniPriceChart } from "./mini-price-chart"
import { IndexHeatmap } from "./IndexHeatmap"
import { CategoryPerformanceChart, categoryColors, defaultColor } from "./CategoryPerformanceChart"

// Helper function to format funding rate (similar to PairSelector)
const formatFundingRate = (rate: number) => {
  // Assuming rate is already a percentage, e.g., 0.01 for 1%
  // If rate is decimal (e.g., 0.0001), multiply by 100 first: (rate * 100).toFixed(4)
  // Based on PairSelector, it seems rate is already a percentage value like 0.01
  return `${rate.toFixed(4)}%`; 
};

// Define the type for the selected category state
type SelectedCategoryType = HeatmapCategory | "All" | "Favorites";

// Define scale factors for heatmap categories
const categoryScaleFactors: { [key: string]: number } = {
  "Layer 1": 100,
  "Indices": 80,
  "DeFi": 60,
  "Memes": 50,
  "Layer 2": 40,
  "Infra": 30,
  "Interop": 20,
  "NFT": 15,
  "Payments": 10,
  "Other": 5 // Default scale for others
};

export function MarketsDashboard() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("favoriteMarkets");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  
  // Use the new type for selectedCategory state
  const [selectedCategory, setSelectedCategory] = useState<SelectedCategoryType>("All");
  const [isHeatmapMaximized, setIsHeatmapMaximized] = useState(false); // State for maximizing heatmap
  const [isChartMaximized, setIsChartMaximized] = useState(false); // State for maximizing chart
  
  // --- State for Category Chart Legend ---
  const [chartCategories, setChartCategories] = useState<HeatmapCategory[]>([]);
  const [activeChartCategories, setActiveChartCategories] = useState<HeatmapCategory[]>([]);
  const [isLegendOverflowing, setIsLegendOverflowing] = useState(false);
  const chartLegendRef = useRef<HTMLDivElement>(null);
  // --- End State for Category Chart Legend ---
  
  // Same hooks as PairSelector for consistency
  const { marketData, allMarkets } = useMarketData({});
  const { prices } = usePrices();
  const { formatPairPrice } = usePairPrecision();
  
  // Track 24h change data for each pair
  const changeDataRef = useRef<Map<string, number>>(new Map());
  
  // Determine loading state from allMarkets
  const isLoading = !allMarkets || allMarkets.length === 0;

  // --- Handlers and Effects for Category Chart Legend ---
  const handleCategoriesDetermined = (categories: HeatmapCategory[]) => {
    // Called by the chart when it knows which categories it's plotting
    setChartCategories(categories);
    // REMOVED: setActiveChartCategories(categories); // Don't reset active state here
  };

  // Initialize active chart categories only when chartCategories are first set
  useEffect(() => {
    // Only set if chartCategories is populated and activeChartCategories is currently empty
    if (chartCategories.length > 0 && activeChartCategories.length === 0) {
      setActiveChartCategories(chartCategories);
    }
    // Intentionally not including activeChartCategories in dependency array
    // We only want this to run when chartCategories changes.
  }, [chartCategories]);

  const handleChartLegendClick = (categoryName: HeatmapCategory) => {
    setActiveChartCategories(prevActive => {
      const currentlyActive = prevActive.includes(categoryName);
      const nextActive = currentlyActive
        ? prevActive.filter(cat => cat !== categoryName)
        : [...prevActive, categoryName];
      return nextActive;
    });
  };

  useEffect(() => {
    // Check legend overflow whenever chartCategories change or window resizes
    const checkOverflow = () => {
      if (chartLegendRef.current) {
        const { scrollWidth, clientWidth } = chartLegendRef.current;
        setIsLegendOverflowing(scrollWidth > clientWidth);
      } else {
        setIsLegendOverflowing(false); // Reset if ref not available
      }
    };

    // Check initially and on resize
    checkOverflow();
    window.addEventListener('resize', checkOverflow);

    // Use MutationObserver if needed (optional, might be overkill now)
    // let observer: MutationObserver | null = null;
    // if (chartLegendRef.current) {
    //     observer = new MutationObserver(checkOverflow);
    //     observer.observe(chartLegendRef.current, { childList: true, subtree: true });
    // }

    return () => {
      window.removeEventListener('resize', checkOverflow);
      // if (observer) {
      //     observer.disconnect();
      // }
    };
  }, [chartCategories]); // Re-check when categories change
  // --- End Handlers and Effects ---

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
  const handlePercentageChange = (pair: string, value: number | null) => {
    // Ensure value is a number before setting, handle potential null/undefined
    if (typeof value === 'number' && !isNaN(value)) {
      changeDataRef.current.set(pair, value);
    } else {
        // Optionally handle cases where change is not available, e.g., remove or set to 0
        changeDataRef.current.delete(pair); 
    }
  };

  // Filter markets based on the NEW category logic
  const filteredMarkets = useMemo(() => {
    if (isLoading) return [];

    if (selectedCategory === "All") {
      return allMarkets;
    }
    if (selectedCategory === "Favorites") {
      return allMarkets.filter(market => favorites.includes(market.pair));
    }
    // Filter by specific HeatmapCategory
    return allMarkets.filter(market => getHeatmapCategory(market.pair) === selectedCategory);

  }, [allMarkets, selectedCategory, favorites, isLoading]);

  // Group markets: favorites first, then others (if not filtering by Favorites)
  const groupedMarkets = useMemo(() => {
    if (selectedCategory === "Favorites") {
      return filteredMarkets; // Already filtered for favorites
    }
    const favoritesMarkets = filteredMarkets.filter(market => favorites.includes(market.pair));
    const otherMarkets = filteredMarkets.filter(market => !favorites.includes(market.pair));
    return [...favoritesMarkets, ...otherMarkets];
  }, [filteredMarkets, favorites, selectedCategory]);

  // Calculate average performance for each NEW category (for the heatmap)
  const indexPerformance = useMemo(() => {
    if (isLoading || !allMarkets || allMarkets.length === 0) return {};

    const performance: { [category: string]: number } = {};
    // Use the new HEATMAP_CATEGORIES, excluding "Other"
    const categoriesToProcess = HEATMAP_CATEGORIES.filter(cat => cat !== "Other");

    categoriesToProcess.forEach(category => {
      // Find markets belonging to this category using the new function
      const marketsInCategory = allMarkets.filter(market => getHeatmapCategory(market.pair) === category);
      
      let totalChange = 0;
      let count = 0;

      marketsInCategory.forEach(market => {
        const change = changeDataRef.current.get(market.pair);
        if (typeof change === 'number' && !isNaN(change)) {
          totalChange += change;
          count++;
        }
      });
      
      // Ensure count is not zero to avoid division by zero
      performance[category] = count > 0 ? totalChange / count : 0; 
    });
    
    return performance;
  }, [isLoading, allMarkets]); // Depend only on market data loading state and content

  // Force update needed for heatmap based on ref changes (keep existing logic)
  const [_, setForceUpdate] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
        setForceUpdate(v => v + 1);
    }, 5000); // Re-calculate heatmap data every 5 seconds
    return () => clearInterval(interval);
  }, []);

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
          {/* Top Row with Two Boxes - Conditionally adjust grid columns */}
          <div className={cn(
            "grid grid-cols-1 md:grid-cols-2 gap-4",
            (isHeatmapMaximized || isChartMaximized) && "md:grid-cols-1" // Change grid layout when EITHER is maximized
          )}>
            {/* Left Box - NOW CONTAINS THE CATEGORY CHART */}
            <div className={cn(
              "border border-border rounded-lg p-4 bg-card flex flex-col relative", // Added relative for button
              isChartMaximized
                ? "md:col-span-1 h-[600px]" // Span full width and increase height when maximized
                : "h-[330px]", // Default height matching heatmap
              isHeatmapMaximized && "hidden" // Hide when heatmap is maximized
            )}>
              {/* Maximize/Minimize Button for Chart */}
              <button
                onClick={() => {
                  setIsChartMaximized(!isChartMaximized);
                  if (!isChartMaximized) setIsHeatmapMaximized(false); // Ensure heatmap is minimized if chart is maximized
                }}
                className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring z-10"
                aria-label={isChartMaximized ? "Minimize category chart" : "Maximize category chart"}
              >
                {isChartMaximized ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </button>
              <h2 className="text-sm font-medium text-muted-foreground mb-2 flex-shrink-0">Category Performance (24h Trend %)</h2>
              <div className="flex-grow relative h-[calc(100%-50px)] min-h-0"> {/* Added min-h-0 for flex child */}
                {/* Render the new chart component */}
                 <CategoryPerformanceChart
                   activeCategories={activeChartCategories} // Pass state down
                   onCategoriesDetermined={handleCategoriesDetermined} // Pass callback down
                 />
              </div>
              {/* External Legend container */}
              <div
                ref={chartLegendRef}
                className="relative w-full overflow-x-auto scrollbar-hide mt-2" // Added margin-top
                style={{
                  paddingRight: isLegendOverflowing ? '15px' : '0px',
                  height: '24px' // Give legend container a fixed height
                }}
              >
                <ul className="flex flex-nowrap gap-x-3 text-[10px]">
                  {chartCategories.map((category, index) => {
                    const isActive = activeChartCategories.includes(category);
                    // Use imported categoryColors and defaultColor
                    const color = categoryColors[category] || defaultColor;

                    return (
                      <li
                         key={`chart-legend-${index}-${category}`}
                         className={cn(
                           "flex items-center cursor-pointer whitespace-nowrap transition-opacity",
                           !isActive && "opacity-50 line-through"
                         )}
                         onClick={() => handleChartLegendClick(category)} // Use new handler
                       >
                        <span style={{ display: 'inline-block', marginRight: '4px', width: '10px', height: '10px', backgroundColor: color }}></span>
                        <span style={{ color: color }}>{category}</span>
                      </li>
                    );
                  })}
                </ul>
                {isLegendOverflowing && (
                  <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center pr-1 bg-gradient-to-l from-card via-card/80 to-transparent pointer-events-none">
                     {/* Use imported ChevronRight */}
                     <ChevronRight className="h-3 w-3 text-muted-foreground" />
                   </div>
                )}
              </div>
            </div>
            
            {/* Right Box - Now with Heatmap - Conditionally adjust size and span */}
            <div className={cn(
              "border border-border rounded-lg p-4 bg-card flex flex-col relative", // Added relative positioning for the button
              isHeatmapMaximized 
                ? "md:col-span-1 h-[600px]" // Span full width and increase height to 600px when maximized
                : "h-[330px]", // Default height // Match height of the left box
              isChartMaximized && "hidden" // Hide when chart is maximized
            )}>
              {/* Maximize/Minimize Button */}
              <button
                onClick={() => {
                  setIsHeatmapMaximized(!isHeatmapMaximized);
                  if (!isHeatmapMaximized) setIsChartMaximized(false); // Ensure chart is minimized if heatmap is maximized
                }}
                className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring z-10" // Positioned top-right
                aria-label={isHeatmapMaximized ? "Minimize heatmap" : "Maximize heatmap"}
              >
                {isHeatmapMaximized ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </button>
              <h2 className="text-sm font-medium text-muted-foreground mb-4 flex-shrink-0">Index Performance (24h Avg %)</h2>
              <div className="flex-grow relative h-full min-h-0"> {/* Added min-h-0 for flex child */}
                {isLoading ? (
                   <div className="absolute inset-0 flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--main-accent)]"></div>
                   </div>
                ) : (
                   <IndexHeatmap 
                     key={isHeatmapMaximized ? 'heatmap-max' : 'heatmap-min'}
                     indexPerformance={indexPerformance} 
                     categoryScaleFactors={categoryScaleFactors}
                   />
                )}
              </div>
            </div>
          </div>
          
          {/* Markets Table Section with Category Navigation */}
          <div className="border border-border rounded-lg p-4 bg-card">
            {/* Category Buttons */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2 overflow-x-auto scrollbar-none">
                {/* Always show "All" first */}
                <button
                    key="All"
                    onClick={() => setSelectedCategory("All")}
                    className={cn(
                      "px-2 py-1 text-sm rounded-md whitespace-nowrap border",
                      selectedCategory === "All"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/40 text-muted-foreground border-muted/20 hover:bg-muted/20"
                    )}
                  >
                    All
                  </button>
                {/* Then show "Favorites" if any exist */}
                {favorites.length > 0 && (
                   <button
                     key="Favorites"
                     onClick={() => setSelectedCategory("Favorites")}
                     className={cn(
                       "px-2 py-1 text-sm rounded-md whitespace-nowrap border flex items-center gap-1",
                       selectedCategory === "Favorites"
                         ? "bg-primary text-primary-foreground border-primary"
                         : "bg-muted/40 text-muted-foreground border-muted/20 hover:bg-muted/20"
                     )}
                   >
                     <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> Favorites
                   </button>
                )}
                {/* Map over the NEW HEATMAP_CATEGORIES */}
                {HEATMAP_CATEGORIES.filter(cat => cat !== "Other").map((category) => (
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
            
            {/* Markets Table */}
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--main-accent)]"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] border-collapse">
                  {/* Table Head */}
                  <thead>
                    <tr className="text-xs uppercase text-muted-foreground">
                      <th className="text-left py-2 px-2 font-medium">Market</th>
                      <th className="text-left py-2 px-2 font-medium">Name</th>
                      <th className="text-left py-2 px-2 font-medium">Category</th>
                      <th className="text-right py-2 px-2 font-medium">Price</th>
                      <th className="text-right py-2 px-2 font-medium">24h High</th>
                      <th className="text-right py-2 px-2 font-medium">24h Low</th>
                      <th className="text-right py-2 px-2 font-medium">24h Chg.</th>
                      <th className="text-right py-2 px-2 font-medium min-w-[100px]">24h Trend</th>
                      <th className="text-right py-2 px-2 font-medium">Funding Rate</th>
                      <th className="text-center py-2 px-2 w-8"></th>
                    </tr>
                  </thead>
                  {/* Table Body */}
                  <tbody className="w-full">
                    {groupedMarkets.map((market, index) => {
                      const baseToken = market.pair.split('/')[0].toLowerCase();
                      const quoteToken = market.pair.split('/')[1];
                      const isPairFavorite = favorites.includes(market.pair);
                      // Get category using the new function
                      const pairCategory = getHeatmapCategory(market.pair);
                      
                      return (
                        <tr 
                          key={market.pair} 
                          className={cn(
                            "hover:bg-muted/50 text-xs w-full",
                            index % 2 === 0 ? "bg-background" : "bg-muted/10"
                          )}
                        >
                          {/* Market Cell */}
                          <td className="px-2"> {/* Removed vertical padding */}
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
                                100x {/* Placeholder leverage */}
                              </Badge>
                            </div>
                          </td>
                          {/* Name Cell */}
                          <td className="px-2"> {/* Removed vertical padding */}
                            <span className="text-muted-foreground">{getPairShortName(market.pair)}</span>
                          </td>
                           {/* Category Cell - Use new category and update onClick */}
                          <td className="px-2"> {/* Removed vertical padding */}
                            <span className="text-blue-400 hover:underline cursor-pointer"
                                  onClick={() => {
                                    // Set selected category directly from the pair's category
                                    if (pairCategory !== "Other") { // Don't filter by "Other"
                                      setSelectedCategory(pairCategory);
                                    }
                                  }}>
                              {pairCategory} 
                            </span>
                          </td>
                          {/* Price Cell */}
                          <td className="text-right px-2"> {/* Removed vertical padding */}
                            <div className="flex items-center justify-end gap-1">
                              <span className="font-medium">{getFormattedPrice(market.pair)}</span>
                              <span className="text-xs text-muted-foreground">{quoteToken}</span>
                            </div>
                          </td>
                          {/* 24h High Cell */}
                          <td className="text-right px-2"> {/* Removed vertical padding */}
                            <MarketHighValue pair={market.pair} quoteToken={quoteToken} />
                          </td>
                          {/* 24h Low Cell */}
                          <td className="text-right px-2"> {/* Removed vertical padding */}
                            <MarketLowValue pair={market.pair} quoteToken={quoteToken} />
                          </td>
                          {/* 24h Change Cell */}
                          <td className="text-right px-2"> {/* Removed vertical padding */}
                            <MarketPriceChange 
                              pair={market.pair} 
                              onPercentageChange={(value) => handlePercentageChange(market.pair, value)} 
                            />
                          </td>
                           {/* 24h Trend Cell */}
                          <td className="text-right px-2"> {/* Removed vertical padding */}
                            <div className="flex justify-end h-8"> {/* Set fixed height */}
                              <MiniPriceChart pair={market.pair} />
                            </div>
                          </td>
                          {/* Funding Rate Cell */}
                          <td className="text-right px-2"> {/* Removed vertical padding */}
                             <span
                              className={cn(
                                "font-mono text-xs", // Added font-mono and adjusted size
                                market.fundingRate > 0
                                  ? "text-green-500" 
                                  : market.fundingRate < 0
                                  ? "text-red-500" 
                                  : "text-muted-foreground"
                              )}
                            >
                              {formatFundingRate(market.fundingRate)}
                            </span>
                          </td>
                          {/* Favorite Star Cell */}
                          <td className="text-center px-2"> {/* Removed vertical padding */}
                            <button 
                              onClick={() => toggleFavorite(market.pair)} 
                              className="focus:outline-none p-1 rounded-full hover:bg-muted" // Added padding and hover effect
                            >
                              <Star
                                className={cn(
                                  "w-4 h-4",
                                  isPairFavorite 
                                    ? "fill-yellow-400 text-yellow-400" 
                                    : "text-muted-foreground/60 hover:text-yellow-400" // Made non-favorite slightly dimmer
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