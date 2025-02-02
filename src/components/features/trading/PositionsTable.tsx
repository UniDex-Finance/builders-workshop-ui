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
    loading: ordersLoading,
    error: ordersError,
  } = useOrders();
  const { closePosition, closingPositions } = usePositionActions();
  const [activeTab, setActiveTab] = useState<ActiveTab>("positions");
  const [hoveredPosition, setHoveredPosition] = useState<string | null>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const cellRefs = useRef<{ [key: string]: HTMLTableCellElement | null }>({});
  const { prices } = usePrices();

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
    const positionSize = parseFloat(position.size);
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
    <div className="w-full mb-4 border rounded-lg bg-[hsl(var(--component-background))]">
      <div className="flex items-center p-2 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab("positions")}
          className={activeTab === "positions" ? "text-white" : "text-muted-foreground"}
        >
          Positions
        </Button>
        <span className="mx-1 text-muted-foreground/30">|</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab("orders")}
          className={activeTab === "orders" ? "text-white" : "text-muted-foreground"}
        >
          Orders
        </Button>
        <span className="mx-1 text-muted-foreground/30">|</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab("trades")}
          className={activeTab === "trades" ? "text-white" : "text-muted-foreground"}
        >
          History
        </Button>
      </div>
      <div className="w-full overflow-x-auto md:overflow-visible">
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
                loading={ordersLoading}
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
  );
}
