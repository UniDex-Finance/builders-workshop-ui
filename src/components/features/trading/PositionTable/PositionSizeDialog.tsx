import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "../../../ui/button";
import { Card, CardContent, CardFooter } from "../../../ui/card";
import { Input } from "../../../ui/input";
import { Dialog, DialogContent } from "../../../ui/dialog";
import { Position } from "../../../../hooks/use-positions";
import { useModifyPositionActions } from "@/hooks/trading-hooks/unidex-hooks/use-modify-position-actions";
import { usePrices } from "@/lib/websocket-price-context";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { useBalances } from "@/hooks/use-balances";
import { useMarketData } from "@/hooks/use-market-data";
import { usePositionActions } from "@/hooks/trading-hooks/unidex-hooks/use-position-actions";

interface PositionSizeDialogProps {
  position: Position | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PositionSizeDialog({
  position,
  isOpen,
  onClose,
}: PositionSizeDialogProps) {
  const [isIncrease, setIsIncrease] = useState(true);
  const [collateralAmount, setCollateralAmount] = useState<string>("");
  const [leverage, setLeverage] = useState<number>(1);
  const { increasePosition, increasingPositions } = useModifyPositionActions();
  const { closePosition, closingPositions } = usePositionActions();
  const { prices } = usePrices();
  const { balances } = useBalances("arbitrum");
  const { allMarkets } = useMarketData();
  
  if (!position) return null;
  
  // Helper functions
  const getNumericValue = (value: string) => {
    return parseFloat(value.replace(/[^0-9.-]/g, ""));
  };

  // Current position values
  const currentMargin = getNumericValue(position.margin);
  const currentSize = getNumericValue(position.size);
  const currentLeverage = parseFloat((currentSize / currentMargin).toFixed(1));
  const basePair = position.market.split("/")[0].toLowerCase();
  const currentPrice = prices[basePair]?.price || parseFloat(position.entryPrice);
  
  // Calculate values based on whether increasing or decreasing
  const sizeToModify = collateralAmount ? parseFloat(collateralAmount) : 0;
  const collateralDelta = isIncrease ? sizeToModify : 0; // Only used for increase
  const sizeDelta = isIncrease 
    ? sizeToModify * leverage // For increase: collateral * leverage
    : sizeToModify; // For decrease: directly use input as size

  // New totals
  const newMargin = isIncrease ? currentMargin + collateralDelta : currentMargin;
  const newTotalSize = isIncrease 
    ? currentSize + sizeDelta 
    : currentSize - sizeDelta;

  // Calculate new effective leverage after increase
  const newEffectiveLeverage = parseFloat((newTotalSize / newMargin).toFixed(1));

  // Calculate new average entry price
  const currentNotional = currentSize;
  const additionalNotional = sizeDelta;
  const totalNotional = currentNotional + additionalNotional;
  
  const newAverageEntry = (
    (currentNotional * parseFloat(position.entryPrice) + additionalNotional * currentPrice) / 
    totalNotional
  );

  // Calculate new liquidation price (-90% from entry)
  const newLiquidationPrice = position.isLong
    ? newAverageEntry * 0.1  // Long position liquidates at 90% loss
    : newAverageEntry * 1.9; // Short position liquidates at 90% loss

  // Calculate fees
  const positionFee = Math.max(newTotalSize * 0.001, 0.8); // 0.1% fee with 0.8 USDC minimum
  const borrowFee = position.fees.borrowFee; // Keep existing borrow fee
  const fundingFee = position.fees.fundingFee; // Keep existing funding fee

  // Validation
  const maxCollateral = 7493.47; // This should come from your balance/wallet
  const isValidCollateral = isIncrease 
    ? collateralDelta <= maxCollateral
    : collateralDelta <= currentMargin * 0.99; // Prevent removing all collateral

  const isValidLeverage = leverage >= 1 && leverage <= 100;
  const isValidSize = isIncrease 
    ? newTotalSize > currentSize 
    : newTotalSize < currentSize * 0.99; // Prevent closing entire position

  // Calculate total available balance
  const marginBalance = parseFloat(balances?.formattedMusdBalance || "0");
  const onectBalance = parseFloat(balances?.formattedUsdcBalance || "0");
  const totalAvailableBalance = marginBalance + onectBalance;
  
  const handleMaxClick = () => {
    if (isIncrease) {
      // Existing max logic for increasing position
      const market = allMarkets.find(m => m.pair === position.market);
      const tradingFeeRate = market 
        ? (position.isLong ? market.longTradingFee / 100 : market.shortTradingFee / 100)
        : 0.001;

      const maxCollateral = totalAvailableBalance / (1 + leverage * tradingFeeRate);
      const roundedMaxCollateral = Math.floor(maxCollateral * 100) / 100;
      setCollateralAmount(roundedMaxCollateral.toString());
    } else {
      // For decrease, max is current position size
      setCollateralAmount(currentSize.toString());
    }
  };

  const handleSubmit = async () => {
    if (!position || !collateralAmount) return;
    
    try {
      if (isIncrease) {
        // Existing increase logic
        await increasePosition(
          parseInt(position.positionId),
          collateralDelta,
          sizeDelta,
          position.isLong,
          currentPrice,
          position.market
        );
      } else {
        // Decrease logic using closePosition
        await closePosition(
          position.positionId,
          position.isLong,
          currentPrice,
          sizeDelta
        );
      }
      onClose();
      setCollateralAmount("");
      setLeverage(1);
    } catch (error) {
      console.error("Failed to modify position:", error);
    }
  };

  const isLoading = isIncrease 
    ? increasingPositions[parseInt(position.positionId)]
    : closingPositions[position.positionId];

  // Validation
  const isValid = isIncrease
    ? collateralDelta <= maxCollateral && leverage >= 1 && leverage <= 100
    : sizeDelta > 0 && sizeDelta <= currentSize;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 border-0 sm:max-w-[360px] bg-[#17161d]" hideClose>
        <Card className="border-0 shadow-lg bg-[#17161d] rounded-xl overflow-hidden">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Edit Position Size</h2>
              <button className="text-zinc-400 hover:text-white" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            <div className="p-1 rounded bg-[#272734]">
              <div className="grid grid-cols-2 gap-1">
                <Button
                  variant="ghost"
                  className={`w-full h-8 ${isIncrease ? 'bg-[#7142cf] text-white' : 'bg-transparent text-zinc-400'} hover:bg-[#7142cf]/80`}
                  onClick={() => setIsIncrease(true)}
                >
                  Increase
                </Button>
                <Button
                  variant="ghost"
                  className={`w-full h-8 ${!isIncrease ? 'bg-[#7142cf] text-white' : 'bg-transparent text-zinc-400'} hover:bg-[#7142cf]/80`}
                  onClick={() => setIsIncrease(false)}
                >
                  Decrease
                </Button>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2 text-xs">
                <span className="text-white">{isIncrease ? 'Collateral' : 'Size'}</span>
                <span className="text-zinc-400">
                  {isIncrease 
                    ? `Balance: ${totalAvailableBalance.toFixed(2)}`
                    : `Max: ${currentSize.toFixed(2)}`}
                </span>
              </div>
              <div className="flex items-center rounded bg-[#272734] p-1">
                <Input
                  type="number"
                  value={collateralAmount}
                  onChange={(e) => setCollateralAmount(e.target.value)}
                  className="w-full p-2 text-xl font-bold text-white bg-transparent border-none focus:ring-0"
                  max={isIncrease ? totalAvailableBalance : currentSize}
                  min={0}
                />
                <Button
                  variant="ghost"
                  className="h-8 px-3 mr-2 text-xs text-[#7142cf] hover:text-[#7142cf]/80"
                  onClick={handleMaxClick}
                >
                  MAX
                </Button>
              </div>
            </div>

            {isIncrease && (
              <div>
                <div className="flex justify-between mb-1 text-xs">
                  <span className="text-white">Leverage (1x-100x)</span>
                  <span>{leverage}x</span>
                </div>
                <Slider
                  value={[leverage]}
                  onValueChange={(value) => setLeverage(Math.round(value[0]))}
                  max={100}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between mt-1 text-xs text-zinc-400">
                  <span>1x</span>
                  <span>100x</span>
                </div>
              </div>
            )}

            <Separator className="bg-[#272734]" />

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Leverage</span>
                <span>
                  <span className="text-zinc-400">{currentLeverage}x</span>
                  <span className="text-white"> → {newEffectiveLeverage}x</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Collateral</span>
                <span>
                  <span className="text-zinc-400">{currentMargin.toFixed(2)}</span>
                  <span className="text-white"> → {newMargin.toFixed(2)} USD</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Position Size</span>
                <span>
                  <span className="text-zinc-400">{currentSize.toFixed(2)}</span>
                  <span className="text-white"> → {newTotalSize.toFixed(2)} USD</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span></span>
                <span>
                  <span className="text-zinc-400">{(currentSize / currentPrice).toFixed(6)}</span>
                  <span className="text-zinc-400"> → {(newTotalSize / currentPrice).toFixed(6)} {basePair.toUpperCase()}</span>
                </span>
              </div>
            </div>

            <Separator className="bg-[#272734]" />

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Entry Price</span>
                <span>
                  <span className="text-zinc-400">{parseFloat(position.entryPrice).toFixed(1)}</span>
                  <span className="text-white"> → {newAverageEntry.toFixed(1)}</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Liq. Price</span>
                <span>
                  <span className="text-zinc-400">{parseFloat(position.liquidationPrice).toFixed(1)}</span>
                  <span className="text-white"> → {newLiquidationPrice.toFixed(1)}</span>
                </span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-6 bg-[#17161d]">
            <Button 
              className="w-full font-semibold text-white bg-[#7142cf] hover:bg-[#7142cf]/80 py-4 text-sm"
              disabled={!isValid || isLoading || !collateralAmount}
              onClick={handleSubmit}
            >
              {isLoading 
                ? "Processing..." 
                : `${isIncrease ? 'Increase' : 'Decrease'} by ${Math.abs(sizeDelta).toFixed(2)} USD`
              }
            </Button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
} 