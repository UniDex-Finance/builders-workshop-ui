// src/components/features/trading/SideBar/SideBar.tsx
import { useState } from 'react';
import { TradeStream } from './TradeStream';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SIDEBAR_MODES = {
  TRADE_STREAM: 'TRADE_STREAM',
} as const;

type SidebarMode = keyof typeof SIDEBAR_MODES;

export function SideBar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeMode, setActiveMode] = useState<SidebarMode>('TRADE_STREAM');

  const toggleSidebar = () => setIsExpanded(!isExpanded);

  return (
    <div className="relative hidden md:block">
      <div
        className={`
          h-full bg-card border-l border-border
          transition-all duration-300 ease-in-out
          ${isExpanded ? 'w-80' : 'w-12'}
        `}
      >
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute p-1 transition-colors transform -translate-y-1/2 border rounded-full -left-3 top-1/2 bg-card border-border hover:bg-accent"
        >
          {isExpanded ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Content */}
        <div className="flex flex-col h-full">
          {/* Mode Selector */}
          <div className="p-2 border-b border-border">
            {isExpanded ? (
              <div className="flex items-center justify-center">
                <button
                  className={`px-4 py-2 rounded-md ${
                    activeMode === 'TRADE_STREAM'
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => setActiveMode('TRADE_STREAM')}
                >
                  Trade Stream
                </button>
              </div>
            ) : (
              <div className="flex justify-center">
                <span className="text-xs">TS</span>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {activeMode === 'TRADE_STREAM' && (
              <TradeStream isExpanded={isExpanded} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}