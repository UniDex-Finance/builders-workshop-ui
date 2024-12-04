interface LiquidationPriceParams {
  isLong: boolean
  entryPrice: number
  leverage: number
  marginValue: number
}

export function calculateLiquidationPrice({
  isLong,
  entryPrice,
  leverage,
  marginValue
}: LiquidationPriceParams): number {
  // At liquidation, PNL = -90% of margin
  const targetPnl = -marginValue * 0.9
  
  // Calculate required price movement percentage
  // PNL = Position Size * Price Movement %
  // Position Size = Margin * Leverage
  // Therefore: Price Movement % = PNL / (Margin * Leverage)
  const requiredPriceMovement = targetPnl / (marginValue * leverage)
  
  // For longs: price needs to go down to hit liquidation
  // For shorts: price needs to go up to hit liquidation
  const liquidationPrice = isLong
    ? entryPrice * (1 + requiredPriceMovement)
    : entryPrice * (1 - requiredPriceMovement)

  return liquidationPrice
} 