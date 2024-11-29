import React from "react";
import { Input } from "@/components/ui/input";

interface TPSLInputProps {
  enabled: boolean;
  takeProfit: string | number;
  stopLoss: string | number;
  entryPrice: number;
  isLong: boolean;
  onTakeProfitChange: (value: string) => void;
  onStopLossChange: (value: string) => void;
  toggleTPSL: () => void;
}

const TPSLInputSection = ({
  enabled,
  takeProfit,
  stopLoss,
  entryPrice,
  isLong,
  onTakeProfitChange,
  onStopLossChange,
  toggleTPSL,
}: TPSLInputProps) => {
  // Calculate percentage from price based on position type
  const calculatePercentage = (price: number) => {
    if (!entryPrice || !price) return 0;
    const percentageChange = ((price - entryPrice) / entryPrice) * 100;

    // For short positions, invert the percentage
    return isLong ? percentageChange : -percentageChange;
  };

  // Calculate price from percentage based on position type
  const calculatePrice = (percentage: number) => {
    if (!entryPrice) return 0;
    // For short positions, invert the percentage
    const adjustedPercentage = isLong ? percentage : -percentage;
    return entryPrice * (1 + adjustedPercentage / 100);
  };

  // Handle TP price input
  const handleTPPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTakeProfitChange(e.target.value);
  };

  // Handle TP percentage input
  const handleTPPercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = parseFloat(e.target.value);
    const newPrice = calculatePrice(
      isLong ? Math.abs(percent) : -Math.abs(percent)
    ).toFixed(2);
    onTakeProfitChange(newPrice);
  };

  // Handle SL price input
  const handleSLPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onStopLossChange(e.target.value);
  };

  // Handle SL percentage input
  const handleSLPercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = parseFloat(e.target.value);
    const newPrice = calculatePrice(
      isLong ? -Math.abs(percent) : Math.abs(percent)
    ).toFixed(2);
    onStopLossChange(newPrice);
  };

  return (
    <div className="pt-4">
      <label className="flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={toggleTPSL}
          className="w-4 h-4"
        />
        <span className="text-sm">TP/SL?</span>
      </label>

      {enabled && (
        <div className="mt-2 space-y-2">
          {/* Take Profit Row */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Input
                type="number"
                placeholder="0.00"
                value={takeProfit}
                onChange={handleTPPriceChange}
                className="pr-10 text-right no-spinners"
                label="TP"
              />
              <div className="absolute text-sm -translate-y-1/2 right-3 top-1/2 text-muted-foreground">
                USD
              </div>
            </div>
            <div className="relative w-20">
              <Input
                type="number"
                value={Math.round(
                  Math.abs(calculatePercentage(Number(takeProfit)))
                )}
                onChange={handleTPPercentChange}
                className="pr-6 text-right no-spinners"
                placeholder="0"
                label=""
              />
              <div className="absolute text-sm -translate-y-1/2 right-2 top-1/2 text-muted-foreground">
                %
              </div>
            </div>
          </div>

          {/* Stop Loss Row */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Input
                type="number"
                placeholder="0.00"
                value={stopLoss}
                onChange={handleSLPriceChange}
                className="pr-10 text-right no-spinners"
                label="SL"
              />
              <div className="absolute text-sm -translate-y-1/2 right-3 top-1/2 text-muted-foreground">
                USD
              </div>
            </div>
            <div className="relative w-20">
              <Input
                type="number"
                value={Math.round(
                  Math.abs(calculatePercentage(Number(stopLoss)))
                )}
                onChange={handleSLPercentChange}
                className="pr-6 text-right no-spinners"
                placeholder="0"
                label=""
              />
              <div className="absolute text-sm -translate-y-1/2 right-2 top-1/2 text-muted-foreground">
                %
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TPSLInputSection;
