import { useEffect, useRef, useMemo, useState } from "react";
import type { ResolutionString } from "../../../../public/static/charting_library/charting_library";
import datafeed from "../../../utils/datafeed.js";
import { Position } from "../../../hooks/use-positions";
import { useTheme } from "next-themes";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

// Add this function back before the Chart component
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

// Add this before the Chart component
const ChartSwitcher = ({ activeChart, onSwitch }: { activeChart: 'trading' | 'analytics', onSwitch: (type: 'trading' | 'analytics') => void }) => {
  return (
    <div className="absolute z-20 flex gap-1 top-3 left-3">
      <button
        onClick={() => onSwitch('trading')}
        className={`px-3 py-1 text-xs rounded-md transition-colors ${
          activeChart === 'trading'
            ? 'bg-primary/20 text-primary'
            : 'hover:bg-secondary/50 text-muted-foreground'
        }`}
      >
        Price
      </button>
      <button
        onClick={() => onSwitch('analytics')}
        className={`px-3 py-1 text-xs rounded-md transition-colors ${
          activeChart === 'analytics'
            ? 'bg-primary/20 text-primary'
            : 'hover:bg-secondary/50 text-muted-foreground'
        }`}
      >
        Funding History
      </button>
    </div>
  );
};

// Add this before the Chart component
const AnalyticsChart = () => {
  // Sample data - replace with your actual data
  const data = [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 },
    { name: 'May', value: 500 }
  ];

  return (
    <div className="w-full h-full p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#3df57b" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export function Chart({ selectedPair = "ETH/USD", height, onHeightChange, positions = [] }: ChartProps) {
  const widgetRef = useRef<any>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);
  const currentPositionIdsRef = useRef<Set<string>>(new Set());
  const isChartReadyRef = useRef(false);
  const { theme } = useTheme();
  const [activeChart, setActiveChart] = useState<'trading' | 'analytics'>('trading');

  // Memoize positions based on their IDs and entry prices only
  const positionKey = useMemo(() => {
    return positions
      .filter(position => position.market === selectedPair)
      .map(p => `${p.positionId}-${p.entryPrice}`)
      .join('|');
  }, [positions, selectedPair]);

  // Function to draw position lines
  const drawPositionLines = (chart: any) => {
    const relevantPositions = positions.filter(position => position.market === selectedPair);
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
      
      const shapeOptions = {
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
      };

      chart.createMultipointShape(
        [{ time: now, price: entryPrice }],
        shapeOptions
      );
    });

    // Update ref with current position IDs
    currentPositionIdsRef.current = newPositionIds;
  };

  // Effect for position lines
  useEffect(() => {
    if (!widgetRef.current || !isChartReadyRef.current) return;

    const widget = widgetRef.current;
    const chart = widget.chart();
    if (!chart) return;

    drawPositionLines(chart);
  }, [positionKey]);

  // Effect for theme changes - watch theme directly
  useEffect(() => {
    if (widgetRef.current) {
      // Force a complete cleanup and reload of the widget
      widgetRef.current.remove();
      widgetRef.current = null;
      isChartReadyRef.current = false;
      loadTradingView();
    }
  }, [theme]);

  // Main chart initialization effect
  const loadTradingView = async () => {
    try {
      if (typeof window === "undefined" || !window.TradingView) {
        console.log("TradingView not loaded yet");
        return;
      }

      // Remove old widget if it exists
      if (widgetRef.current) {
        widgetRef.current.remove();
        widgetRef.current = null;
        isChartReadyRef.current = false;
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
          "paneProperties.backgroundType": "solid",
          "paneProperties.legendProperties.showBackground": false,
          "paneProperties.horzGridProperties.style": 2,
          "paneProperties.vertGridProperties.style": 2,
          "paneProperties.background": theme === 'greenify' ? "#0c1012" : theme === 'light' ? "#ffffff" : theme === 'hotline' ? "#0f0c2c" : theme === 'oled' ? "#000000" : "#17161d",
          "scalesProperties.backgroundColor": theme === 'greenify' ? "#0c1012" : theme === 'light' ? "#ffffff" : theme === 'hotline' ? "#0f0c2c" : theme === 'oled' ? "#000000" : "#17161d",
        },
        load_last_chart: false,
        saved_data: null,
        auto_save_delay: 0,
        max_bars: 300,
        range: "1D",
        custom_css_url: `../${theme}.css`,
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
        loading_screen: { backgroundColor: "transparent" },
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
        
        // Draw position lines after chart is ready
        drawPositionLines(chart);
      });
    } catch (error) {
      console.error("Error initializing TradingView:", error);
    }
  };

  useEffect(() => {
    loadTradingView();

    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
          widgetRef.current = null;
          isChartReadyRef.current = false;
        } catch (error) {
          console.error("Error cleaning up TradingView widget:", error);
        }
      }
    };
  }, [selectedPair]);

  // Also restore the resize handlers
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
    if (widgetRef.current) {
      setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Add this effect to cleanup TradingView when switching charts
  useEffect(() => {
    if (activeChart === 'analytics' && widgetRef.current) {
      widgetRef.current.remove();
      widgetRef.current = null;
      isChartReadyRef.current = false;
    } else if (activeChart === 'trading' && !widgetRef.current) {
      loadTradingView();
    }
  }, [activeChart]);

  return (
    <div 
      className={`relative rounded-xl border border-border bg-[var(--deposit-card-background)]`}
      style={{ 
        height: `${height}px`,
        resize: 'vertical',
        overflow: 'hidden',
        paddingBottom: '16px',
        minHeight: '300px',
        maxHeight: '800px',
        cursor: 'ns-resize',
        zIndex: 10,
        position: 'relative'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="w-full h-12">
        <ChartSwitcher activeChart={activeChart} onSwitch={setActiveChart} />
      </div>
      
      <div className="w-full h-[calc(100%-48px)]">
        {activeChart === 'trading' ? (
          <div
            id="tv_chart_container"
            className="w-full h-full"
            style={{ pointerEvents: 'auto' }}
          />
        ) : (
          <div className="w-full h-full">
            <AnalyticsChart />
          </div>
        )}
      </div>
      
      <div 
        className="absolute bottom-0 left-0 right-0 h-4 cursor-ns-resize bg-[var(--deposit-card-background)]"
      />
    </div>
  );
}

// Helper function to compare sets
function areSetsEqual(a: Set<string>, b: Set<string>) {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}
