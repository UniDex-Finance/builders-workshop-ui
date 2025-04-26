import React, { useState, useEffect, useRef, useMemo } from "react";
import { usePrices } from "../../lib/websocket-price-context";
import { use24hChange } from "../../hooks/use-24h-change";
import { cn } from "../../lib/utils";

interface FavoritesTickerProps {
  isPaused: boolean;
  showPrice: boolean;
}

export function FavoritesTicker({ isPaused, showPrice }: FavoritesTickerProps) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const { prices } = usePrices();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("favoriteMarkets");
    setFavorites(saved ? JSON.parse(saved) : []);
  }, []);

  // Determine animation speed based on number of favorites
  const animationSpeed = useMemo(() => {
    if (favorites.length <= 3) return "fast";
    if (favorites.length >= 8) return "slow";
    return "normal";
  }, [favorites.length]);

  if (favorites.length === 0) {
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
        <div className="flex items-center">
          {favorites.map((pair, index) => renderTickerItem(pair, index, favorites.length))}
        </div>
      ) : (
        <div 
          className="w-full whitespace-nowrap group"
          style={{ animationPlayState: "running" }}
        >
          <div className={cn(
            "inline-flex items-center group-hover:[animation-play-state:paused]",
            animationSpeed === "slow" 
              ? "animate-ticker-slow" 
              : animationSpeed === "fast" 
                ? "animate-ticker-fast" 
                : "animate-ticker-normal"
          )}>
            {/* First set of items */}
            {favorites.map((pair, index) => renderTickerItem(pair, index, favorites.length))}
            
            {/* Duplicate items to create continuous effect - with a small divider at the end */}
            <div className="mx-6 h-3 w-px bg-border/80" />
            
            {/* Second set for continuous scrolling */}
            {favorites.map((pair, index) => 
              renderTickerItem(pair, index, favorites.length, true)
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