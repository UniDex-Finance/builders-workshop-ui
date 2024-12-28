import { CardContent } from "@/components/ui/card"
import * as HoverCard from '@radix-ui/react-hover-card'
import { useVaultBreakdown } from "@/hooks/use-vault-breakdown"
import { ExternalLink, Sparkles } from "lucide-react"
import Image from "next/image"

export function UsdmAssetBreakdown() {
  const { data: assetData, isLoading } = useVaultBreakdown()

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  if (isLoading) {
    return (
      <CardContent className="py-6">
        <div className="text-center text-muted-foreground">Loading asset breakdown...</div>
      </CardContent>
    )
  }

  if (!assetData) {
    return (
      <CardContent className="py-6">
        <div className="text-center text-muted-foreground">No asset data available</div>
      </CardContent>
    )
  }

  return (
    <CardContent className="py-6">
      {/* Progress Bar */}
      <div className="flex w-full h-4 mb-6 overflow-hidden rounded-lg bg-[#1f1f29]">
        {assetData.assets.map((assetType, index) => (
          <HoverCard.Root key={assetType.type} openDelay={0} closeDelay={0}>
            <HoverCard.Trigger asChild>
              <div
                className={`h-full transition-all duration-300 cursor-help hover:opacity-80 ${
                  assetType.type === "Rehypothecation" ? "rehypothecation-bar" : ""
                }`}
                style={{
                  width: `${assetType.percentage}%`,
                  background: assetType.type === "Rehypothecation" 
                    ? "var(--rehypothecation-gradient)"
                    : assetType.color,
                  borderRight: index < assetData.assets.length - 1 ? '2px solid #16161D' : 'none'
                }}
              />
            </HoverCard.Trigger>
            <HoverCard.Portal>
              <HoverCard.Content
                side="top"
                align="center"
                sideOffset={5}
                className="z-50 w-80 p-3 rounded-md shadow-lg border border-border/40 bg-[var(--position-cards-background)]/95 backdrop-blur-md text-[13px] text-foreground/90"
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
                          <span>{formatValue(asset.value)}</span>
                          <span className="text-muted-foreground">({asset.percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between pt-2 font-medium border-t border-border/40">
                    <span>Total Value</span>
                    <span>{formatValue(assetType.totalValue)}</span>
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
                  className={`w-2 h-2 rounded-full ${
                    assetType.type === "Rehypothecation" ? "rehypothecation-dot" : ""
                  }`}
                  style={{ 
                    background: assetType.type === "Rehypothecation"
                      ? "var(--rehypothecation-gradient)"
                      : assetType.color
                  }}
                />
                <div className="flex items-center gap-1">
                  <HoverCard.Root openDelay={0} closeDelay={0}>
                    <HoverCard.Trigger asChild>
                      <span className="font-medium cursor-help">{assetType.type}</span>
                    </HoverCard.Trigger>
                    <HoverCard.Portal>
                      <HoverCard.Content
                        side="top"
                        align="center"
                        sideOffset={5}
                        className="z-50 w-80 p-3 rounded-md shadow-lg border border-border/40 bg-[var(--position-cards-background)]/95 backdrop-blur-md text-[13px] text-foreground/90"
                      >
                        <div className="text-muted-foreground">
                          {assetType.type === "Stablecoins" 
                            ? "Assets natively deposited into the market making vault"
                            : "Idle liquidity is rehypothecated into various protocols to earn extra yield for vault depositors"
                          }
                        </div>
                        <HoverCard.Arrow className="fill-[var(--position-cards-background)]/80" />
                      </HoverCard.Content>
                    </HoverCard.Portal>
                  </HoverCard.Root>
                  {assetType.type === "Rehypothecation" && (
                    <Sparkles 
                      className="w-4 h-4 text-yellow-500 animate-twinkle" 
                      style={{ 
                        filter: "drop-shadow(0 0 2px rgba(234, 179, 8, 0.3))"
                      }}
                    />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-medium text-right">{formatValue(assetType.totalValue)}</span>
                <span className="w-16 text-right text-muted-foreground">{assetType.percentage.toFixed(1)}%</span>
              </div>
            </div>

            {/* Individual Assets */}
            <div className="pl-4 space-y-1">
              {assetType.assets.map((asset) => (
                <div key={asset.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground flex items-center gap-1">
                      {asset.name.includes("Circle") ? "Circle: " : "AaveV3: "}
                      <Image
                        src={asset.name.includes("Circle") ? "/static/images/commons/usdc.svg" : "/static/images/commons/ausdc.webp"}
                        alt={asset.name.includes("Circle") ? "USDC" : "aUSDC"}
                        width={16}
                        height={16}
                        className="inline-block relative top-[-1px]"
                      />
                      {asset.name.includes("Circle") ? "USDC" : "aUSDC"}
                      <a
                        href={asset.name === "Circle: USDC" 
                          ? "https://arbiscan.io/token/0xaf88d065e77c8cc2239327c5edb3a432268e5831"
                          : "https://arbiscan.io/address/0x724dc807b04555b71ed48a6896b6f41593b8c637"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center opacity-50 hover:opacity-100 transition-opacity"
                      >
                        <ExternalLink className="w-[10px] h-[10px] ml-0.5 relative top-[-1px]" />
                      </a>
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-right">{formatValue(asset.value)}</span>
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