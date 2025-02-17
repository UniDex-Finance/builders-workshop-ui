interface LiquidationPriceParams {
  isLong: boolean
  entryPrice: number
  leverage: number
  marginValue: number
  totalFees?: number
}

export function calculateLiquidationPrice({
  isLong,
  entryPrice,
  leverage,
  marginValue,
  totalFees = 0
}: LiquidationPriceParams): number {
  // Adjust effective margin by subtracting accumulated fees
  const effectiveMargin = marginValue - totalFees
  
  // Liquidation occurs when remaining margin after fees reaches 10% of original margin
  const remainingMarginAtLiq = marginValue * 0.1
  const marginToLiq = effectiveMargin - remainingMarginAtLiq
  
  // Position size = margin * leverage
  const positionSize = marginValue * leverage
  
  // Required price movement to liquidation
  const requiredPriceMovement = marginToLiq / positionSize
  
  // For longs: price needs to go down to hit liquidation
  // For shorts: price needs to go up to hit liquidation
  const liquidationPrice = isLong
    ? entryPrice * (1 - requiredPriceMovement)
    : entryPrice * (1 + requiredPriceMovement)

  return Math.max(0, liquidationPrice)
} 