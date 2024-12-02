import { useEffect, useRef, useMemo, useCallback, memo } from "react";
import type { ResolutionString } from "../../../../public/static/charting_library/charting_library";
import datafeed from "../../../utils/datafeed.js";
import { Position } from "../../../hooks/use-positions";

declare global {
  interface Window {
    TradingView: any;
  }
}

const chartingLibraryPath = "/static/charting_library/";
const now = Math.floor(Date.now() / 1000);

// Define special pairs and their prefixes
const SPECIAL_PAIRS: Record<string, string> = {
  "EUR/USD": "FX",
  "GBP/USD": "FX",
  "XAU/USD": "Metal",
  "XAG/USD": "Metal",
  "QQQ/USD": "Equity.US",
  "SPY/USD": "Equity.US",
  "GMCI30/USD": "Crypto.Index",
  "GML2/USD": "Crypto.Index",
  "GMMEME/USD": "Crypto.Index",
};

const getFormattedSymbol = (pair: string) => {
  const prefix = SPECIAL_PAIRS[pair] || "Crypto";
  return `${prefix}.${pair}`;
};

interface ChartProps {
  selectedPair?: string;
  height: number;
  onHeightChange: (height: number) => void;
  positions?: Position[];
}

export const Chart = memo(function Chart({ 
  selectedPair = "ETH/USD", 
  height, 
  onHeightChange, 
  positions = [] 
}: ChartProps) {
  const widgetRef = useRef<any>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);
  const currentPositionIdsRef = useRef<Set<string>>(new Set());
  const isChartReadyRef = useRef(false);
  const currentSymbolRef = useRef<string>(selectedPair);

  // Memoize positions based on their IDs and entry prices only
  const relevantPositions = useMemo(() => {
    return positions.filter(position => position.market === selectedPair);
  }, [positions, selectedPair]);

  const positionKey = useMemo(() => {
    return relevantPositions
      .map(p => `${p.positionId}-${p.entryPrice}`)
      .join('|');
  }, [relevantPositions]);

  // Function to draw position lines
  const drawPositionLines = useCallback((chart: any) => {
    if (!chart || !positions) return;

    const newPositionIds = new Set(relevantPositions.map(p => p.positionId));
    
    // Only update if positions have changed
    if (areSetsEqual(currentPositionIdsRef.current, newPositionIds)) {
      return;
    }

    // Remove existing position lines
    const shapes = chart.getAllShapes();
    shapes.forEach((shape: any) => {
      if (shape.name?.includes('position-line')) {
        chart.removeEntity(shape);
      }
    });

    // Add new position lines
    relevantPositions.forEach(position => {
      const entryPrice = parseFloat(position.entryPrice);
      const color = position.isLong ? '#3df57b' : '#ea435c';
      const side = position.isLong ? 'LONG' : 'SHORT';
      const size = parseFloat(position.size).toFixed(2);
      
      try {
        chart.createMultipointShape(
          [{ time: now, price: entryPrice }],
          {
            shape: 'horizontal_line',
            overrides: {
              showPrice: false,
              linecolor: color,
              linestyle: 0,
              linewidth: 1,
              showLabel: true,
              textcolor: color,
              horzLabelsAlign: 'right',
              vertLabelsAlign: 'middle',
              bold: true,
              fontsize: 12,
              text: `${side} ${size}`,
            },
            ownerStudyId: null,
            zOrder: 'top',
            lock: true,
            name: `position-line-${position.positionId}`
          }
        );
      } catch (error) {
        console.error('Error drawing position line:', error);
      }
    });

    // Update ref with current position IDs
    currentPositionIdsRef.current = newPositionIds;
  }, [relevantPositions]);

  // Effect for position lines
  useEffect(() => {
    if (!widgetRef.current || !isChartReadyRef.current) return;

    const widget = widgetRef.current;
    const chart = widget.chart();
    if (!chart) return;

    try {
      drawPositionLines(chart);
    } catch (error) {
      console.error('Error in position lines effect:', error);
    }
  }, [drawPositionLines]);

  // Main chart initialization effect
  useEffect(() => {
    const loadTradingView = async () => {
      try {
        if (typeof window === "undefined" || !window.TradingView) {
          console.log("TradingView not loaded yet");
          return;
        }

        // Only create new widget if it doesn't exist
        if (!widgetRef.current) {
          console.log("Creating TradingView widget");
          const widget = new window.TradingView.widget({
            container: "tv_chart_container",
            locale: "en",
            library_path: chartingLibraryPath,
            datafeed: datafeed,
            symbol: getFormattedSymbol(selectedPair),
            interval: "15" as ResolutionString,
            autosize: true,
            debug: true,
            enabled_features: [
              "show_exchange_logos",
              "side_toolbar_in_fullscreen_mode",
              "header_in_fullscreen_mode",
              "hide_resolution_in_legend",
              "items_favoriting",
              "save_chart_properties_to_local_storage",
              "iframe_loading_compatibility_mode",
            ],
            disabled_features: [
              "volume_force_overlay",
              "create_volume_indicator_by_default",
              "header_compare",
              "display_market_status",
              "show_interval_dialog_on_key_press",
              "header_symbol_search",
              "popup_hints",
              "header_in_fullscreen_mode",
              "use_localstorage_for_settings",
              "right_bar_stays_on_scroll",
              "symbol_info",
              "timeframes_toolbar",
            ],
            theme: "dark",
            overrides: {
              "paneProperties.background": "#17161d",
              "scalesProperties.bgColor": "#17161d",
              "paneProperties.backgroundType": "solid",
              "paneProperties.legendProperties.showBackground": false,
              "paneProperties.horzGridProperties.style": 2,
              "paneProperties.vertGridProperties.style": 2,
            },
            load_last_chart: false,
            saved_data: null,
            auto_save_delay: 0,
            max_bars: 300,
            range: "1D",
            custom_css_url: "../custom.css",
            allow_symbol_change: false,
            favorites: {
              intervals: ["1", "5", "15", "30", "60", "240", "1D"] as ResolutionString[],
            },
            loading_screen: { backgroundColor: "#17161d" },
            visible_range: {
              from: now - 24 * 60 * 60,
              to: now,
            },
            auto_scale: true,
          });

          widgetRef.current = widget;

          widget.onChartReady(() => {
            isChartReadyRef.current = true;
            const chart = widget.chart();
            chart.getSeries().setChartStyleProperties(1, {
              upColor: "#3df57b",
              downColor: "#ea435c",
              borderUpColor: "#3df57b",
              borderDownColor: "#ea435c",
              wickUpColor: "#3df57b",
              wickDownColor: "#ea435c",
            });
            
            drawPositionLines(chart);
          });
        } else if (selectedPair !== currentSymbolRef.current) {
          // If widget exists but symbol changed, just change the symbol
          console.log("Changing symbol to:", getFormattedSymbol(selectedPair));
          const widget = widgetRef.current;
          if (widget && widget.chart()) {
            await widget.chart().setSymbol(
              getFormattedSymbol(selectedPair),
              "15" as ResolutionString
            );
            currentSymbolRef.current = selectedPair;
          }
        }
      } catch (error) {
        console.error("Error initializing/updating TradingView:", error);
      }
    };

    loadTradingView();

    // Cleanup function
    return () => {
      // Only remove the widget when component unmounts
      if (widgetRef.current && !document.getElementById("tv_chart_container")) {
        try {
          widgetRef.current.remove();
          widgetRef.current = null;
          isChartReadyRef.current = false;
        } catch (error) {
          console.error("Error cleaning up TradingView widget:", error);
        }
      }
    };
  }, [selectedPair, drawPositionLines]);

  // Memoize handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startHeight.current = height;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [height]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    const deltaY = e.clientY - startY.current;
    const newHeight = Math.max(300, Math.min(800, startHeight.current + deltaY));
    onHeightChange(newHeight);
    if (widgetRef.current) {
      setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
    }
  }, [onHeightChange]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  return (
    <div 
      className="relative rounded-xl"
      style={{ 
        height: `${height}px`,
        resize: 'vertical',
        overflow: 'auto',
        border: '1px solid rgba(107, 114, 128, 0.3)',
        paddingBottom: '16px',
        backgroundColor: '#17161d',
        minHeight: '300px',
        maxHeight: '800px',
        cursor: 'ns-resize',
        zIndex: 10,
        position: 'relative'
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        id="tv_chart_container"
        className="w-full h-full"
        style={{ pointerEvents: 'auto' }}
      />
    </div>
  );
});

// Add display name for debugging
Chart.displayName = 'Chart';

// Helper function to compare sets
function areSetsEqual(a: Set<string>, b: Set<string>) {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}
