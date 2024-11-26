import React from "react";
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
  handleMarginChange, // Add this
  handleLimitPriceChange,
  handleSliderChange,
  toggleTPSL,
  handleTakeProfitChange,
  handleStopLossChange,
  leverage,
  onLeverageChange,
}: LimitOrderFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="relative">
          <Input
            type="number"
            placeholder="0.00"
            value={formState.amount || ""}
            onChange={handleAmountChange}
            className="text-right pr-10"
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
            placeholder="0.00"
            value={formState.limitPrice || ""}
            onChange={handleLimitPriceChange}
            className="text-right pr-10"
            label="Limit Price"
            suppressHydrationWarning
          />
          <div className="absolute text-sm -translate-y-1/2 right-3 top-1/2 text-muted-foreground">
            USD
          </div>
        </div>
        <div className="relative">
          <Input
            type="number"
            placeholder="0.00"
            value={calculatedMargin ? calculatedMargin.toFixed(2) : ""}
            onChange={handleMarginChange}
            className="text-right pr-10"
            label="Margin"
            suppressHydrationWarning
          />
          <div className="absolute text-sm -translate-y-1/2 right-3 top-1/2 text-muted-foreground">
            USD
          </div>
        </div>
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

        <div className="pt-2 space-y-4">
          {" "}
          {/* Changed from space-y-2 */}
          <div className="flex items-center justify-between">
            <span className="text-sm">Leverage:</span>
            <div className="relative w-16">
              <Input
                type="number"
                value={leverage || ""}
                onChange={(e) => {
                  const value = Math.min(
                    Math.max(1, Number(e.target.value)),
                    100
                  );
                  onLeverageChange(value.toString());
                }}
                className="text-sm text-center h-9 no-spinners" // Changed text-right to text-center
                suppressHydrationWarning
              />
            </div>
          </div>
          <div className="space-y-1">
            <Slider
              value={[Number(leverage)]}
              min={1}
              max={100}
              step={1}
              onValueChange={(value) => onLeverageChange(value[0].toString())}
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
