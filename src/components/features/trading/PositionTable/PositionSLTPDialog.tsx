import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePositionActions } from "@/hooks/trading-hooks/unidex-hooks/use-position-actions";
import { useState } from "react";

interface Position {  
  id: number;
  symbol: string;
  isLong: boolean;
  entryPrice: number;
  markPrice: number;
  pnl: string;
  pnlPercentage: number;
  size: string;
  margin: string;
  liquidationPrice: string;
  fees: {
    positionFee: string;
    borrowFee: string;
    fundingFee: string;
  };
}

interface PositionSLTPDialogProps {
  position: Position;
  isOpen: boolean;
  onClose: () => void;
}

export function PositionSLTPDialog({ position, isOpen, onClose }: PositionSLTPDialogProps) {
  const [tpPrice, setTpPrice] = useState("");
  const [tpGain, setTpGain] = useState("");
  const [slPrice, setSlPrice] = useState("");
  const [slLoss, setSlLoss] = useState("");
  const { addTPSL, settingTPSL } = usePositionActions();

  const getNumericValue = (value: string) => {
    return parseFloat(value.replace(/[^0-9.-]/g, ""));
  };

  const isStopLossBelowLiquidation = (): boolean => {
    if (!slPrice) return false;
    const slNumeric = parseFloat(slPrice);
    const liquidationNumeric = getNumericValue(position.liquidationPrice);
    return position.isLong ? 
      slNumeric <= liquidationNumeric : 
      slNumeric >= liquidationNumeric;
  };

  const calculatePnL = (targetPrice: string) => {
    if (!targetPrice) return 0;
    const price = parseFloat(targetPrice);
    const size = getNumericValue(position.size);
    const priceDiff = position.isLong ? price - position.entryPrice : position.entryPrice - price;
    return priceDiff * size;
  };

  const calculateGainPercentage = (targetPrice: string) => {
    if (!targetPrice) return 0;
    const pnl = calculatePnL(targetPrice);
    const margin = getNumericValue(position.margin);
    return (pnl / margin) * 100;
  };

  const handleGainChange = (gainStr: string, isTP: boolean) => {
    if (!gainStr) {
      isTP ? setTpPrice("") : setSlPrice("");
      isTP ? setTpGain("") : setSlLoss("");
      return;
    }
  
    const gainPercentage = parseFloat(gainStr);
    const margin = getNumericValue(position.margin);
    const size = getNumericValue(position.size);
    const leverage = size / margin;
    
    const requiredPriceMovementPercent = gainPercentage / leverage;
    
    if (isTP) {
      // For take profit, keep the same logic
      const newPrice = position.isLong ?
        position.entryPrice * (1 + requiredPriceMovementPercent / 100) :
        position.entryPrice * (1 - requiredPriceMovementPercent / 100);
      setTpPrice(newPrice.toFixed(2));
      setTpGain(gainStr);
    } else {
      // For stop loss, move price in opposite direction
      const newPrice = position.isLong ?
        position.entryPrice * (1 - requiredPriceMovementPercent / 100) :
        position.entryPrice * (1 + requiredPriceMovementPercent / 100);
      setSlPrice(newPrice.toFixed(2));
      setSlLoss(gainStr);
    }
  };
  const handlePriceChange = (priceStr: string, isTP: boolean) => {
    if (!priceStr) {
      isTP ? setTpPrice("") : setSlPrice("");
      isTP ? setTpGain("") : setSlLoss("");
      return;
    }
  
    const price = parseFloat(priceStr);
    const size = getNumericValue(position.size);
    const margin = getNumericValue(position.margin);
    const leverage = size / margin;
    
    if (isTP) {
      // Calculate percentage price difference from entry
      const percentageDiff = ((price - position.entryPrice) / position.entryPrice) * 100;
      // Multiply by leverage to get actual gain percentage on margin
      const gainPercentage = position.isLong ? 
        percentageDiff * leverage : 
        -percentageDiff * leverage;
      
      setTpPrice(priceStr);
      setTpGain(gainPercentage.toFixed(2));
    } else {
      // Calculate percentage price difference from entry
      const percentageDiff = ((price - position.entryPrice) / position.entryPrice) * 100;
      // Multiply by leverage to get actual loss percentage on margin
      const lossPercentage = position.isLong ? 
        -percentageDiff * leverage : 
        percentageDiff * leverage;
      
      setSlPrice(priceStr);
      setSlLoss(Math.abs(lossPercentage).toFixed(2));
    }
  };

  const handleSubmit = async () => {
    const tp = tpPrice ? parseFloat(tpPrice) : null;
    const sl = slPrice && !isStopLossBelowLiquidation() ? parseFloat(slPrice) : null;

    if (!tp && !sl) {
      return;
    }

    await addTPSL(
      position.id,
      tp,
      sl,
      100,
      100
    );

    onClose();
  };

  const getTPText = () => {
    if (!tpPrice) return null;
    const margin = getNumericValue(position.margin);
    const gainPercentage = parseFloat(tpGain);
    const pnl = (gainPercentage / 100) * margin;

    return (
      <div className="mb-4 text-sm text-gray-400">
        If the price reaches {tpPrice}, 
        a market order will trigger with an profit of{" "}
        <span className="text-emerald-500">
          ${Math.abs(pnl).toFixed(2)}
        </span>.
      </div>
    );
  };

  const getSLText = () => {
    if (!slPrice) return null;
    
    if (isStopLossBelowLiquidation()) {
      return (
        <div className="mb-4 text-sm text-red-500">
          Stop loss price can't be {position.isLong ? "lower" : "higher"} than liquidation price
        </div>
      );
    }

    const margin = getNumericValue(position.margin);
    const lossPercentage = parseFloat(slLoss);
    const pnl = (lossPercentage / 100) * margin;

    return (
      <div className="mb-4 text-sm text-gray-400">
        If the price reaches {slPrice}, 
        a market order will trigger with an loss of{" "}
        <span className="text-red-500">
          ${Math.abs(pnl).toFixed(2)}
        </span>.
      </div>
    );
  };

  const isSubmitDisabled = (): boolean => {
    if (settingTPSL[position.id]) return true;
    if (!tpPrice && !slPrice) return true;
    if (slPrice && isStopLossBelowLiquidation()) return true;
    return false;
  };

  return (
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="p-0 border-0 sm:max-w-md bg-[#17161d]">
    <Card className="w-full border-0 shadow-lg bg-[#17161d]">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 text-white bg-orange-500 rounded-full">₿</div>
              <div>
                <div className="text-white">{position.symbol}</div>
                <div className={position.isLong ? "text-emerald-500 text-sm" : "text-red-500 text-sm"}>
                  {position.isLong ? "LONG" : "SHORT"}
                </div>
              </div>
            </div>

            <div className="mb-6 space-y-4">
              <div className="flex justify-between text-gray-400">
                <span>Est. Current PnL</span>
                <span className={parseFloat(position.pnl) >= 0 ? "text-emerald-500" : "text-red-500"}>
                  {position.pnl} ({position.pnlPercentage.toFixed(2)}%)
                </span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Size</span>
                <div className="flex items-center gap-1">
                  <span className="text-white">{position.size}</span>
                  <span className="text-zinc-400">USDC</span>
                </div>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Margin</span>
                <div className="flex items-center gap-1">
                  <span className="text-white">{position.margin}</span>
                  <span className="text-zinc-400">USDC</span>
                </div>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Liquidation Price</span>
                <span className="text-red-500">{position.liquidationPrice}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Entry Price</span>
                <span className="text-white">${position.entryPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Market Price</span>
                <span className="text-white">${position.markPrice.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="mb-4 text-lg text-white">Take Profit</div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="take-profit-price" className="text-gray-400">
                      Price
                    </Label>
                    <Input
                      id="take-profit-price"
                      value={tpPrice}
                      onChange={(e) => handlePriceChange(e.target.value, true)}
                      className="text-white bg-transparent border-gray-800"
                      type="number"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="take-profit-gain" className="text-gray-400">
                      Gain %
                    </Label>
                    <Input
                      id="take-profit-gain"
                      value={tpGain}
                      onChange={(e) => handleGainChange(e.target.value, true)}
                      className="text-white bg-transparent border-gray-800"
                      type="number"
                      step="0.01"
                    />
                  </div>
                </div>
                {getTPText()}
              </div>

              <div>
                <div className="mb-4 text-lg text-white">Stop Loss</div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="stop-loss-price" className="text-gray-400">
                      Price
                    </Label>
                    <Input 
                      id="stop-loss-price" 
                      value={slPrice}
                      onChange={(e) => handlePriceChange(e.target.value, false)}
                      className="text-white bg-transparent border-gray-800"
                      type="number"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stop-loss-loss" className="text-gray-400">
                      Loss %
                    </Label>
                    <Input 
                      id="stop-loss-loss" 
                      value={slLoss}
                      onChange={(e) => handleGainChange(e.target.value, false)}
                      className="text-white bg-transparent border-gray-800"
                      type="number"
                      step="0.01"
                    />
                  </div>
                </div>
                {getSLText()}
              </div>

              <Button 
                className="w-full text-white" 
                style={{ backgroundColor: "#7142cf" }}
                onClick={handleSubmit}
                disabled={isSubmitDisabled()}
              >
                {settingTPSL[position.id] ? "Placing Order..." : "Place Take Profit & Stop Loss"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
