import { Position } from "../../../../hooks/use-positions";
import { TriggerOrder, DetailedTriggerInfo } from "../../../../hooks/use-orders";
import { Button } from "../../../ui/button";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../ui/table";
import { usePrices } from "../../../../lib/websocket-price-context";
import { useState } from "react";
import { PositionDialog } from "./PositionDialog";
import { PositionSLTPDialog } from "./PositionSLTPDialog";
import { PositionCollateralDialog } from "./PositionCollateralDialog";
import { PositionSizeDialog } from "./PositionSizeDialog";
import * as HoverCard from '@radix-ui/react-hover-card';
import { TokenIcon } from "../../../../hooks/use-token-icon";
import { usePairPrecision } from '@/hooks/use-pair-precision';

// Trigger status enum definition
enum TriggerStatus {
  NONE = 0,
  PENDING = 1,
  OPEN = 2,
  TRIGGERED = 3,
  CANCELLED = 4
}

// Combined type for handling both TriggerOrders and detailed trigger information
type TriggerOrderWithStatus = TriggerOrder | {
  orderId: number;
  isTP: boolean;
  price: number;
  amountPercent: string;
  status: number;
  createdAt: string;
};

interface PositionsContentProps {
  positions: Position[];
  triggerOrders?: TriggerOrder[];
  detailedTriggers?: DetailedTriggerInfo[];
  loading: boolean;
  error: Error | null;
  closingPositions: { [key: string]: boolean };
  handleClosePosition: (position: Position) => void;
  setRef: (positionId: string) => (el: HTMLTableCellElement | null) => void;
  handleMouseEnter: (positionId: string) => void;
  setHoveredPosition: (positionId: string | null) => void;
}

export function PositionsContent({
  positions,
  triggerOrders = [],
  detailedTriggers = [],
  loading,
  error,
  closingPositions,
  handleClosePosition,
  setRef,
  handleMouseEnter,
  setHoveredPosition,
}: PositionsContentProps) {
  const { prices } = usePrices();
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSLTPDialogOpen, setIsSLTPDialogOpen] = useState(false);
  const [selectedSLTPPosition, setSelectedSLTPPosition] = useState<Position | null>(null);
  const [isCollateralDialogOpen, setIsCollateralDialogOpen] = useState(false);
  const [selectedCollateralPosition, setSelectedCollateralPosition] = useState<Position | null>(null);
  const [isSizeDialogOpen, setIsSizeDialogOpen] = useState(false);
  const { formatPairPrice } = usePairPrecision();

  const formatNumber = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US').format(numValue);
  };

  const calculateFinalPnl = (position: Position) => {
    if (!position.pnl) return "0.00";
    
    const pnlValue = parseFloat(position.pnl.replace(/[^0-9.-]/g, ""));
    return isNaN(pnlValue) ? "0.00" : pnlValue.toFixed(2);
  };

  const formatPnL = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return numValue >= 0
      ? `$${formatNumber(numValue.toFixed(2))}`
      : `-$${formatNumber(Math.abs(numValue).toFixed(2))}`;
  };

  const calculatePnLPercentage = (pnl: number, margin: string) => {
    if (!margin) return "0.00";
    
    const marginValue = parseFloat(margin.replace(/[^0-9.-]/g, ""));
    if (isNaN(marginValue) || marginValue === 0) return "0.00";
    
    return ((pnl / marginValue) * 100).toFixed(2);
  };

  const calculateLeverage = (size: string, margin: string) => {
    if (!size || !margin) return "0.0";
    
    const sizeValue = parseFloat(size.replace(/[^0-9.-]/g, ""));
    const marginValue = parseFloat(margin.replace(/[^0-9.-]/g, ""));
    
    if (isNaN(sizeValue) || isNaN(marginValue) || marginValue === 0) return "0.0";
    
    return (sizeValue / marginValue).toFixed(1);
  };

  const handleRowClick = (position: Position) => {
    setSelectedPosition(position);
    setIsDialogOpen(true);
  };

  const handleSLTPClick = (position: Position, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSLTPPosition(position);
    setIsSLTPDialogOpen(true);
  };

  const handleOpenSLTP = () => {
    if (selectedPosition) {
      setSelectedSLTPPosition(selectedPosition);
      setIsSLTPDialogOpen(true);
    }
  };

  const handleOpenCollateral = () => {
    if (selectedPosition) {
      setSelectedCollateralPosition(selectedPosition);
      setIsCollateralDialogOpen(true);
    }
  };

  const handleSizeClick = (position: Position, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPosition(position);
    setIsSizeDialogOpen(true);
  };

  const handleCollateralClick = (position: Position, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCollateralPosition(position);
    setIsCollateralDialogOpen(true);
  };

  // Helper function to get active trigger orders for a position
  const getActiveTriggerOrdersForPosition = (positionId: string): TriggerOrderWithStatus[] => {
    // First try to get from detailed triggers which has status information
    const positionDetailedTriggers = detailedTriggers.find(t => t.positionId === positionId);
    
    if (positionDetailedTriggers) {
      // Filter only OPEN triggers
      return positionDetailedTriggers.triggers
        .filter(t => t.status === TriggerStatus.OPEN)
        .map(t => ({...t}));
    }

    // For legacy trigger orders (no status field), we need to find corresponding detailed triggers
    // to check if they're open or not
    const legacyTriggerOrders = triggerOrders.filter(t => t.positionId === positionId);
    
    // If we have both legacy trigger orders and detailed trigger information, 
    // we should filter out the canceled/triggered orders from the legacy list
    if (legacyTriggerOrders.length > 0 && detailedTriggers.length > 0) {
      // Look through all detailed triggers to find any that match this position
      const allDetailedTriggers = detailedTriggers.flatMap(dt => 
        dt.positionId === positionId 
          ? dt.triggers.filter(t => t.status === TriggerStatus.OPEN)
          : []
      );
      
      // If we found detailed triggers info, only return those that are OPEN
      if (allDetailedTriggers.length > 0) {
        return allDetailedTriggers;
      }
    }
    
    // Fallback: return legacy trigger orders if we couldn't find detailed status info
    return legacyTriggerOrders;
  };

  return (
    <>
      <TableHeader className="hidden md:table-header-group">
        <TableRow>
          <TableHead>Pair</TableHead>
          <TableHead>
            <HoverCard.Root openDelay={0} closeDelay={0}>
              <HoverCard.Trigger asChild>
                <span className="border-b border-dashed border-muted-foreground/50 cursor-help">
                  Size
                </span>
              </HoverCard.Trigger>
              <HoverCard.Portal>
                <HoverCard.Content
                  side="top"
                  align="center"
                  sideOffset={5}
                  className="z-50 w-64 p-3 rounded-md shadow-lg border border-border/40 bg-[var(--position-cards-background)]/80 backdrop-blur-md text-[13px]"
                >
                  <div className="space-y-2">
                    <p>The top value represents the USD value of the position's exposure to the pair.</p>
                    <p>While the bottom value represents the notional size in the pairs units based on the entry price.</p>
                  </div>
                  <HoverCard.Arrow className="fill-[var(--position-cards-background)]/80" />
                </HoverCard.Content>
              </HoverCard.Portal>
            </HoverCard.Root>
          </TableHead>
          <TableHead>Margin</TableHead>
          <TableHead>Entry Price</TableHead>
          <TableHead>
            <HoverCard.Root openDelay={0} closeDelay={0}>
              <HoverCard.Trigger asChild>
                <span className="border-b border-dashed border-muted-foreground/50 cursor-help">
                  Market/Liq. Price
                </span>
              </HoverCard.Trigger>
              <HoverCard.Portal>
                <HoverCard.Content
                  side="top"
                  align="center"
                  sideOffset={5}
                  className="z-50 w-64 p-3 rounded-md shadow-lg border border-border/40 bg-[var(--position-cards-background)]/80 backdrop-blur-md text-[13px]"
                >
                  <div className="space-y-2">
                    <p>The top value represents the current reported oracle price for this pair.</p>
                    <p>While the bottom value shows the current latest liquidation price for the position.</p>
                  </div>
                  <HoverCard.Arrow className="fill-[var(--position-cards-background)]/80" />
                </HoverCard.Content>
              </HoverCard.Portal>
            </HoverCard.Root>
          </TableHead>
          <TableHead>SL/TP</TableHead>
          <TableHead>
            <HoverCard.Root openDelay={0} closeDelay={0}>
              <HoverCard.Trigger asChild>
                <span className="border-b border-dashed border-muted-foreground/50 cursor-help">
                  uPnL
                </span>
              </HoverCard.Trigger>
              <HoverCard.Portal>
                <HoverCard.Content
                  side="top"
                  align="center"
                  sideOffset={5}
                  className="z-50 w-64 p-3 rounded-md shadow-lg border border-border/40 bg-[var(--position-cards-background)]/80 backdrop-blur-md text-[13px]"
                >
                  <div className="space-y-2">
                    <p>This value shows the current unrealized profit and loss after accounting for trade fees, funding fees, and borrow fees assume the aggregated dex has them</p>
                  </div>
                  <HoverCard.Arrow className="fill-[var(--position-cards-background)]/80" />
                </HoverCard.Content>
              </HoverCard.Portal>
            </HoverCard.Root>
          </TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center">
              Loading positions...
            </TableCell>
          </TableRow>
        ) : error ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center text-short">
              {error.message}
            </TableCell>
          </TableRow>
        ) : positions.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center">
              No open positions
            </TableCell>
          </TableRow>
        ) : (
          positions.map((position) => {
            const finalPnl = calculateFinalPnl(position);
            const pnlValue = parseFloat(finalPnl);
            const leverage = calculateLeverage(position.size, position.margin);
            const pnlPercentage = calculatePnLPercentage(pnlValue, position.margin);
            const basePair = position.market.split("/")[0].toLowerCase();
            const currentPrice = prices[basePair]?.price;
            
            // Get active trigger orders for this position
            const activeTriggerOrders = getActiveTriggerOrdersForPosition(position.positionId);
            
            // Get the first stop loss and take profit orders if they exist
            const stopLossOrders = activeTriggerOrders.filter(o => {
              if ('isTP' in o) {
                return o.isTP === false;
              } else if ('stopLoss' in o && 'takeProfit' in o) {
                return o.stopLoss && !o.takeProfit;
              }
              return false;
            });
            
            const takeProfitOrders = activeTriggerOrders.filter(o => {
              if ('isTP' in o) {
                return o.isTP === true;
              } else if ('stopLoss' in o && 'takeProfit' in o) {
                return !o.stopLoss && o.takeProfit;
              }
              return false;
            });
            
            // Count additional orders beyond the first SL and TP
            const additionalOrders = activeTriggerOrders.length - 
              (stopLossOrders.length > 0 ? 1 : 0) - 
              (takeProfitOrders.length > 0 ? 1 : 0);
            
            const isGtrade = position.positionId.toString().startsWith("g");
            if (isGtrade && (isNaN(pnlValue) || pnlValue === 0)) {
              console.debug("Gtrade position with NaN or zero PnL:", {
                positionId: position.positionId,
                pnl: position.pnl,
                finalPnl,
                pnlValue,
                fees: position.fees,
                size: position.size,
                margin: position.margin,
                fullPosition: {...position}
              });
            }

            return (
              <TableRow 
                key={position.positionId}
                className="cursor-pointer hover:bg-[var(--pane-hover)] md:table-row flex flex-col border-b"
                onClick={() => handleRowClick(position)}
              >
                <TableCell className="flex flex-col md:table-cell md:block">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TokenIcon 
                        pair={position.market} 
                        size={24} 
                        className="mr-2"
                        square={true}
                      />
                      <div>
                        <div>{position.market}</div>
                        <div className={position.isLong ? "text-long" : "text-short"}>
                          {leverage}x {position.isLong ? "Long" : "Short"}
                        </div>
                      </div>
                    </div>
                    <div className="md:hidden" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleClosePosition(position)}
                        disabled={closingPositions[position.positionId]}
                      >
                        {closingPositions[position.positionId]
                          ? "Closing..."
                          : "Close"}
                      </Button>
                    </div>
                  </div>
                </TableCell>
                <TableCell 
                  className="flex justify-between md:table-cell cursor-pointer hover:bg-[var(--pane-hover)]"
                  onClick={(e) => handleSizeClick(position, e)}
                >
                  <span className="md:hidden">Size:</span>
                  <div>
                    <div>${formatNumber(position.size)}</div>
                    <div className="hidden text-muted-foreground md:block">
                      {(parseFloat(position.size) / parseFloat(position.entryPrice)).toFixed(6)} {basePair.toUpperCase()}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="flex justify-between md:hidden">
                  <span>Notional Size:</span>
                  <div className="text-muted-foreground">
                    {(parseFloat(position.size) / parseFloat(position.entryPrice)).toFixed(6)} {basePair.toUpperCase()}
                  </div>
                </TableCell>
                <TableCell 
                  className="flex justify-between md:table-cell cursor-pointer hover:bg-[var(--pane-hover)]"
                  onClick={(e) => handleCollateralClick(position, e)}
                >
                  <span className="md:hidden">Margin:</span>
                  <div>${formatNumber(position.margin)}</div>
                </TableCell>
                <TableCell className="flex justify-between md:table-cell">
                  <span className="md:hidden">Entry Price:</span>
                  <div>${position.entryPrice != null ? formatPairPrice(position.market, parseFloat(position.entryPrice)) : '...'}</div>
                </TableCell>
                <TableCell className="flex justify-between md:table-cell">
                  <span className="md:hidden">Market Price:</span>
                  <div>
                    <div>{currentPrice != null ? `$${formatPairPrice(position.market, currentPrice)}` : "Loading..."}</div>
                    <div className="hidden text-short md:block">
                      ${position.liquidationPrice != null ? formatPairPrice(position.market, parseFloat(position.liquidationPrice)) : '...'}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="flex justify-between md:hidden">
                  <span>Liquidation Price:</span>
                  <div className="text-short">
                    ${position.liquidationPrice != null ? formatPairPrice(position.market, parseFloat(position.liquidationPrice)) : '...'}
                  </div>
                </TableCell>
                <TableCell 
                  className="flex justify-between md:table-cell cursor-pointer hover:bg-[var(--pane-hover)]"
                  onClick={(e) => handleSLTPClick(position, e)}
                >
                  <span className="md:hidden">Stop Loss:</span>
                  <div>
                    <div className="text-short">
                      {stopLossOrders.length > 1 
                        ? `${stopLossOrders.length} Open Orders` 
                        : stopLossOrders.length > 0 
                          ? ('stopLoss' in stopLossOrders[0] && stopLossOrders[0].stopLoss 
                              ? `$${formatPairPrice(position.market, parseFloat(stopLossOrders[0].stopLoss.price))} (${stopLossOrders[0].stopLoss.size}%)` 
                              : 'price' in stopLossOrders[0] 
                                ? `$${formatPairPrice(position.market, stopLossOrders[0].price)} (${stopLossOrders[0].amountPercent}%)` 
                                : "-"
                            ) 
                          : "-"}
                    </div>
                    <div className="hidden text-long md:block">
                      {takeProfitOrders.length > 1 
                        ? `${takeProfitOrders.length} Open Orders` 
                        : takeProfitOrders.length > 0 
                          ? ('takeProfit' in takeProfitOrders[0] && takeProfitOrders[0].takeProfit 
                              ? `$${formatPairPrice(position.market, parseFloat(takeProfitOrders[0].takeProfit.price))} (${takeProfitOrders[0].takeProfit.size}%)` 
                              : 'price' in takeProfitOrders[0] 
                                ? `$${formatPairPrice(position.market, takeProfitOrders[0].price)} (${takeProfitOrders[0].amountPercent}%)` 
                                : "-"
                            ) 
                          : "-"}
                    </div>
                  </div>
                </TableCell>
                <TableCell 
                  className="flex justify-between md:hidden cursor-pointer hover:bg-[var(--pane-hover)]"
                  onClick={(e) => handleSLTPClick(position, e)}
                >
                  <span>Take Profit:</span>
                  <div className="text-long">
                    {takeProfitOrders.length > 1 
                      ? `${takeProfitOrders.length} Open Orders` 
                      : takeProfitOrders.length > 0 
                        ? ('takeProfit' in takeProfitOrders[0] && takeProfitOrders[0].takeProfit 
                            ? `$${formatPairPrice(position.market, parseFloat(takeProfitOrders[0].takeProfit.price))} (${takeProfitOrders[0].takeProfit.size}%)` 
                            : 'price' in takeProfitOrders[0] 
                              ? `$${formatPairPrice(position.market, takeProfitOrders[0].price)} (${takeProfitOrders[0].amountPercent}%)` 
                              : "-"
                        ) 
                      : "-"}
                  </div>
                </TableCell>
                <TableCell
                  ref={setRef(position.positionId)}
                  className={`md:table-cell flex justify-between ${pnlValue >= 0 ? "text-long" : "text-short"}`}
                  onMouseEnter={() => handleMouseEnter(position.positionId)}
                  onMouseLeave={() => setHoveredPosition(null)}
                >
                  <span className="md:hidden">PnL:</span>
                  <div>
                    <div>{formatPnL(finalPnl)}</div>
                    <div>{pnlPercentage}%</div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleClosePosition(position)}
                    disabled={closingPositions[position.positionId]}
                  >
                    {closingPositions[position.positionId]
                      ? "Closing..."
                      : "Close"}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>

      <PositionDialog
        position={selectedPosition}
        triggerOrders={selectedPosition ? getActiveTriggerOrdersForPosition(selectedPosition.positionId) : []}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedPosition(null);
        }}
        onClosePosition={handleClosePosition}
        isClosing={selectedPosition ? closingPositions[selectedPosition.positionId] : false}
        onOpenSLTP={handleOpenSLTP}
        onOpenCollateral={handleOpenCollateral}
      />

      {selectedSLTPPosition && (
        <PositionSLTPDialog
          position={{
            id: Number(selectedSLTPPosition.positionId),
            symbol: selectedSLTPPosition.market,
            isLong: selectedSLTPPosition.isLong,
            entryPrice: parseFloat(selectedSLTPPosition.entryPrice),
            markPrice: prices[selectedSLTPPosition.market.split("/")[0].toLowerCase()]?.price || 0,
            pnl: formatPnL(calculateFinalPnl(selectedSLTPPosition)),
            pnlPercentage: parseFloat(calculatePnLPercentage(
              parseFloat(calculateFinalPnl(selectedSLTPPosition)),
              selectedSLTPPosition.margin
            )),
            size: selectedSLTPPosition.size,
            margin: selectedSLTPPosition.margin,
            liquidationPrice: selectedSLTPPosition.liquidationPrice,
            fees: selectedSLTPPosition.fees
          }}
          isOpen={isSLTPDialogOpen}
          onClose={() => {
            setIsSLTPDialogOpen(false);
            setSelectedSLTPPosition(null);
          }}
        />
      )}

      <PositionCollateralDialog
        position={selectedCollateralPosition}
        isOpen={isCollateralDialogOpen}
        onClose={() => {
          setIsCollateralDialogOpen(false);
          setSelectedCollateralPosition(null);
        }}
      />

      <PositionSizeDialog
        position={selectedPosition}
        isOpen={isSizeDialogOpen}
        onClose={() => {
          setIsSizeDialogOpen(false);
          setSelectedPosition(null);
        }}
      />
    </>
  );
}
