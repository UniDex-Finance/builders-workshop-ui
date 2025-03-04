import React, { useEffect, useState } from "react";
import { Input } from "../../../../ui/input";
import { Slider } from "../../../../ui/slider";
import { Button } from "../../../../ui/button";
import { OrderFormState } from "../types";
import TPSLInputSection from "./TPSLInputSection";

interface LimitOrderFormProps {
  formState: OrderFormState;
  calculatedMargin: number;
  handleAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleMarginChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLimitPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSliderChange: (value: number[]) => void;
  toggleTPSL: () => void;
  handleTakeProfitChange: (value: string) => void;
  handleStopLossChange: (value: string) => void;
  leverage: string;
  onLeverageChange: (value: string) => void;
}

export function LimitOrderForm({
  formState,
  calculatedMargin,
  handleAmountChange,
  handleMarginChange,  // Add this
  handleLimitPriceChange,
  handleSliderChange,
  toggleTPSL,
  handleTakeProfitChange,
  handleStopLossChange,
  leverage,
  onLeverageChange,
}: LimitOrderFormProps) {
  const [tempLeverage, setTempLeverage] = useState(leverage);

  useEffect(() => {
    setTempLeverage(leverage);
  }, [leverage]);

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {/* Limit Price input */}
        <div className="relative">
          <Input
            type="number"
            placeholder="0"
            value={formState.limitPrice || ''}
            onChange={handleLimitPriceChange}
            className="pr-10 text-right no-spinners"
            label="Limit Price"
            suppressHydrationWarning
          />
          <div className="absolute text-sm -translate-y-1/2 right-3 top-1/2 text-muted-foreground">
            USD
          </div>
        </div>
        
        {/* Grid for Size and Margin inputs */}
        <div className="grid grid-cols-2 gap-2">
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
              value={calculatedMargin ? Number(calculatedMargin.toFixed(2)).toString() : ''}
              onChange={handleMarginChange}
              className="pr-10 text-right no-spinners"
              label="Margin"
              suppressHydrationWarning
            />
            <div className="absolute text-sm -translate-y-1/2 right-3 top-1/2 text-muted-foreground">
              USD
            </div>
          </div>
        </div>

        {/* Replace slider with percentage buttons */}
        <div className="grid grid-cols-4 gap-2">
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

        <div className="pt-2 space-y-4">
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
            <div className="relative w-full">
              <div className="absolute w-full h-full">
                <div className="absolute left-0 -translate-x-[1px] w-[2px] h-full" style={{ backgroundColor: '#1a1a1f' }}></div>
                <div className="absolute left-[25%] -translate-x-[1px] w-[2px] h-full" style={{ backgroundColor: '#1a1a1f' }}></div>
                <div className="absolute left-[50%] -translate-x-[1px] w-[2px] h-full" style={{ backgroundColor: '#1a1a1f' }}></div>
                <div className="absolute left-[75%] -translate-x-[1px] w-[2px] h-full" style={{ backgroundColor: '#1a1a1f' }}></div>
                <div className="absolute right-0 translate-x-[1px] w-[2px] h-full" style={{ backgroundColor: '#1a1a1f' }}></div>
              </div>
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
            </div>
            <div className="relative w-full h-4">
              <div className="absolute left-0 text-xs -translate-x-1/2 text-muted-foreground">1x</div>
              <div className="absolute left-[25%] -translate-x-1/2 text-xs text-muted-foreground">25x</div>
              <div className="absolute left-[50%] -translate-x-1/2 text-xs text-muted-foreground">50x</div>
              <div className="absolute left-[75%] -translate-x-1/2 text-xs text-muted-foreground">75x</div>
              <div className="absolute right-0 text-xs translate-x-1/2 text-muted-foreground">100x</div>
            </div>
          </div>
        </div>

        {/* TP/SL Section */}
        <TPSLInputSection
          enabled={formState.tpslEnabled}
          takeProfit={formState.takeProfit}
          stopLoss={formState.stopLoss}
          entryPrice={Number(formState.limitPrice) || 0}
          isLong={formState.isLong}
          onTakeProfitChange={handleTakeProfitChange}
          onStopLossChange={handleStopLossChange}
          toggleTPSL={toggleTPSL}
        />
      </div>
    </div>
  );
}
