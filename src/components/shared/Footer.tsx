import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useChainId } from 'wagmi';
import { Settings } from "lucide-react";
import { FavoritesTicker } from "./FavoritesTicker";
import { FooterSettings } from "./FooterSettings";
import { getLatestVersion } from "../features/changelog/changelog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function Footer() {
  const router = useRouter();
  const chainId = useChainId();
  const [buildId, setBuildId] = useState<string>('');
  const isMainPage = router.pathname === "/" || router.pathname === "/index";
  const [isPaused, setIsPaused] = useState(false);
  const [showPrice, setShowPrice] = useState(true);
  const [tickerDisplayMode, setTickerDisplayMode] = useState<'none' | 'all' | 'favorites'>('all');

  // Get the latest version from changelog
  const latestVersion = getLatestVersion();

  useEffect(() => {
    const metaBuildId = (document.querySelector('meta[name="build-id"]') as HTMLMetaElement)?.content;
    setBuildId(metaBuildId || 'development');
    
    // Load settings from localStorage
    const tickerSettings = localStorage.getItem("tickerSettings");
    if (tickerSettings) {
      const settings = JSON.parse(tickerSettings);
      setIsPaused(settings.isPaused || false);
      setShowPrice(settings.showPrice !== undefined ? settings.showPrice : true);
      const savedMode = settings.tickerDisplayMode;
      if (savedMode === 'none' || savedMode === 'all' || savedMode === 'favorites') {
        setTickerDisplayMode(savedMode);
      } else {
        setTickerDisplayMode('all'); 
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem("tickerSettings", JSON.stringify({ isPaused, showPrice, tickerDisplayMode }));
  }, [isPaused, showPrice, tickerDisplayMode]);

  const chainName = {
    42161: 'Arbitrum',
    10: 'Optimism',
    11155111: 'Sepolia',
    8453: 'Base',
    1: 'Ethereum',
  }[chainId] ?? 'Not Connected';

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between h-8 px-4 border-t bg-background border-border">
      <div className="flex items-center space-x-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded flex items-center">
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                Operational
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">All systems operational</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <Popover>
          <PopoverTrigger asChild>
            <button className="hidden sm:flex bg-muted/70 text-xs px-2 py-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors items-center gap-1.5">
              <Settings className="h-3 w-3 mr-0.5" />
              <span>Settings</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start" sideOffset={5}>
            <FooterSettings 
              isPaused={isPaused} 
              setIsPaused={setIsPaused}
              showPrice={showPrice}
              setShowPrice={setShowPrice}
              tickerDisplayMode={tickerDisplayMode}
              setTickerDisplayMode={setTickerDisplayMode}
            />
          </PopoverContent>
        </Popover>
        
        {isMainPage && (tickerDisplayMode === 'all' || tickerDisplayMode === 'favorites') && (
          <div className="hidden sm:block w-[650px] md:w-[800px] lg:w-[1000px] max-w-[calc(100vw-400px)] overflow-hidden mx-1">
            <FavoritesTicker 
              isPaused={isPaused}
              showPrice={showPrice}
              displayMode={tickerDisplayMode}
            />
          </div>
        )}
      </div>

      <div className="flex items-center space-x-3">
        <div className="hidden text-sm sm:block text-muted-foreground">
          {chainName}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <button 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={() => (window.location.href = "/changelog")}
              >
                v{latestVersion.version}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <p>Build: {buildId}</p>
                <p className="text-xs text-muted-foreground mt-1">Click to view changelog</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </footer>
  );
}
