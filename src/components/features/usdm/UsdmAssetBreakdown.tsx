import { CardContent } from "@/components/ui/card"
import * as HoverCard from '@radix-ui/react-hover-card'

// Hardcoded data for now
const assetData = {
  totalValue: 302.63,
  assets: [
    {
      type: "Ether",
      totalValue: 239.30,
      percentage: 79.1,
      assets: [
        { name: "ETH", value: 32.87, percentage: 10.9 },
        { name: "wstETH", value: 143.51, percentage: 47.4 },
        { name: "wbETH", value: 41.27, percentage: 13.6 },
        { name: "apxETH", value: 21.65, percentage: 7.2 },
      ],
      color: "var(--main-accent)"
    },
    {
      type: "Stablecoins",
      totalValue: 63.33,
      percentage: 20.9,
      assets: [
        { name: "USDC", value: 61.73, percentage: 20.4 },
        { name: "USDT", value: 1.60, percentage: 0.5 },
      ],
      color: "var(--color-long-dark)"
    }
  ]
}

export function UsdmAssetBreakdown() {
  const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  return (
    <CardContent className="py-6">
      {/* Progress Bar */}
      <div className="flex w-full h-4 mb-6 overflow-hidden rounded-lg bg-[#1f1f29]">
        {assetData.assets.map((assetType, index) => (
          <HoverCard.Root key={assetType.type} openDelay={0} closeDelay={0}>
            <HoverCard.Trigger asChild>
              <div
                className="h-full transition-opacity cursor-help hover:opacity-80"
                style={{
                  width: `${assetType.percentage}%`,
                  backgroundColor: assetType.color,
                  borderRight: index < assetData.assets.length - 1 ? '2px solid #16161D' : 'none'
                }}
              />
            </HoverCard.Trigger>
            <HoverCard.Portal>
              <HoverCard.Content
                side="top"
                align="center"
                sideOffset={5}
                className="z-50 w-64 p-3 rounded-md shadow-lg border border-border/40 bg-[var(--position-cards-background)]/80 backdrop-blur-md text-[13px]"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-medium">
                    <span>{assetType.type}</span>
                    <span>{assetType.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="pt-2 space-y-1 border-t border-border/40">
                    {assetType.assets.map((asset) => (
                      <div key={asset.name} className="flex items-center justify-between">
                        <span className="text-muted-foreground">{asset.name}</span>
                        <div className="flex gap-2">
                          <span>{formatValue(asset.value)}M</span>
                          <span className="text-muted-foreground">({asset.percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between pt-2 font-medium border-t border-border/40">
                    <span>Total Value</span>
                    <span>{formatValue(assetType.totalValue)}M</span>
                  </div>
                </div>
                <HoverCard.Arrow className="fill-[var(--position-cards-background)]/80" />
              </HoverCard.Content>
            </HoverCard.Portal>
          </HoverCard.Root>
        ))}
      </div>

      {/* Asset Type List */}
      <div className="space-y-6">
        {assetData.assets.map((assetType) => (
          <div key={assetType.type} className="space-y-2">
            {/* Asset Type Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: assetType.color }}
                />
                <span className="font-medium">{assetType.type}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-medium text-right">${assetType.totalValue.toFixed(2)}M</span>
                <span className="w-16 text-right text-muted-foreground">{assetType.percentage.toFixed(1)}%</span>
              </div>
            </div>

            {/* Individual Assets */}
            <div className="pl-4 space-y-1">
              {assetType.assets.map((asset) => (
                <div key={asset.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{asset.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-right">${asset.value.toFixed(2)}M</span>
                    <span className="w-16 text-right text-muted-foreground">{asset.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  )
} 