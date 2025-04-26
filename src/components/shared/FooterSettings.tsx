import React from "react";
import { Pause, Play } from "lucide-react";
import { Switch } from "../../components/ui/switch";
import { Label } from "../../components/ui/label";

interface FooterSettingsProps {
  isPaused: boolean;
  setIsPaused: (value: boolean) => void;
  showPrice: boolean;
  setShowPrice: (value: boolean) => void;
}

export function FooterSettings({ 
  isPaused, 
  setIsPaused, 
  showPrice, 
  setShowPrice 
}: FooterSettingsProps) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-medium pb-2 text-foreground">Ticker Settings</div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          <Label htmlFor="pause-ticker" className="text-xs font-medium cursor-pointer">
            {isPaused ? "Resume scrolling" : "Pause scrolling"}
          </Label>
        </div>
        <Switch 
          id="pause-ticker" 
          checked={isPaused} 
          onCheckedChange={setIsPaused}
          className="data-[state=checked]:bg-[var(--main-accent)]"
        />
      </div>
      
      <div className="flex items-center justify-between">
        <Label htmlFor="show-price" className="text-xs font-medium cursor-pointer">
          Show prices
        </Label>
        <Switch 
          id="show-price" 
          checked={showPrice} 
          onCheckedChange={setShowPrice}
          className="data-[state=checked]:bg-[var(--main-accent)]"
        />
      </div>
      
      <div className="pt-1 mt-2 border-t border-border">
        <div className="text-xs text-muted-foreground">
          Additional footer settings will be available soon.
        </div>
      </div>
    </div>
  );
} 