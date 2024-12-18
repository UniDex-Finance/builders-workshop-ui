import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "../../../ui/button";
import { Card, CardContent, CardFooter } from "../../../ui/card";
import { Input } from "../../../ui/input";
import { Dialog, DialogContent } from "../../../ui/dialog";
import { Position } from "../../../../hooks/use-positions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useModifyPositionActions } from "@/hooks/trading-hooks/unidex-hooks/use-modify-position-actions";
import { usePrices } from "@/lib/websocket-price-context";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { useBalances } from "@/hooks/use-balances";
import { useMarketData } from "@/hooks/use-market-data";

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
  
  // Calculate new values for increase
  const collateralDelta = collateralAmount ? parseFloat(collateralAmount) : 0;
  const newMargin = currentMargin + collateralDelta;
  
  // Calculate additional size based on new collateral and chosen leverage
  const additionalSize = collateralDelta * leverage;
  const newTotalSize = currentSize + additionalSize;
  
  // Calculate new effective leverage after increase
  const newEffectiveLeverage = parseFloat((newTotalSize / newMargin).toFixed(1));

  // Calculate new average entry price
  const currentNotional = currentSize;
  const additionalNotional = additionalSize;
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
    // Get trading fee rate for this pair and side
    const market = allMarkets.find(m => m.pair === position.market);
    const tradingFeeRate = market 
      ? (position.isLong ? market.longTradingFee / 100 : market.shortTradingFee / 100)
      : 0.001; // fallback to 0.1%

    // Calculate max collateral considering fees
    // If we use X collateral with leverage L, size will be X*L
    // Fee will be X*L*feeRate
    // So X + X*L*feeRate = totalAvailableBalance
    // X * (1 + L*feeRate) = totalAvailableBalance
    // X = totalAvailableBalance / (1 + L*feeRate)
    const maxCollateral = totalAvailableBalance / (1 + leverage * tradingFeeRate);

    // Round down to 2 decimal places
    const roundedMaxCollateral = Math.floor(maxCollateral * 100) / 100;

    setCollateralAmount(roundedMaxCollateral.toString());
  };

  const handleSubmit = async () => {
    if (!position || !isValidCollateral || !isValidLeverage || !isValidSize) return;
    
    try {
      await increasePosition(
        parseInt(position.positionId),
        isIncrease ? collateralDelta : -collateralDelta,
        additionalSize,
        position.isLong,
        currentPrice,
        position.market
      );
      onClose();
      setCollateralAmount("");
      setLeverage(1);
    } catch (error) {
      console.error("Failed to modify position:", error);
    }
  };

  const isLoading = increasingPositions[parseInt(position.positionId)];
  const isValid = isValidCollateral && isValidLeverage && isValidSize;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 border-0 sm:max-w-[320px] bg-[#17161d]">
        <Card className="border-0 shadow-lg bg-[#17161d]">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Edit Position Size</h2>
              <button className="text-zinc-400 hover:text-white" onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            <div className="p-1 rounded bg-zinc-800">
              <div className="grid grid-cols-2 gap-1">
                <Button
                  variant="ghost"
                  className={`w-full ${isIncrease ? 'bg-blue-900 text-white' : 'bg-transparent text-zinc-400'} hover:bg-blue-800`}
                  onClick={() => setIsIncrease(true)}
                >
                  Increase
                </Button>
                <Button
                  variant="ghost"
                  className={`w-full ${!isIncrease ? 'bg-blue-900 text-white' : 'bg-transparent text-zinc-400'} hover:bg-blue-800`}
                  onClick={() => setIsIncrease(false)}
                >
                  Decrease
                </Button>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1 text-xs">
                <span className="text-white">Collateral</span>
                <span className="text-zinc-400">Balance: {totalAvailableBalance.toFixed(2)}</span>
              </div>
              <div className="flex items-center rounded bg-zinc-800">
                <Input
                  type="number"
                  value={collateralAmount}
                  onChange={(e) => setCollateralAmount(e.target.value)}
                  className="w-full text-2xl font-bold text-white bg-transparent border-none focus:ring-0"
                  max={isIncrease ? totalAvailableBalance : currentMargin * 0.99}
                  min={0}
                />
                <Button
                  variant="ghost"
                  className="h-8 px-2 mr-2 text-xs text-blue-400 hover:text-blue-300"
                  onClick={handleMaxClick}
                >
                  MAX
                </Button>
              </div>
            </div>

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

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Leverage</span>
                <span className="text-white">{currentLeverage}x → {newEffectiveLeverage}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Collateral</span>
                <span className="text-white">
                  {currentMargin.toFixed(2)} → {newMargin.toFixed(2)} USDC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Position Size</span>
                <span className="text-white">
                  {currentSize.toFixed(2)} → {newTotalSize.toFixed(2)} USDC
                </span>
              </div>
              <div className="flex justify-between">
                <span></span>
                <span className="text-zinc-400">
                  {(currentSize / currentPrice).toFixed(6)} → {(newTotalSize / currentPrice).toFixed(6)} {basePair.toUpperCase()}
                </span>
              </div>
            </div>

            <Separator className="bg-zinc-800" />

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Entry Price</span>
                <span className="text-white">
                  {parseFloat(position.entryPrice).toFixed(1)} → {newAverageEntry.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Liq. Price</span>
                <span className="text-white">
                  {parseFloat(position.liquidationPrice).toFixed(1)} → {newLiquidationPrice.toFixed(1)}
                </span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-4 bg-[#17161d]">
            <Button 
              className="w-full font-semibold text-white bg-blue-600 hover:bg-blue-700"
              disabled={!isValid || isLoading || !collateralAmount}
              onClick={handleSubmit}
            >
              {isLoading 
                ? "Processing..." 
                : `${isIncrease ? 'Increase' : 'Decrease'} by ${Math.abs(additionalSize).toFixed(2)} USDC`
              }
            </Button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
} 