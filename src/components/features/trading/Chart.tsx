import { useEffect, useRef } from "react";
import type { ResolutionString } from "../../../../public/static/charting_library/charting_library";
import datafeed from "../../../utils/datafeed.js";

declare global {
  interface Window {
    TradingView: any;
  }
}

const chartingLibraryPath = "/static/charting_library/";

// Calculate time ranges
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

interface ChartProps {
  selectedPair?: string;
  height: number;
  onHeightChange: (height: number) => void;
}

export function Chart({ selectedPair = "ETH/USD", height, onHeightChange }: ChartProps) {
  const widgetRef = useRef<any>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startHeight.current = height;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    
    const deltaY = e.clientY - startY.current;
    const newHeight = Math.max(300, Math.min(800, startHeight.current + deltaY));
    onHeightChange(newHeight);
    
    // Force the widget to recalculate its size
    if (widgetRef.current) {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 0);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Function to get the correct symbol format based on the pair
  const getFormattedSymbol = (pair: string) => {
    const prefix = SPECIAL_PAIRS[pair] || "Crypto";
    return `${prefix}.${pair}`;
  };

  useEffect(() => {
    const loadTradingView = async () => {
      try {
        if (typeof window === "undefined" || !window.TradingView) {
          console.log("TradingView not loaded yet");
          return;
        }

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
            intervals: [
              "1",
              "5",
              "15",
              "30",
              "60",
              "240",
              "1D",
            ] as ResolutionString[],
          },
          loading_screen: { backgroundColor: "#17161d" },
          visible_range: {
            from: now - 24 * 60 * 60,
            to: now,
          },
          auto_scale: true,
          initial_data: {
            resolution: "15" as ResolutionString,
            from: now - 24 * 60 * 60,
            to: now,
          },
        });

        widgetRef.current = widget;

        widget.onChartReady(() => {
          const chart = widget.chart();
          chart.getSeries().setChartStyleProperties(1, {
            upColor: "#3df57b",
            downColor: "#ea435c",
            borderUpColor: "#3df57b",
            borderDownColor: "#ea435c",
            wickUpColor: "#3df57b",
            wickDownColor: "#ea435c",
          });
        });
      } catch (error) {
        console.error("Error initializing TradingView:", error);
      }
    };

    loadTradingView();

    // Cleanup function
    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
          widgetRef.current = null;
        } catch (error) {
          console.error("Error cleaning up TradingView widget:", error);
        }
      }
    };
  }, [selectedPair]); // Re-initialize when selectedPair changes

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
    >
      <div
        id="tv_chart_container"
        className="w-full h-full"
        style={{ pointerEvents: 'auto' }}
      />
    </div>
  );
}
