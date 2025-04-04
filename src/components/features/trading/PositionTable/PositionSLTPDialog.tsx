import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { usePositionActions } from "@/hooks/trading-hooks/unidex-hooks/use-position-actions";
import { useState, useMemo, useEffect } from "react";
import { usePairPrecision } from '@/hooks/use-pair-precision';
import { ChevronDown } from "lucide-react";

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
  const [tpDistance, setTpDistance] = useState("");
  const [slDistance, setSlDistance] = useState("");
  const [tpPnl, setTpPnl] = useState("");
  const [slPnl, setSlPnl] = useState("");
  const [tpTriggerType, setTpTriggerType] = useState<"distance" | "pnl">("distance");
  const [slTriggerType, setSlTriggerType] = useState<"distance" | "pnl">("distance");
  const [showTpDropdown, setShowTpDropdown] = useState(false);
  const [showSlDropdown, setShowSlDropdown] = useState(false);
  const [isSlInvalidDueToLiquidation, setIsSlInvalidDueToLiquidation] = useState(false);
  const { addTPSL, settingTPSL } = usePositionActions();
  const { formatPairPrice, getPrecision } = usePairPrecision();
  
  // Get pair-specific precision settings
  const pairPrecision = useMemo(() => {
    return getPrecision(position.symbol);
  }, [position.symbol, getPrecision]);
  
  // Calculate step value based on pair precision
  const priceStep = useMemo(() => {
    return `0.${"0".repeat(pairPrecision.maxDecimals - 1)}1`;
  }, [pairPrecision]);

  const getNumericValue = (value: string) => {
    return parseFloat(value.replace(/[^0-9.-]/g, ""));
  };

  // Function to determine the color class based on liquidation proximity
  const getLiquidationProximityColor = () => {
    const markPrice = position.markPrice;
    const entryPrice = position.entryPrice;
    // Ensure liquidationPrice is parsed correctly
    const liquidationPrice = getNumericValue(position.liquidationPrice);

    // Handle potential invalid liquidation price
    if (isNaN(liquidationPrice)) {
        return "text-gray-400"; // Default or error color
    }

    const totalDistance = Math.abs(entryPrice - liquidationPrice);
    const currentDistance = Math.abs(entryPrice - markPrice);

    // Avoid division by zero if entry and liquidation prices are the same
    if (totalDistance === 0) {
        // If mark price is also the same, low risk. Otherwise, high risk.
        return markPrice === entryPrice ? "text-white" : "text-red-500";
    }

    let proximityPercent = (currentDistance / totalDistance) * 100;

    // Ensure proximity is within expected bounds based on position direction
    if (position.isLong) {
      // Long position: Liquidation if price drops (markPrice < entryPrice)
      // If markPrice > entryPrice, proximity should be considered 0% or negative (safe side)
      if (markPrice >= entryPrice) proximityPercent = 0;
      // If markPrice < liquidationPrice, position should be liquidated, max risk
      else if (markPrice <= liquidationPrice) proximityPercent = 100;
    } else {
      // Short position: Liquidation if price rises (markPrice > entryPrice)
      // If markPrice < entryPrice, proximity should be considered 0% or negative (safe side)
      if (markPrice <= entryPrice) proximityPercent = 0;
      // If markPrice > liquidationPrice, position should be liquidated, max risk
      else if (markPrice >= liquidationPrice) proximityPercent = 100;
    }

    // Clamp percentage between 0 and 100
    proximityPercent = Math.max(0, Math.min(100, proximityPercent));

    // Apply color based on thresholds
    if (proximityPercent < 33) {
      return "text-white"; // 0% - 33%
    } else if (proximityPercent < 66) {
      return "text-yellow-500"; // 33% - 66%
    } else if (proximityPercent < 80) {
      return "text-orange-500"; // 66% - 80%
    } else {
      return "text-red-500"; // 80% - 100%
    }
  };

  // Function to check if SL is beyond liquidation
  const checkSlValidity = (): boolean => {
    if (!slPrice) return false; // No SL price set, so not invalid yet
    const slNumeric = parseFloat(slPrice);
    if (isNaN(slNumeric)) return false; // Invalid input
    const liquidationNumeric = getNumericValue(position.liquidationPrice);
    
    // Return true if invalid (SL beyond liquidation)
    return position.isLong ? 
      slNumeric <= liquidationNumeric : 
      slNumeric >= liquidationNumeric;
  };
  
  // Effect to update SL validity state when SL price changes
  useEffect(() => {
    setIsSlInvalidDueToLiquidation(checkSlValidity());
  }, [slPrice, position.liquidationPrice, position.isLong]); // Dependencies

  // Keep the old function name for isSubmitDisabled compatibility
  const isStopLossBelowLiquidation = (): boolean => {
    return checkSlValidity();
  };

  const calculatePnL = (targetPrice: string) => {
    if (!targetPrice) return 0;
    const price = parseFloat(targetPrice);
    const entryPrice = position.entryPrice;
    const size = getNumericValue(position.size);
    
    // Calculate the percentage change in price
    const priceChangePercent = ((price - entryPrice) / entryPrice) * 100;
    
    // Calculate PnL based on the direction of the position
    const pnlPercent = position.isLong ? priceChangePercent : -priceChangePercent;
    
    // Get margin value
    const margin = getNumericValue(position.margin);
    
    // Calculate actual PnL amount
    return (pnlPercent / 100) * margin * (size / margin);
  };

  // Calculate price based on distance percentage
  const calculatePriceFromDistance = (distance: string, isTP: boolean) => {
    if (!distance) return "";
    
    const distanceValue = parseFloat(distance);
    const entryPrice = position.entryPrice;
    
    let newPrice;
    if (isTP) {
      // For take profit
      newPrice = position.isLong 
        ? entryPrice * (1 + distanceValue / 100) 
        : entryPrice * (1 - distanceValue / 100);
    } else {
      // For stop loss
      newPrice = position.isLong 
        ? entryPrice * (1 - distanceValue / 100) 
        : entryPrice * (1 + distanceValue / 100);
    }
    
    return newPrice.toFixed(pairPrecision.maxDecimals);
  };

  // Handle TP distance change
  const handleTpDistanceChange = (distance: string) => {
    setTpDistance(distance);
    const newPrice = calculatePriceFromDistance(distance, true);
    setTpPrice(newPrice);
    
    // Calculate gain percentage based on the new price
    if (newPrice) {
      const gainPercentage = calculateGainPercentage(newPrice);
      setTpGain(gainPercentage.toFixed(2));
    }
  };

  // Handle SL distance change
  const handleSlDistanceChange = (distance: string) => {
    setSlDistance(distance);
    const newPrice = calculatePriceFromDistance(distance, false);
    setSlPrice(newPrice);
    
    // Calculate loss percentage based on the new price
    if (newPrice) {
      const lossPercentage = Math.abs(calculateGainPercentage(newPrice));
      setSlLoss(lossPercentage.toFixed(2));
    }
  };

  const calculateGainPercentage = (targetPrice: string) => {
    if (!targetPrice) return 0;
    const pnl = calculatePnL(targetPrice);
    const margin = getNumericValue(position.margin);
    return (pnl / margin) * 100;
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
      
      // Update distance value
      setTpDistance(Math.abs(percentageDiff).toFixed(2));
      
      // Store price with proper formatting
      setTpPrice(priceStr);
      setTpGain(gainPercentage.toFixed(2));
    } else {
      // Calculate percentage price difference from entry
      const percentageDiff = ((price - position.entryPrice) / position.entryPrice) * 100;
      // Multiply by leverage to get actual loss percentage on margin
      const lossPercentage = position.isLong ? 
        -percentageDiff * leverage : 
        percentageDiff * leverage;
      
      // Update distance value
      setSlDistance(Math.abs(percentageDiff).toFixed(2));
      
      // Store price with proper formatting
      setSlPrice(priceStr);
      setSlLoss(Math.abs(lossPercentage).toFixed(2));
    }
  };

  // Calculate price based on P&L amount
  const calculatePriceFromPnL = (pnlAmount: string, isTP: boolean) => {
    // Return empty if input is invalid or zero
    if (!pnlAmount || pnlAmount === "0") return ""; 
    const pnlValueInput = parseFloat(pnlAmount);
    if (isNaN(pnlValueInput) || pnlValueInput === 0) return ""; 

    const size = getNumericValue(position.size);
    const entryPrice = position.entryPrice;
    
    // Determine the sign of the target P&L based on TP/SL
    // User enters positive values for both TP gain and SL loss amount.
    // For calculation, SL target PNL should be negative.
    const targetPnl = isTP ? pnlValueInput : -pnlValueInput;
    
    // Calculate the required price using the correct formula derived from PNL definition:
    // PNL = [ ((ExitPrice - EntryPrice) / EntryPrice) * (isLong ? 1 : -1) ] * Size
    // Solving for ExitPrice (newPrice):
    let newPrice = entryPrice * (1 + (targetPnl / size) * (position.isLong ? 1 : -1));

    // Prevent negative prices
    if (newPrice <= 0) {
      console.warn("Calculated target price is zero or negative based on P&L input.");
      return ""; // Indicate invalid calculation result
    }
    
    return newPrice.toFixed(pairPrecision.maxDecimals);
  };

  // Handle TP P&L change
  const handleTpPnlChange = (pnl: string) => {
    setTpPnl(pnl);
    const newPrice = calculatePriceFromPnL(pnl, true);
    setTpPrice(newPrice);
    
    // Calculate gain percentage
    if (newPrice) {
      const gainPercentage = calculateGainPercentage(newPrice);
      setTpGain(gainPercentage.toFixed(2));
      // Calculate corresponding distance
      const percentageDiff = ((parseFloat(newPrice) - position.entryPrice) / position.entryPrice) * 100;
      setTpDistance(Math.abs(percentageDiff).toFixed(2));
    }
  };

  // Handle SL P&L change
  const handleSlPnlChange = (pnl: string) => {
    setSlPnl(pnl);
    const newPrice = calculatePriceFromPnL(pnl, false);
    setSlPrice(newPrice);
    
    // Calculate loss percentage
    if (newPrice) {
      const lossPercentage = Math.abs(calculateGainPercentage(newPrice));
      setSlLoss(lossPercentage.toFixed(2));
      // Calculate corresponding distance
      const percentageDiff = ((parseFloat(newPrice) - position.entryPrice) / position.entryPrice) * 100;
      setSlDistance(Math.abs(percentageDiff).toFixed(2));
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
      parseFloat(tpDistance),
      parseFloat(slDistance)
    );

    onClose();
  };

  // Calculate estimated maximum profit
  const calculateEstimatedMaxProfit = () => {
    if (!tpPrice) return "0.00";
    const pnl = calculatePnL(tpPrice);
    return pnl.toFixed(2);
  };

  // Calculate estimated maximum loss
  const calculateEstimatedMaxLoss = () => {
    if (!slPrice) return "0.00";
    const pnl = calculatePnL(slPrice);
    return pnl.toFixed(2);
  };

  const isSubmitDisabled = (): boolean => {
    // Condition 1: Disable if an order is currently being placed
    if (settingTPSL[position.id]) {
      // console.log("Submit Disabled: Order placement in progress.");
      return true;
    }

    // Condition 2: Disable if neither TP nor SL price/value is set
    const isTpSet = !!tpPrice || (tpTriggerType === 'pnl' && !!tpPnl);
    // Use slPrice state directly for SL check now
    const isSlSet = !!slPrice; 
    if (!isTpSet && !isSlSet) {
      // console.log("Submit Disabled: No TP or SL value set.");
      return true;
    }
    
    // Condition 3: Disable if SL is invalid due to liquidation
    // This now covers distance > 90%, PNL > margin implicitly if they result in an invalid price
    if (isSlInvalidDueToLiquidation) {
      // console.log("Submit Disabled: SL is invalid due to liquidation.");
      return true;
    }

    // Removed previous conditions 3 & 4 as they are covered by the liquidation check

    // If none of the above conditions are met, the button should be enabled
    // console.log("Submit Enabled: Conditions met.");
    return false;
  };

  // Calculate leverage
  const calculateLeverage = () => {
    const size = getNumericValue(position.size);
    const margin = getNumericValue(position.margin);
    // Add check for margin being zero to avoid NaN/Infinity
    if (margin === 0) return 0;
    return Math.round(size / margin);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 border sm:max-w-md bg-background">
        <div className="w-full text-white rounded-lg overflow-hidden">
          <div className="p-4 pb-0">
            <h2 className="text-lg font-medium mb-4">Take profit / Stop loss</h2>

            <div className="bg-secondary rounded-md p-3 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-white font-medium">{position.symbol}</span>
                </div>
                <div>
                  <span className={`${position.isLong ? "bg-[var(--long-color)] bg-opacity-20 text-long" : "bg-[var(--short-color)] bg-opacity-20 text-short"} font-medium px-2 py-0.5 rounded`}>
                    {position.isLong ? "LONG" : "SHORT"} {calculateLeverage()}x
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <div className="text-xs text-gray-400">Est. Current PnL</div>
                  <div>
                    <span className="text-white">{position.pnl}</span>{' '}
                    <span className={getNumericValue(position.pnl) >= 0 ? "text-long" : "text-short"}>
                      ({position.pnlPercentage.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 text-right">Size</div>
                  <div className="text-white text-right">
                    {position.size.replace(" USDC", "")} <span className="text-gray-400">USDC</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Margin</div>
                  <div className="text-white">
                    {position.margin.replace(" USDC", "")} <span className="text-gray-400">USDC</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 text-right">Liquidation Price</div>
                  {/* Apply dynamic color class */}
                  <div className={`${getLiquidationProximityColor()} text-right`}>
                    ${formatPairPrice(position.symbol, getNumericValue(position.liquidationPrice))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Entry Price</div>
                  <div className="text-white">
                    ${formatPairPrice(position.symbol, position.entryPrice)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 text-right">Market Price</div>
                  <div className="text-white text-right">
                    ${formatPairPrice(position.symbol, position.markPrice)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Take profit section */}
          <div className="p-4 pb-2">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <span className="text-gray-400">Take profit</span>
                <ChevronDown className="h-4 w-4 text-gray-400 ml-1" />
              </div>
              <div className="relative">
                <div 
                  className="flex items-center cursor-pointer" 
                  onClick={() => setShowTpDropdown(!showTpDropdown)}
                >
                  <span className="text-sm text-[var(--primary-color)]">
                    {tpTriggerType === "distance" ? "Trigger by distance" : "Trigger by P&L"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400 ml-1" />
                </div>
                {showTpDropdown && (
                  <div className="absolute right-0 top-full mt-1 bg-secondary rounded-md shadow-lg z-10">
                    <div 
                      className="py-2 px-4 hover:bg-accent cursor-pointer"
                      onClick={() => {
                        setTpTriggerType("distance");
                        setShowTpDropdown(false);
                      }}
                    >
                      Trigger by distance
                    </div>
                    <div 
                      className="py-2 px-4 hover:bg-accent cursor-pointer"
                      onClick={() => {
                        setTpTriggerType("pnl");
                        setShowTpDropdown(false);
                      }}
                    >
                      Trigger by P&L
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 mb-2">
              <div className="col-span-7">
                <div className="text-gray-400 text-xs mb-1">Trigger</div>
                <div className="flex bg-secondary rounded-md overflow-hidden">
                  <div className="bg-secondary px-3 py-2 text-gray-400">$</div>
                  <input
                    type="text"
                    value={tpPrice}
                    onChange={(e) => handlePriceChange(e.target.value, true)}
                    className="bg-transparent flex-1 p-2 outline-none"
                    step={priceStep}
                  />
                </div>
              </div>
              <div className="col-span-5">
                <div className="text-gray-400 text-xs mb-1">
                  {tpTriggerType === "distance" ? "Entry distance (%)" : "Target P&L"}
                </div>
                <div className="flex bg-secondary rounded-md overflow-hidden">
                  <div className="bg-secondary px-3 py-2 text-white">
                    {tpTriggerType === "distance" ? "+" : "$"}
                  </div>
                  <input
                    type="text"
                    value={tpTriggerType === "distance" ? tpDistance : tpPnl}
                    onChange={(e) => tpTriggerType === "distance" 
                      ? handleTpDistanceChange(e.target.value) 
                      : handleTpPnlChange(e.target.value)}
                    className="bg-transparent flex-1 p-2 outline-none"
                    placeholder={tpTriggerType === "distance" ? "Percentage" : "Amount"}
                  />
                  <div className={`bg-secondary px-3 py-2 ${tpTriggerType === "distance" ? "text-white font-medium" : "text-gray-400"}`}>
                    {tpTriggerType === "distance" ? "%" : ""}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between text-xs mb-4">
              <span className="text-gray-400">
                {tpTriggerType === "distance" ? "Est. maximum profit" : "Est. percentage profit"}
              </span>
              <span className="text-long">
                {tpTriggerType === "distance" 
                  ? `+${calculateEstimatedMaxProfit()} USD` 
                  : `+${tpGain}%`}
              </span>
            </div>
          </div>

          {/* Stop loss section */}
          <div className="p-4 pb-2">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <span className="text-gray-400">Stop loss</span>
                <ChevronDown className="h-4 w-4 text-gray-400 ml-1" />
              </div>
              <div className="relative">
                <div 
                  className="flex items-center cursor-pointer" 
                  onClick={() => setShowSlDropdown(!showSlDropdown)}
                >
                  <span className="text-sm text-[var(--primary-color)]">
                    {slTriggerType === "distance" ? "Trigger by distance" : "Trigger by P&L"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400 ml-1" />
                </div>
                {showSlDropdown && (
                  <div className="absolute right-0 top-full mt-1 bg-secondary rounded-md shadow-lg z-10">
                    <div 
                      className="py-2 px-4 hover:bg-accent cursor-pointer"
                      onClick={() => {
                        setSlTriggerType("distance");
                        setShowSlDropdown(false);
                      }}
                    >
                      Trigger by distance
                    </div>
                    <div 
                      className="py-2 px-4 hover:bg-accent cursor-pointer"
                      onClick={() => {
                        setSlTriggerType("pnl");
                        setShowSlDropdown(false);
                      }}
                    >
                      Trigger by P&L
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 mb-2">
              <div className="col-span-7">
                <div className="text-gray-400 text-xs mb-1">Trigger</div>
                <div className={`flex bg-secondary rounded-md overflow-hidden border ${isSlInvalidDueToLiquidation ? 'border-red-500' : 'border-transparent'}`}>
                  <div className="bg-secondary px-3 py-2 text-gray-400">$</div>
                  <input
                    type="text"
                    value={slPrice}
                    onChange={(e) => handlePriceChange(e.target.value, false)}
                    className="bg-transparent flex-1 p-2 outline-none"
                    step={priceStep}
                  />
                </div>
              </div>
              <div className="col-span-5">
                <div className="text-gray-400 text-xs mb-1">
                  {slTriggerType === "distance" ? "Entry distance (%)" : "Target P&L"}
                </div>
                <div className="flex bg-secondary rounded-md overflow-hidden">
                  <div className="bg-secondary px-3 py-2 text-white">
                    {slTriggerType === "distance" ? "-" : "$"}
                  </div>
                  <input
                    type="text"
                    value={slTriggerType === "distance" ? slDistance : slPnl}
                    onChange={(e) => slTriggerType === "distance" 
                      ? handleSlDistanceChange(e.target.value) 
                      : handleSlPnlChange(e.target.value)}
                    className="bg-transparent flex-1 p-2 outline-none"
                    placeholder={slTriggerType === "distance" ? "Percentage" : "Amount"}
                  />
                  <div className={`bg-secondary px-3 py-2 ${slTriggerType === "distance" ? "text-white font-medium" : "text-gray-400"}`}>
                    {slTriggerType === "distance" ? "%" : ""}
                  </div>
                </div>
              </div>
            </div>

            {isSlInvalidDueToLiquidation && (
              <div className="text-xs text-red-500 mb-2">
                Liquidation may occur before stop loss is hit. Adjust SL price.
              </div>
            )}

            <div className="flex justify-between text-xs mb-4">
              <span className="text-gray-400">
                {slTriggerType === "distance" ? "Est. maximum loss" : "Est. percentage loss"}
              </span>
              <span className="text-short">
                {slTriggerType === "distance" 
                  ? `-${Math.abs(parseFloat(calculateEstimatedMaxLoss())).toFixed(2)} USD` 
                  : `-${slLoss}%`}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="p-4 grid grid-cols-2 gap-3">
            <button
              // Change Cancel button style: Outline using secondary color border
              className="border border-secondary text-gray-300 py-3 px-4 rounded-md hover:bg-secondary/50 transition-colors"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              // Confirm button: Primary color when enabled, Secondary (grey) when disabled
              className={`py-3 px-4 rounded-md transition-colors ${
                isSubmitDisabled()
                  ? "bg-secondary text-gray-500 cursor-not-allowed" // Disabled state: Grey background
                  // DEBUGGING: Temporarily use green for enabled state
                  : "bg-green-500 text-white hover:bg-green-600" 
              }`}
              onClick={handleSubmit}
              disabled={isSubmitDisabled()}
              type="button"
            >
              {settingTPSL[position.id] ? "Placing Order..." : "Confirm"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
