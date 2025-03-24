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
  pnlRank?: number
  pnlPrize?: number
  volumeRank?: number
  volumePrize?: number
}

export interface LeaderboardStats {
  totalVolume: number
  totalTraders: number
  totalTrades: number
  totalPnl: number
}

// Helper function to format dollar amounts with proper handling of negative values
export const formatDollarAmount = (amount: number, options?: Intl.NumberFormatOptions): string => {
  // Ensure we have a valid number to format
  if (isNaN(amount)) {
    return '$0.00';
  }
  
  // Create a safe options object with validated properties
  const safeOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  };
  
  // Apply custom options, but enforce valid ranges
  if (options) {
    if (typeof options.minimumFractionDigits === 'number') {
      safeOptions.minimumFractionDigits = Math.max(0, Math.min(20, options.minimumFractionDigits));
    }
    
    if (typeof options.maximumFractionDigits === 'number') {
      safeOptions.maximumFractionDigits = Math.max(0, Math.min(20, options.maximumFractionDigits));
    }
    
    // Ensure minimumFractionDigits ≤ maximumFractionDigits
    const min = safeOptions.minimumFractionDigits ?? 0;
    const max = safeOptions.maximumFractionDigits ?? 0;
    
    if (min > max) {
      safeOptions.minimumFractionDigits = max;
    }
    
    // Copy any other options
    for (const key in options) {
      if (key !== 'minimumFractionDigits' && key !== 'maximumFractionDigits') {
        // @ts-ignore - dynamic property assignment
        safeOptions[key] = options[key];
      }
    }
  }
  
  // Handle negative numbers differently to place $ after the negative sign
  if (amount < 0) {
    return `-$${Math.abs(amount).toLocaleString('en-US', safeOptions)}`;
  }
  
  return `$${amount.toLocaleString('en-US', safeOptions)}`;
};

const PNL_PRIZE_DISTRIBUTION = {
  1: 3000,
  2: 1000,
  3: 500,
  4: 100,
  5: 100,
  6: 100,
  7: 100,
  8: 100,
}

const VOLUME_PRIZE_DISTRIBUTION = {
  1: 1500,
  2: 1000,
}

// Helper function to count trades by duration thresholds and collateral
const logTradesByDurationThresholds = (trades: TradeItem[]): void => {
  const under1min = trades.filter(trade => {
    const openTime = Number(trade.createdAt);
    const closeTime = Number(trade.closedAt);
    return (closeTime - openTime) < 60; // less than 1 minute
  }).length;
  
  const under5min = trades.filter(trade => {
    const openTime = Number(trade.createdAt);
    const closeTime = Number(trade.closedAt);
    return (closeTime - openTime) < 5 * 60; // less than 5 minutes
  }).length;
  
  const under10min = trades.filter(trade => {
    const openTime = Number(trade.createdAt);
    const closeTime = Number(trade.closedAt);
    return (closeTime - openTime) < 10 * 60; // less than 10 minutes
  }).length;
  
  const under15min = trades.filter(trade => {
    const openTime = Number(trade.createdAt);
    const closeTime = Number(trade.closedAt);
    return (closeTime - openTime) < 15 * 60; // less than 15 minutes
  }).length;
  
  const under10Collateral = trades.filter(trade => {
    return Number(trade.maxCollateral) < 10;
  }).length;
  
  console.log('Trade duration statistics:');
  console.log(`- Under 1 minute: ${under1min} trades (${((under1min / trades.length) * 100).toFixed(2)}%)`);
  console.log(`- Under 5 minutes: ${under5min} trades (${((under5min / trades.length) * 100).toFixed(2)}%)`);
  console.log(`- Under 10 minutes: ${under10min} trades (${((under10min / trades.length) * 100).toFixed(2)}%)`);
  console.log(`- Under 15 minutes: ${under15min} trades (${((under15min / trades.length) * 100).toFixed(2)}%)`);
  console.log(`- Under $10 collateral: ${under10Collateral} trades (${((under10Collateral / trades.length) * 100).toFixed(2)}%)`);
  console.log(`- Total trades: ${trades.length}`);
};

// Helper to determine if a trade is valid and why it might be invalid
export const getTradeValidityReason = (trade: TradeItem): { isValid: boolean; reason?: string } => {
  const openTime = Number(trade.createdAt);
  const closeTime = Number(trade.closedAt);
  const durationInMinutes = (closeTime - openTime) / 60;
  const maxCollateral = Number(trade.maxCollateral);
  
  if (durationInMinutes < 5) {
    return { isValid: false, reason: "Trade duration under 5 minutes" };
  }
  
  if (maxCollateral < 10) {
    return { isValid: false, reason: "Collateral under $10" };
  }
  
  return { isValid: true };
};

// Helper function to filter trades by minimum duration and minimum collateral
const filterTrades = (trades: TradeItem[]): TradeItem[] => {  
  const filteredTrades = trades.filter(trade => {
    const { isValid } = getTradeValidityReason(trade);
    return isValid;
  });
  
  const removedDueToTime = trades.filter(trade => {
    const openTime = Number(trade.createdAt);
    const closeTime = Number(trade.closedAt);
    const durationInMinutes = (closeTime - openTime) / 60;
    return durationInMinutes < 5;
  }).length;
  
  const removedDueToCollateral = trades.filter(trade => {
    const maxCollateral = Number(trade.maxCollateral);
    return maxCollateral < 10;
  }).length;
  
  console.log(`Filtered out ${trades.length - filteredTrades.length} trades`);
  console.log(`- ${removedDueToTime} trades removed due to duration under 5 minutes`);
  console.log(`- ${removedDueToCollateral} trades removed due to collateral under $10`);
  
  return filteredTrades;
}

export const calculateLeaderboardStats = (rawData: TradeItem[]): LeaderboardStats => {
  // Log trade duration statistics before filtering
  logTradesByDurationThresholds(rawData);
  
  // Apply filters
  const filteredData = filterTrades(rawData);

  // Calculate total volume and total PnL across all trades
  const totalVolume = filteredData.reduce((sum, trade) => sum + Number(trade.size), 0);
  const totalPnl = filteredData.reduce((sum, trade) => sum + Number(trade.pnl), 0);
  
  // Get unique traders count
  const uniqueTraders = new Set(filteredData.map(trade => trade.user)).size;
  
  // Total trades is simply the length of the filtered data array
  const totalTrades = filteredData.length;
  
  return {
    totalVolume: Number(totalVolume.toFixed(2)),
    totalTraders: uniqueTraders,
    totalTrades: totalTrades,
    totalPnl: Number(totalPnl.toFixed(2))
  };
};

export const processLeaderboardData = (rawData: TradeItem[]): ProcessedTraderData[] => {
  console.log('Raw data received:', rawData);
  
  // Log trade duration statistics before filtering
  logTradesByDurationThresholds(rawData);

  // Apply filters
  const filteredData = filterTrades(rawData);
  
  // Group trades by user and track individual trade performances
  const traderStats = filteredData.reduce((acc, trade) => {
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
      size,
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
      size: number
      returnPercentage: number
    }>
  }>)


  // Process all traders
  const allTraders = Object.values(traderStats)
    .map(trader => {
      const avgCollateral = trader.collateralSum / trader.tradeCount
      
      // Calculate score as average return percentage across all trades
      const score = trader.validTrades.reduce((sum, trade) => 
        sum + trade.returnPercentage, 0
      ) / trader.validTrades.length

      // Check if trader qualifies for PNL competition (at least 3 trades with average return >= 10%)
      const isPnlQualifying = trader.validTrades.length >= 3 && score >= 10 && trader.pnl > 0;
      
      // Check if trader qualifies for volume competition (at least 3 trades)
      const isVolumeQualifying = trader.validTrades.length >= 3;

      return {
        trader: trader.trader,
        pnl: Number(trader.pnl.toFixed(2)),
        volume: Number(trader.volume.toFixed(2)),
        trades: trader.validTrades.length,
        collateral: Number(trader.maxCollateral.toFixed(2)),
        avgCollateral: Number(avgCollateral.toFixed(2)),
        score: Number(score.toFixed(2)),
        isQualifying: isPnlQualifying || isVolumeQualifying,
        isPnlQualifying,
        isVolumeQualifying
      }
    });

  // Sort traders for PNL competition
  const pnlQualifyingTraders = allTraders
    .filter(trader => trader.isPnlQualifying)
    .sort((a, b) => b.pnl - a.pnl);

  // Sort traders for volume competition
  const volumeQualifyingTraders = allTraders
    .filter(trader => trader.isVolumeQualifying)
    .sort((a, b) => b.volume - a.volume);

  // Assign PNL ranks
  const pnlRankMap = new Map();
  pnlQualifyingTraders.forEach((trader, index) => {
    pnlRankMap.set(trader.trader, {
      rank: index + 1,
      prize: PNL_PRIZE_DISTRIBUTION[index + 1 as keyof typeof PNL_PRIZE_DISTRIBUTION],
    });
  });

  // Assign volume ranks
  const volumeRankMap = new Map();
  volumeQualifyingTraders.forEach((trader, index) => {
    volumeRankMap.set(trader.trader, {
      rank: index + 1,
      prize: VOLUME_PRIZE_DISTRIBUTION[index + 1 as keyof typeof VOLUME_PRIZE_DISTRIBUTION],
    });
  });

  // Sort all traders by score by default (original sorting)
  return allTraders
    .sort((a, b) => b.score - a.score)
    .map(trader => {
      const pnlRankInfo = pnlRankMap.get(trader.trader) || { rank: 0, prize: undefined };
      const volumeRankInfo = volumeRankMap.get(trader.trader) || { rank: 0, prize: undefined };
      
      return {
        ...trader,
        rank: pnlRankInfo.rank, // Default to PNL rank for backwards compatibility
        prize: pnlRankInfo.prize, // Default to PNL prize for backwards compatibility
        pnlRank: pnlRankInfo.rank,
        pnlPrize: pnlRankInfo.prize,
        volumeRank: volumeRankInfo.rank,
        volumePrize: volumeRankInfo.prize,
      }
    });
} 