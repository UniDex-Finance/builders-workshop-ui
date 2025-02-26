import { Position } from "../../../../hooks/use-positions";
import { TriggerOrder } from "../../../../hooks/use-orders";
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

interface PositionsContentProps {
  positions: Position[];
  triggerOrders?: TriggerOrder[];
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
            const triggerOrder = triggerOrders.find(
              (order) => order.positionId === position.positionId
            );
            
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
                    <div>
                      <div>{position.market}</div>
                      <div className={position.isLong ? "text-long" : "text-short"}>
                        {leverage}x {position.isLong ? "Long" : "Short"}
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
                  <div>${formatNumber(position.entryPrice)}</div>
                </TableCell>
                <TableCell className="flex justify-between md:table-cell">
                  <span className="md:hidden">Market Price:</span>
                  <div>
                    <div>{currentPrice ? `$${formatNumber(currentPrice.toFixed(2))}` : "Loading..."}</div>
                    <div className="hidden text-short md:block">
                      ${formatNumber(position.liquidationPrice)}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="flex justify-between md:hidden">
                  <span>Liquidation Price:</span>
                  <div className="text-short">
                    ${formatNumber(position.liquidationPrice)}
                  </div>
                </TableCell>
                <TableCell 
                  className="flex justify-between md:table-cell cursor-pointer hover:bg-[var(--pane-hover)]"
                  onClick={(e) => handleSLTPClick(position, e)}
                >
                  <span className="md:hidden">Stop Loss:</span>
                  <div>
                    <div className="text-short">
                      {triggerOrder?.stopLoss
                        ? `$${formatNumber(triggerOrder.stopLoss.price)} (${triggerOrder.stopLoss.size}%)`
                        : "-"}
                    </div>
                    <div className="hidden text-long md:block">
                      {triggerOrder?.takeProfit
                        ? `$${formatNumber(triggerOrder.takeProfit.price)} (${triggerOrder.takeProfit.size}%)`
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
                    {triggerOrder?.takeProfit
                      ? `$${formatNumber(triggerOrder.takeProfit.price)} (${triggerOrder.takeProfit.size}%)`
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
        triggerOrder={triggerOrders.find(
          (order) => order.positionId === selectedPosition?.positionId
        )}
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
