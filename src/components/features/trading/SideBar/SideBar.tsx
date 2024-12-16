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
    <div className="relative hidden ml-2 md:block">
      <div className="flex h-full">
        {/* Expandable Content Panel */}
        {isExpanded && (
          <div className="relative h-full overflow-hidden border border-r-0 rounded-l-lg w-80 bg-card border-border">
            {activeMode === 'TRADE_STREAM' && (
              <TradeStream isExpanded={true} />
            )}
          </div>
        )}

        {/* Main Sidebar */}
        <div className={`
          flex flex-col justify-between w-12 h-full border bg-card border-border
          ${isExpanded ? 'rounded-r-lg' : 'rounded-lg'}
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
            className={`
              p-2 transition-colors hover:bg-accent
              ${isExpanded ? 'rounded-br-lg' : 'rounded-b-lg'}
            `}
          >
            {isExpanded ? (
              <ChevronRight className="w-4 h-4 mx-auto" />
            ) : (
              <ChevronLeft className="w-4 h-4 mx-auto" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}