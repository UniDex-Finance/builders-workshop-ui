import React, { useState, useEffect, useRef, useMemo } from "react";
import { usePrices } from "../../lib/websocket-price-context";
import { use24hChange } from "../../hooks/use-24h-change";
import { useMarketData } from "../../hooks/use-market-data";
import { cn } from "../../lib/utils";

interface FavoritesTickerProps {
  isPaused: boolean;
  showPrice: boolean;
  displayMode: 'all' | 'favorites';
}

export function FavoritesTicker({ isPaused, showPrice, displayMode }: FavoritesTickerProps) {
  const [favoritePairs, setFavoritePairs] = useState<string[]>([]);
  const { prices } = usePrices();
  const { allMarkets } = useMarketData({});
  const containerRef = useRef<HTMLDivElement>(null);
  const tickerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  
  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("favoriteMarkets");
    setFavoritePairs(saved ? JSON.parse(saved) : []);
  }, []);

  // Determine which pairs to display based on the displayMode prop
  const displayedPairs = useMemo(() => {
    const allPairNames = allMarkets.map(market => market.pair);
    // Check if displayMode is 'favorites'
    if (displayMode === 'favorites') { 
      // Filter favoritePairs to ensure they still exist in allMarkets (optional, good practice)
      return favoritePairs.filter(favPair => allPairNames.includes(favPair));
    }
    // Otherwise (displayMode is 'all'), return all pairs
    return allPairNames; 
  }, [displayMode, favoritePairs, allMarkets]); // Depend on displayMode

  // Measure content width after render
  useEffect(() => {
    if (tickerRef.current) {
      setContentWidth(tickerRef.current.scrollWidth / 2); // Divide by 2 as we have duplicated content
    }
  }, [displayedPairs]);

  // Animation with fixed pixel rate
  useEffect(() => {
    if (isPaused || !tickerRef.current || contentWidth === 0) return;
    
    let animationFrameId: number;
    let lastTimestamp: number;
    
    // Fixed speed: 5 pixels per second (super slow)
    const pixelsPerSecond = 20;
    
    const animate = (timestamp: number) => {
      if (!lastTimestamp) {
        lastTimestamp = timestamp;
      }
      
      const elapsed = timestamp - lastTimestamp;
      const pixelsToMove = (elapsed / 1000) * pixelsPerSecond;
      
      // Update position
      setPosition(prev => {
        const newPosition = prev - pixelsToMove;
        
        // Reset only after we've scrolled through all content (first set)
        if (Math.abs(newPosition) >= contentWidth) {
          return 0;
        }
        
        return newPosition;
      });
      
      lastTimestamp = timestamp;
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPaused, contentWidth]);

  // Don't render if no pairs are available to display
  if (displayedPairs.length === 0) {
    return null;
  }

  // Render a single ticker item
  const renderTickerItem = (pair: string, index: number, total: number, isDuplicate = false) => (
    <React.Fragment key={isDuplicate ? `dup-${pair}` : pair}>
      <div className="flex items-center gap-2 text-xs hover:bg-accent/30 px-2 py-1 rounded cursor-pointer transition-colors">
        <span className="font-semibold">{pair.split('-dup')[0]}</span>
        {showPrice && (
          <span className="font-mono">${formatPrice(prices[pair.split('/')[0].toLowerCase()]?.price)}</span>
        )}
        <PercentageChange pair={pair.split('-dup')[0]} />
      </div>
      {index < total - 1 && (
        <div className="mx-3 h-3 w-px bg-border/80" />
      )}
    </React.Fragment>
  );
  
  const formatPrice = (price: number | undefined) => {
    if (!price) return "...";
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div className="relative overflow-hidden w-full h-full flex items-center" ref={containerRef}>
      {isPaused ? (
        // Display static list when paused
        <div className="flex items-center">
          {displayedPairs.map((pair, index) => renderTickerItem(pair, index, displayedPairs.length))}
        </div>
      ) : (
        // Display scrolling list with constant pixel speed
        <div className="w-full overflow-hidden whitespace-nowrap">
          <div 
            ref={tickerRef}
            className="inline-flex items-center"
            style={{ 
              transform: `translateX(${position}px)`,
              transition: 'transform 0.1s linear'
            }}
          >
            {/* First set of items */}
            {displayedPairs.map((pair, index) => 
              renderTickerItem(pair, index, displayedPairs.length)
            )}
            
            {/* Spacer */}
            <div className="mx-16 h-3 w-px bg-border/80" />
            
            {/* Duplicate set for continuous scrolling */}
            {displayedPairs.map((pair, index) =>
              renderTickerItem(pair, index, displayedPairs.length, true)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PercentageChange({ pair }: { pair: string }) {
  const { percentageChange, error } = use24hChange(pair);
  
  if (error) {
    return <span className="text-muted-foreground">-</span>;
  }
  
  return (
    <span className={cn(
      "font-medium",
      percentageChange >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"
    )}>
      {percentageChange >= 0 ? "+" : ""}
      {percentageChange.toFixed(2)}%
    </span>
  );
}