import { Button } from "../../ui/button";
import { Table } from "../../ui/table";
import { usePositions, Position } from "../../../hooks/use-positions";
import { useOrders } from "../../../hooks/use-orders";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { usePositionActions } from "../../../hooks/trading-hooks/unidex-hooks/use-position-actions";
import { PositionsContent } from "./PositionTable/PositionsContent";
import { OrdersContent } from "./PositionTable/OrdersContent";
import { TradesContent } from "./PositionTable/TradesContent";
import { PnLTooltip } from "./PositionTable/PnLTooltip";
import { Chart } from "./Chart";
import { usePrices } from "../../../lib/websocket-price-context";

interface PositionsTableProps {
  address: string | undefined;
}

type ActiveTab = "positions" | "orders" | "trades";

export function PositionsTable({ address }: PositionsTableProps) {
  const {
    positions,
    loading: positionsLoading,
    error: positionsError,
  } = usePositions();
  const {
    orders,
    triggerOrders,
    detailedTriggers,
    loading: ordersLoading,
    loadingTriggers,
    error: ordersError,
    refetch,
    refetchTriggers
  } = useOrders();
  const { closePosition, closingPositions } = usePositionActions();
  const [activeTab, setActiveTab] = useState<ActiveTab>("positions");
  const [hoveredPosition, setHoveredPosition] = useState<string | null>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const cellRefs = useRef<{ [key: string]: HTMLTableCellElement | null }>({});
  const { prices } = usePrices();

  // Fetch trigger orders data when tab changes to orders
  useEffect(() => {
    if (activeTab === "orders") {
      refetch();
      refetchTriggers();
    }
  }, [activeTab, refetch, refetchTriggers]);

  useEffect(() => {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.zIndex = "9999";
    container.style.pointerEvents = "none";
    document.body.appendChild(container);
    setPortalContainer(container);

    return () => {
      document.body.removeChild(container);
    };
  }, []);

  const handleMouseEnter = (positionId: string) => {
    const cell = cellRefs.current[positionId];
    if (cell) {
      setHoveredPosition(positionId);
    }
  };

  const setRef = (positionId: string) => (el: HTMLTableCellElement | null) => {
    cellRefs.current[positionId] = el;
  };

  const handleClosePosition = (position: Position) => {
    // Safely parse the position size with a fallback to 0
    const positionSize = parseFloat(position.size || "0");
    if (isNaN(positionSize)) {
      console.error("Invalid position size:", position.size);
      return;
    }
    
    const basePair = position.market.split("/")[0].toLowerCase();
    const currentPrice = prices[basePair]?.price;
    
    // Add logging with better precision handling
    console.log('Closing position with details:', {
      pair: position.market,
      markPrice: {
        raw: currentPrice,
        scientific: currentPrice ? currentPrice.toExponential(8) : '0',
        fixed: currentPrice ? currentPrice.toFixed(10) : '0',
        fromPosition: position.markPrice, // Log original mark price for comparison
        priceObject: prices[basePair], // Log entire price object
        allPrices: prices // Log all available prices
      },
      size: positionSize,
      isLong: position.isLong,
      positionId: position.positionId
    });

    closePosition(
      position.positionId,
      position.isLong,
      currentPrice || 0,
      positionSize
    );
  };

  return (
    <div className="h-[calc(100vh-580px)] min-h-[300px]">
      <div className="w-full bg-[hsl(var(--component-background))] border-border h-full flex flex-col">
        <div className="flex items-center px-4 py-1 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("positions")}
            className={activeTab === "positions" ? "text-white px-0 mr-2" : "text-muted-foreground px-0 mr-2"}
          >
            Positions
          </Button>
          <span className="mx-1 text-muted-foreground/30">|</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("orders")}
            className={activeTab === "orders" ? "text-white px-0 mx-2" : "text-muted-foreground px-0 mx-2"}
          >
            Orders
          </Button>
          <span className="mx-1 text-muted-foreground/30">|</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("trades")}
            className={activeTab === "trades" ? "text-white px-0 ml-2" : "text-muted-foreground px-0 ml-2"}
          >
            History
          </Button>
        </div>
        <div className="w-full flex-1 overflow-y-auto scrollbar-custom">
          <div className="min-w-full md:min-w-[800px]">
            <Table>
              {activeTab === "positions" && (
                <PositionsContent
                  positions={positions}
                  triggerOrders={triggerOrders}
                  loading={positionsLoading}
                  error={positionsError}
                  closingPositions={closingPositions}
                  handleClosePosition={handleClosePosition}
                  setRef={setRef}
                  handleMouseEnter={handleMouseEnter}
                  setHoveredPosition={setHoveredPosition}
                />
              )}
              {activeTab === "orders" && (
                <OrdersContent
                  orders={orders}
                  triggerOrders={triggerOrders}
                  detailedTriggers={detailedTriggers}
                  loading={ordersLoading}
                  loadingTriggers={loadingTriggers}
                  error={ordersError}
                />
              )}
              {activeTab === "trades" && (
                <TradesContent />
              )}
            </Table>
          </div>
        </div>

        {portalContainer &&
          hoveredPosition &&
          createPortal(
            (() => {
              const cell = cellRefs.current[hoveredPosition];
              if (!cell) return null;

              const rect = cell.getBoundingClientRect();
              const position = positions.find(
                (p) => p.positionId === hoveredPosition
              );
              if (!position) return null;

              return <PnLTooltip position={position} rect={rect} />;
            })(),
            portalContainer
          )}
      </div>
    </div>
  );
}
