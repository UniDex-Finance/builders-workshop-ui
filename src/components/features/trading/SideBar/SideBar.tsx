// src/components/features/trading/SideBar/SideBar.tsx
import { useState } from 'react';
import { TradeStream } from './TradeStream';
import { ChevronLeft, ChevronRight, Nfc } from 'lucide-react';

const SIDEBAR_MODES = {
  TRADE_STREAM: 'TRADE_STREAM',
} as const;

type SidebarMode = keyof typeof SIDEBAR_MODES;

export function SideBar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeMode, setActiveMode] = useState<SidebarMode>('TRADE_STREAM');

  const handleModeClick = (mode: SidebarMode) => {
    if (activeMode === mode && isExpanded) {
      setIsExpanded(false);
    } else {
      setActiveMode(mode);
      setIsExpanded(true);
    }
  };

  return (
    <div className="relative hidden md:block h-full">
      <div className="flex h-full">
        {/* Main Sidebar - Now positioned on the left */}
        <div className={`
          flex flex-col justify-between w-12 h-full border-t border-b border-l border-r bg-card border-border
        `}>
          {/* Modes */}
          <button
            onClick={() => handleModeClick('TRADE_STREAM')}
            className={`
              p-2 transition-colors mt-2
              ${activeMode === 'TRADE_STREAM' && isExpanded 
                ? 'text-foreground' 
                : 'text-muted-foreground hover:text-foreground'
              }
            `}
          >
            <Nfc className="w-4 h-4 mx-auto" />
          </button>

          {/* Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 transition-colors hover:bg-accent"
          >
            {isExpanded ? (
              <ChevronLeft className="w-4 h-4 mx-auto" />
            ) : (
              <ChevronRight className="w-4 h-4 mx-auto" />
            )}
          </button>
        </div>

        {/* Expandable Content Panel - Now positioned to the right of the main sidebar */}
        {isExpanded && (
          <div className="relative h-full overflow-hidden border-t border-r border-b w-80 bg-card border-border">
            {activeMode === 'TRADE_STREAM' && (
              <TradeStream isExpanded={true} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}