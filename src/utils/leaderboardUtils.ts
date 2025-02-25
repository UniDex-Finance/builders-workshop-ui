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
  isQualifying: boolean
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
    const maxCollateral = Number(trade.maxCollateral)

    console.log(`Processing trade for ${user}:`, {
      pnl,
      size,
      maxCollateral
    });

    // Track all trades for score calculation
    acc[user].validTrades.push({
      pnl,
      maxCollateral,
      returnPercentage: (pnl / maxCollateral) * 100
    })

    // Accumulate stats
    acc[user].pnl += pnl
    acc[user].volume += size
    acc[user].trades += 1
    acc[user].totalCollateral += maxCollateral
    acc[user].maxCollateral = Math.max(acc[user].maxCollateral, maxCollateral)
    acc[user].tradeCount += 1
    acc[user].collateralSum += maxCollateral

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
      maxCollateral: number
      returnPercentage: number
    }>
  }>)

  console.log('Trader stats after processing:', traderStats);

  // Process all traders
  const allTraders = Object.values(traderStats)
    .map(trader => {
      const avgCollateral = trader.collateralSum / trader.tradeCount
      
      // Calculate score as average return percentage across all trades
      const score = trader.validTrades.reduce((sum, trade) => 
        sum + trade.returnPercentage, 0
      ) / trader.validTrades.length

      // Check if trader qualifies (at least 3 trades AND $50+ positive PnL)
      const isQualifying = trader.validTrades.length >= 3 && trader.pnl >= 50;

      console.log(`Processed trader ${trader.trader}:`, {
        trades: trader.validTrades.length,
        totalPnl: trader.pnl,
        avgCollateral,
        score,
        isQualifying
      });

      return {
        trader: trader.trader,
        pnl: Number(trader.pnl.toFixed(2)),
        volume: Number(trader.volume.toFixed(2)),
        trades: trader.validTrades.length,
        collateral: Number(trader.maxCollateral.toFixed(2)),
        avgCollateral: Number(avgCollateral.toFixed(2)),
        score: Number(score.toFixed(2)),
        isQualifying
      }
    });

  // Filter and sort qualifying traders to determine ranks
  const qualifyingTraders = allTraders
    .filter(trader => trader.isQualifying)
    .sort((a, b) => b.score - a.score);

  // Assign ranks to qualifying traders
  const rankMap = new Map();
  qualifyingTraders.forEach((trader, index) => {
    rankMap.set(trader.trader, {
      rank: index + 1,
      prize: PRIZE_DISTRIBUTION[index + 1 as keyof typeof PRIZE_DISTRIBUTION],
    });
  });

  // Sort all traders by score
  return allTraders
    .sort((a, b) => b.score - a.score)
    .map(trader => {
      const rankInfo = rankMap.get(trader.trader) || { rank: 0, prize: undefined };
      return {
        ...trader,
        rank: rankInfo.rank,
        prize: rankInfo.prize,
      }
    });
} 