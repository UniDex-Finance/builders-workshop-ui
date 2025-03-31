import React from 'react';
import { Position } from "../../../../hooks/use-positions";
import { TriggerOrder } from "../../../../hooks/use-orders";
import { Bitcoin, ChevronDown, Share2, X } from "lucide-react";
import { Button } from "../../../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../ui/dropdown-menu";
import { usePrices } from "../../../../lib/websocket-price-context";
import { useState } from "react";
import { PositionSizeDialog } from "./PositionSizeDialog";
import { TokenIcon } from "../../../../hooks/use-token-icon";
import { usePairPrecision } from '@/hooks/use-pair-precision';

// Combined type for trigger orders
type TriggerOrderWithStatus = TriggerOrder | {
  orderId: number;
  isTP: boolean;
  price: number;
  amountPercent: string;
  status: number;
  createdAt: string;
};

interface PositionDetailsProps {
  position: Position;
  stopLossOrder?: TriggerOrderWithStatus;
  takeProfitOrder?: TriggerOrderWithStatus;
  additionalOrders: number;
  // Add an array of all trigger orders
  allTriggerOrders?: TriggerOrderWithStatus[];
  onClose: () => void;
  onClosePosition: (position: Position) => void;
  isClosing: boolean;
  onOpenSLTP?: () => void;
  onOpenCollateral?: () => void;
  onShare: () => void;
  onOpenSize: () => void;
  pairLogo?: string | null;
}

export function PositionDetails({
  position,
  stopLossOrder,
  takeProfitOrder,
  additionalOrders,
  allTriggerOrders = [],
  onClose,
  onClosePosition,
  isClosing,
  onOpenSLTP,
  onOpenCollateral,
  onShare,
  onOpenSize,
}: PositionDetailsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSizeDialogOpen, setIsSizeDialogOpen] = useState(false);
  const { prices } = usePrices();
  const basePair = position.market.split("/")[0].toLowerCase();
  const currentPrice = prices[basePair]?.price;
  const { formatPairPrice } = usePairPrecision();

  const calculateFinalPnl = () => {
    return parseFloat(position.pnl.replace(/[^0-9.-]/g, "")).toFixed(2);
  };

  const calculateLeverage = () => {
    const sizeValue = parseFloat(position.size.replace(/[^0-9.-]/g, ""));
    const marginValue = parseFloat(position.margin.replace(/[^0-9.-]/g, ""));
    return (sizeValue / marginValue).toFixed(1);
  };

  const formatPnL = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return numValue >= 0
      ? `$${numValue.toFixed(2)}`
      : `-$${Math.abs(numValue).toFixed(2)}`;
  };

  const handleSLTPClick = () => {
    setIsDropdownOpen(false);
    onClose();
    if (onOpenSLTP) {
      onOpenSLTP();
    }
  };

  const handleCollateralClick = () => {
    setIsDropdownOpen(false);
    onClose();
    if (onOpenCollateral) {
      onOpenCollateral();
    }
  };

  const handleSizeClick = () => {
    setIsDropdownOpen(false);
    if (onOpenSize) {
      onOpenSize();
    }
  };

  const pnlValue = parseFloat(calculateFinalPnl());
  const leverage = calculateLeverage();

  // Helper functions to extract price and size from different trigger order formats
  const getOrderPrice = (order: TriggerOrderWithStatus | undefined, isTP: boolean) => {
    if (!order) return null;
    
    if ('takeProfit' in order && 'stopLoss' in order) {
      return isTP 
        ? (order.takeProfit?.price || null)
        : (order.stopLoss?.price || null);
    } else if ('price' in order) {
      return order.price.toString();
    }
    return null;
  };

  const getOrderSize = (order: TriggerOrderWithStatus | undefined, isTP: boolean) => {
    if (!order) return null;
    
    if ('takeProfit' in order && 'stopLoss' in order) {
      return isTP 
        ? (order.takeProfit?.size || null)
        : (order.stopLoss?.size || null);
    } else if ('amountPercent' in order) {
      return order.amountPercent;
    }
    return null;
  };

  // Get stop loss and take profit orders
  const getStopLossPrice = () => getOrderPrice(stopLossOrder, false);
  const getStopLossSize = () => getOrderSize(stopLossOrder, false);
  const getTakeProfitPrice = () => getOrderPrice(takeProfitOrder, true);
  const getTakeProfitSize = () => getOrderSize(takeProfitOrder, true);

  // Group trigger orders
  const stopLossOrders = allTriggerOrders.filter(order => {
    if ('isTP' in order) return !order.isTP;
    if ('stopLoss' in order && 'takeProfit' in order) return order.stopLoss && !order.takeProfit;
    return false;
  });
  
  const takeProfitOrders = allTriggerOrders.filter(order => {
    if ('isTP' in order) return order.isTP;
    if ('stopLoss' in order && 'takeProfit' in order) return !order.stopLoss && order.takeProfit;
    return false;
  });

  return (
    <>
      <div className="w-full text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <TokenIcon 
              pair={position.market} 
              size={32} 
              className="mr-2" 
            />
            <span className="font-medium">{position.market}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${position.isLong ? "bg-emerald-500/20 text-long" : "bg-red-500/20 text-short"}`}>
              {position.isLong ? "LONG" : "SHORT"}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-zinc-700"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Collateral</span>
            <div className="flex items-center gap-1">
              <span>{position.margin.replace(/[^0-9.-]/g, "")}</span>
              <span className="text-zinc-400">USDC</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Leverage</span>
            <div className="flex items-center gap-1">
              <span>{leverage}x</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Position Size</span>
            <div className="flex items-center gap-1">
              <span>{position.size.replace(/[^0-9.-]/g, "")}</span>
              <span className="text-zinc-400">USDC</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Notional Size</span>
            <div className="flex items-center gap-1">
              <span>{(parseFloat(position.size) / parseFloat(position.entryPrice)).toFixed(6)}</span>
              <span className="text-zinc-400">{basePair.toUpperCase()}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Entry Price</span>
            <span>${position.entryPrice != null ? formatPairPrice(position.market, parseFloat(position.entryPrice)) : "..."}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Current Price</span>
            <span>${currentPrice != null ? formatPairPrice(position.market, currentPrice) : "Loading..."}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Liquidation Price</span>
            <span className="text-short">${position.liquidationPrice != null ? formatPairPrice(position.market, parseFloat(position.liquidationPrice)) : "..."}</span>
          </div>

          {/* Stop Loss Orders Section */}
          {stopLossOrders.length === 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Stop Loss</span>
              <span className="text-short">-</span>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-zinc-400">Stop Loss</span>
              </div>
              {stopLossOrders.map((order, index) => {
                const price = getOrderPrice(order, false);
                const size = getOrderSize(order, false);
                return (
                  <div key={`sl-${index}`} className="flex items-center justify-end mb-1 text-short">
                    {price ? 
                      `$${formatPairPrice(position.market, parseFloat(price))} (${size}%)`
                      : "-"}
                  </div>
                );
              })}
            </div>
          )}

          {/* Take Profit Orders Section */}
          {takeProfitOrders.length === 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Take Profit</span>
              <span className="text-long">-</span>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-zinc-400">Take Profit</span>
              </div>
              {takeProfitOrders.map((order, index) => {
                const price = getOrderPrice(order, true);
                const size = getOrderSize(order, true);
                return (
                  <div key={`tp-${index}`} className="flex items-center justify-end mb-1 text-long">
                    {price ? 
                      `$${formatPairPrice(position.market, parseFloat(price))} (${size}%)`
                      : "-"}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Position Fee</span>
            <div className="flex items-center gap-1">
              <span className="text-short">-${position.fees.positionFee}</span>
              <span className="text-zinc-400">USDC</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Borrow Fee</span>
            <div className="flex items-center gap-1">
              <span className="text-short">-${position.fees.borrowFee}</span>
              <span className="text-zinc-400">USDC</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Funding Fee</span>
            <div className="flex items-center gap-1">
              <span className={position.fees.fundingFee.startsWith("-") ? "text-long" : "text-short"}>
                {position.fees.fundingFee.startsWith("-") ? "-$" : "$"}
                {position.fees.fundingFee.replace(/[^0-9.-]/g, "")}
              </span>
              <span className="text-zinc-400">USDC</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 mt-2 border-t border-zinc-800">
            <span className="text-zinc-400">Unrealized PnL</span>
            <div className="flex items-center gap-1">
              <span className={pnlValue >= 0 ? "text-long" : "text-short"}>
                {formatPnL(pnlValue)}
              </span>
              <span className="text-zinc-400">USDC</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            className="flex-grow text-white bg-blue-600 hover:bg-blue-700"
            onClick={() => onClosePosition(position)}
            disabled={isClosing}
          >
            {isClosing ? "Closing..." : "Close Trade"}
          </Button>
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="px-2 bg-zinc-800 border-zinc-700 hover:bg-zinc-700">
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 text-white bg-zinc-800 border-zinc-700">
              <DropdownMenuItem 
                className="focus:bg-zinc-700 focus:text-white"
                onClick={handleSizeClick}
              >
                Increase Size
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="focus:bg-zinc-700 focus:text-white"
                onClick={handleSLTPClick}
              >
                Set SL/TP
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="focus:bg-zinc-700 focus:text-white"
                onClick={() => {
                  setIsDropdownOpen(false);
                  if (onShare) onShare();
                }}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Trade
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="focus:bg-zinc-700 focus:text-white"
                onClick={handleCollateralClick}
              >
                Edit Collateral
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <PositionSizeDialog
        position={position}
        isOpen={isSizeDialogOpen}
        onClose={() => setIsSizeDialogOpen(false)}
      />
    </>
  );
}
