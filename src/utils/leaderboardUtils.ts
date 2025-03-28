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
  profitableTrades: number
  profitableTradesAbove10Pct: number
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
  // All trades are now valid - no filtering based on duration or collateral
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
  const referralAddressToCheck = "0xA1C4c39Dd88eAe85c7457E2A737F0758fA521116".toLowerCase();
  // Calculate total volume (using maxSize) and total PnL across all trades, applying boosts
  let totalVolume = 0;
  let totalPnl = 0;

  rawData.forEach(trade => {
    let pnl = Number(trade.pnl);
    let volume = Number(trade.maxSize); // Use maxSize for volume

    // Apply boosts if the referral address matches
    if (trade.referralAddress?.toLowerCase() === referralAddressToCheck) {
      if (pnl > 0) {
        pnl *= 1.20; // 20% boost for positive PnL
      }
      volume *= 1.20; // 20% boost for volume
    }

    totalVolume += volume;
    totalPnl += pnl;
  });

  // Get unique traders count
  const uniqueTraders = new Set(rawData.map(trade => trade.user)).size;

  // Total trades is simply the length of the data array
  const totalTrades = rawData.length;

  return {
    totalVolume: Number(totalVolume.toFixed(2)),
    totalTraders: uniqueTraders,
    totalTrades: totalTrades,
    totalPnl: Number(totalPnl.toFixed(2))
  };
};

export const processLeaderboardData = (rawData: TradeItem[]): ProcessedTraderData[] => {
  console.log('Raw data received:', rawData);
  const referralAddressToCheck = "0xA1C4c39Dd88eAe85c7457E2A737F0758fA521116".toLowerCase();

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
        profitableTrades: 0,
        tradesAbove10PctReturn: 0,
        allTrades: [],
      }
    }

    // Parse values
    let pnl = Number(trade.pnl);
    const size = Number(trade.size); // Keep original size if needed elsewhere
    let volume = Number(trade.maxSize); // Use maxSize for volume calculation
    const maxCollateral = Number(trade.maxCollateral);

    // Apply boosts if the referral address matches
    const isReferred = trade.referralAddress?.toLowerCase() === referralAddressToCheck;
    if (isReferred) {
        if (pnl > 0) {
            pnl *= 1.20; // 20% boost for positive PnL
        }
        volume *= 1.20; // 20% boost for volume
    }

    const returnPercentage = maxCollateral > 0 ? (pnl / maxCollateral) * 100 : 0; // Prevent division by zero

    // Track individual trade metrics (using original PnL for profitability checks)
    if (Number(trade.pnl) > 0) { // Check original PnL for profitability status
      acc[user].profitableTrades += 1;

      // Check if the trade has >10% return based on original PnL
      const originalReturnPercentage = maxCollateral > 0 ? (Number(trade.pnl) / maxCollateral) * 100 : 0;
      if (originalReturnPercentage >= 10) {
        acc[user].tradesAbove10PctReturn += 1;
      }
    }

    // Track all trades (store boosted values if needed, or original values)
    acc[user].allTrades.push({
      pnl: pnl, // Store boosted PnL
      maxCollateral,
      size: size, // Store original size
      volume: volume, // Store boosted volume
      returnPercentage // Store potentially boosted return %
    })

    // Accumulate stats (using boosted values)
    acc[user].pnl += pnl;
    acc[user].volume += volume; // Accumulate boosted volume
    acc[user].trades += 1;
    acc[user].totalCollateral += maxCollateral; // Keep using maxCollateral as is
    acc[user].maxCollateral = Math.max(acc[user].maxCollateral, maxCollateral); // Keep using maxCollateral as is
    acc[user].tradeCount += 1;
    acc[user].collateralSum += maxCollateral; // Keep using maxCollateral as is

    return acc;
  }, {} as Record<string, {
    trader: string;
    pnl: number; // Will hold boosted sum
    volume: number; // Will hold boosted sum
    trades: number;
    totalCollateral: number;
    maxCollateral: number;
    tradeCount: number;
    collateralSum: number;
    profitableTrades: number;
    tradesAbove10PctReturn: number;
    allTrades: Array<{
      pnl: number; // Boosted PnL
      maxCollateral: number;
      size: number; // Original Size
      volume: number; // Boosted Volume (derived from maxSize)
      returnPercentage: number; // Potentially boosted return %
    }>;
  }>);

  // Process all traders
  const allTraders = Object.values(traderStats)
    .map(trader => {
      const avgCollateral = trader.tradeCount > 0 ? trader.collateralSum / trader.tradeCount : 0; // Prevent division by zero

      // Calculate average return percentage across all trades (for display only, using boosted PnL)
      // Note: This score calculation might need review depending on desired behavior with boosted PnL
      const score = trader.allTrades.length > 0
        ? trader.allTrades.reduce((sum, trade) => sum + trade.returnPercentage, 0) / trader.allTrades.length
        : 0;

      // Check if trader qualifies for PNL competition (at least 3 trades with 10%+ gain based on original PnL)
      const isPnlQualifying = trader.trades >= 3 && trader.tradesAbove10PctReturn >= 3;

      // Check if trader qualifies for volume competition (at least 3 trades)
      const isVolumeQualifying = trader.trades >= 3;

      return {
        trader: trader.trader,
        pnl: Number(trader.pnl.toFixed(2)), // Final boosted PnL sum
        volume: Number(trader.volume.toFixed(2)), // Final boosted Volume sum
        trades: trader.trades,
        collateral: Number(trader.maxCollateral.toFixed(2)),
        avgCollateral: Number(avgCollateral.toFixed(2)),
        score: Number(score.toFixed(2)), // Based on boosted PnL potentially
        isQualifying: isPnlQualifying || isVolumeQualifying, // Qualification based on original PnL checks
        isPnlQualifying,
        isVolumeQualifying,
        profitableTrades: trader.profitableTrades,
        profitableTradesAbove10Pct: trader.tradesAbove10PctReturn
      };
    });

  // Sort traders for PNL competition - only include those who qualify
  const pnlQualifyingTraders = allTraders
    .filter(trader => trader.isPnlQualifying)
    .sort((a, b) => b.pnl - a.pnl); // Uses boosted PnL for sorting

  // Sort traders for volume competition - only include those who qualify
  const volumeQualifyingTraders = allTraders
    .filter(trader => trader.isVolumeQualifying)
    .sort((a, b) => b.volume - a.volume); // Uses boosted Volume for sorting

  // Assign PNL ranks and prizes
  const pnlRankMap = new Map();
  pnlQualifyingTraders.forEach((trader, index) => {
    pnlRankMap.set(trader.trader, {
      rank: index + 1,
      prize: PNL_PRIZE_DISTRIBUTION[index + 1 as keyof typeof PNL_PRIZE_DISTRIBUTION],
    });
  });

  // Assign volume ranks and prizes
  const volumeRankMap = new Map();
  volumeQualifyingTraders.forEach((trader, index) => {
    volumeRankMap.set(trader.trader, {
      rank: index + 1,
      prize: VOLUME_PRIZE_DISTRIBUTION[index + 1 as keyof typeof VOLUME_PRIZE_DISTRIBUTION],
    });
  });

  // Return all traders with their ranks and prizes
  return allTraders
    .sort((a, b) => b.pnl - a.pnl) // Default sort by boosted PnL
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
      };
    });
} 