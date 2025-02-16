import { TradeItem } from '../hooks/useLeaderboardData'

export interface ProcessedTraderData {
  rank: number
  trader: string
  pnl: number
  volume: number
  prize?: number
  trades: number
  collateral: number
  roi: number
}

const PRIZE_DISTRIBUTION = {
  1: 3500,
  2: 1000,
  3: 500,
}

export const processLeaderboardData = (rawData: TradeItem[]): ProcessedTraderData[] => {
  // Group trades by user and calculate their stats
  const traderStats = rawData.reduce((acc, trade) => {
    const user = trade.user
    if (!acc[user]) {
      acc[user] = {
        trader: user,
        pnl: 0,
        volume: 0,
        trades: 0,
        totalCollateral: 0,
        maxCollateral: 0,
        tradeCount: 0,
      }
    }

    // Parse values
    const pnl = parseFloat(trade.pnl)
    const size = parseFloat(trade.size)
    const collateral = parseFloat(trade.collateral)
    const positionFee = parseFloat(trade.positionFee)

    // Accumulate stats
    acc[user].pnl += pnl
    acc[user].volume += size
    acc[user].trades += 1
    acc[user].totalCollateral += collateral
    acc[user].maxCollateral = Math.max(acc[user].maxCollateral, collateral)
    acc[user].tradeCount += 1

    return acc
  }, {} as Record<string, {
    trader: string
    pnl: number
    volume: number
    trades: number
    totalCollateral: number
    maxCollateral: number
    tradeCount: number
  }>)

  // Calculate average collateral across all traders
  const totalCollateralAllTraders = Object.values(traderStats).reduce(
    (sum, trader) => sum + trader.totalCollateral, 0
  )
  const averageCollateral = totalCollateralAllTraders / Object.keys(traderStats).length

  // Process and sort traders
  const sortedTraders = Object.values(traderStats)
    // Filter traders with at least 3 trades
    .filter(trader => trader.tradeCount >= 3)
    .map(trader => {
      // Calculate ROI using max of user's collateral or average collateral
      const denominator = Math.max(trader.maxCollateral, averageCollateral)
      const roi = denominator > 0 ? (trader.pnl / denominator) * 100 : 0

      return {
        trader: trader.trader,
        pnl: Number(trader.pnl.toFixed(2)),
        volume: Number(trader.volume.toFixed(2)),
        trades: trader.tradeCount,
        collateral: Number(trader.maxCollateral.toFixed(2)),
        roi: Number(roi.toFixed(2))
      }
    })
    // Sort by PnL
    .sort((a, b) => b.pnl - a.pnl)
    // Add rank and prize
    .map((trader, index) => ({
      ...trader,
      rank: index + 1,
      prize: PRIZE_DISTRIBUTION[index + 1 as keyof typeof PRIZE_DISTRIBUTION],
    }))

  return sortedTraders
} 