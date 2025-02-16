import { TradeItem } from '../hooks/useLeaderboardData'

export interface ProcessedTraderData {
  rank: number
  trader: string
  pnl: number
  volume: number
  prize?: number
  trades: number
  collateral: number
  avgCollateral: number
  score: number
}

const PRIZE_DISTRIBUTION = {
  1: 3500,
  2: 1000,
  3: 500,
}

export const processLeaderboardData = (rawData: TradeItem[]): ProcessedTraderData[] => {
  console.log('Raw data received:', rawData);

  // Group trades by user and track individual trade performances
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
        collateralSum: 0,
        validTrades: [],
      }
    }

    // Parse values
    const pnl = Number(trade.pnl)
    const size = Number(trade.size)
    const collateral = Number(trade.collateral)

    console.log(`Processing trade for ${user}:`, {
      pnl,
      size,
      collateral
    });

    // Track all trades for score calculation
    acc[user].validTrades.push({
      pnl,
      collateral,
      returnPercentage: (pnl / collateral) * 100
    })

    // Accumulate stats
    acc[user].pnl += pnl
    acc[user].volume += size
    acc[user].trades += 1
    acc[user].totalCollateral += collateral
    acc[user].maxCollateral = Math.max(acc[user].maxCollateral, collateral)
    acc[user].tradeCount += 1
    acc[user].collateralSum += collateral

    return acc
  }, {} as Record<string, {
    trader: string
    pnl: number
    volume: number
    trades: number
    totalCollateral: number
    maxCollateral: number
    tradeCount: number
    collateralSum: number
    validTrades: Array<{
      pnl: number
      collateral: number
      returnPercentage: number
    }>
  }>)

  console.log('Trader stats after processing:', traderStats);

  // Process and sort traders
  const sortedTraders = Object.values(traderStats)
    // Filter traders with at least 3 trades AND minimum $50 total PnL
    .filter(trader => {
      console.log(`Trader ${trader.trader} has ${trader.validTrades.length} trades and total PnL of $${trader.pnl}`);
      return trader.validTrades.length >= 3 && Math.abs(trader.pnl) >= 5;
    })
    .map(trader => {
      const avgCollateral = trader.collateralSum / trader.tradeCount
      
      // Calculate score as average return percentage across all trades
      const score = trader.validTrades.reduce((sum, trade) => 
        sum + trade.returnPercentage, 0
      ) / trader.validTrades.length

      console.log(`Processed trader ${trader.trader}:`, {
        trades: trader.validTrades.length,
        totalPnl: trader.pnl,
        avgCollateral,
        score
      });

      return {
        trader: trader.trader,
        pnl: Number(trader.pnl.toFixed(2)),
        volume: Number(trader.volume.toFixed(2)),
        trades: trader.validTrades.length,
        collateral: Number(trader.maxCollateral.toFixed(2)),
        avgCollateral: Number(avgCollateral.toFixed(2)),
        score: Number(score.toFixed(2))
      }
    })
    .sort((a, b) => b.score - a.score)
    .map((trader, index) => ({
      ...trader,
      rank: index + 1,
      prize: PRIZE_DISTRIBUTION[index + 1 as keyof typeof PRIZE_DISTRIBUTION],
    }))

  console.log('Final sorted traders:', sortedTraders);
  return sortedTraders
} 