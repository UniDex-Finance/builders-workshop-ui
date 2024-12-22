import React, { useEffect, useState } from "react";
import { Input } from "../../../../ui/input";
import { Button } from "../../../../ui/button";
import { OrderFormState } from "../types";
import TPSLInputSection from "./TPSLInputSection";
import { Slider } from "../../../../ui/slider";

interface MarketOrderFormProps {
  formState: OrderFormState;
  calculatedMargin: number;
  handleAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSliderChange: (value: number[]) => void;
  toggleTPSL: () => void;
  handleTakeProfitChange: (value: string) => void; // Updated
  handleStopLossChange: (value: string) => void; // Updated
  handleMarginChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  leverage: string;
  onLeverageChange: (value: string) => void;
}

export function MarketOrderForm({
  formState,
  calculatedMargin,
  handleAmountChange,
  handleMarginChange,
  handleSliderChange,
  toggleTPSL,
  handleTakeProfitChange,
  handleStopLossChange,
  leverage,
  onLeverageChange,
}: MarketOrderFormProps) {
  const [tempLeverage, setTempLeverage] = useState(leverage);

  useEffect(() => {
    setTempLeverage(leverage);
  }, [leverage]);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="relative">
          <Input
            type="number"
            placeholder="0"
            value={formState.amount || ''}
            onChange={handleAmountChange}
            className="pr-10 text-right no-spinners"
            label="Size"
            suppressHydrationWarning
          />
          <div className="absolute text-sm -translate-y-1/2 right-3 top-1/2 text-muted-foreground">
            USD
          </div>
        </div>
        <div className="relative">
          <Input
            type="number"
            placeholder="0"
            value={calculatedMargin ? Number(calculatedMargin).toString() : ''}
            onChange={handleMarginChange}
            className="pr-10 text-right no-spinners"
            label="Margin"
            suppressHydrationWarning
          />
          <div className="absolute text-sm -translate-y-1/2 right-3 top-1/2 text-muted-foreground">
            USD
          </div>
        </div>

        {/* Replace slider with percentage buttons */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSliderChange([25])}
            className="w-full text-xs"
          >
            25%
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSliderChange([50])}
            className="w-full text-xs"
          >
            50%
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSliderChange([75])}
            className="w-full text-xs"
          >
            75%
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSliderChange([100])}
            className="w-full text-xs"
          >
            100%
          </Button>
        </div>

        <div className="pt-2 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px]">Leverage:</span>
            <div className="relative w-16">
              <Input
                type="number"
                value={tempLeverage || ''}
                onChange={(e) => {
                  const value = Math.min(Math.max(1, Number(e.target.value)), 100);
                  setTempLeverage(value.toString());
                  onLeverageChange(value.toString());
                }}
                className="h-8 text-sm text-center no-spinners"
                suppressHydrationWarning
              />
            </div>
          </div>
          <div className="space-y-1">
            <Slider
              value={[Number(tempLeverage)]}
              min={1}
              max={100}
              step={1}
              onValueChange={(value) => {
                setTempLeverage(value[0].toString());
              }}
              onValueCommit={(value) => {
                onLeverageChange(value[0].toString());
              }}
            />
            <div className="flex justify-between px-1 text-xs text-muted-foreground">
              <span>1x</span>
              <span>25x</span>
              <span>50x</span>
              <span>75x</span>
              <span>100x</span>
            </div>
          </div>
        </div>

        {/* New TP/SL Section using the TPSLInputSection component */}
        <TPSLInputSection
          enabled={formState.tpslEnabled}
          takeProfit={formState.takeProfit}
          stopLoss={formState.stopLoss}
          entryPrice={formState.entryPrice || 0}
          isLong={formState.isLong} // Add this line
          onTakeProfitChange={handleTakeProfitChange}
          onStopLossChange={handleStopLossChange}
          toggleTPSL={toggleTPSL}
        />
      </div>
    </div>
  );
}
