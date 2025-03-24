'use client'

import { Header } from "../../shared/Header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table"
import { Badge } from "../../ui/badge"
import { ChevronDown, ChevronUp, Info, Trophy, Loader2, BarChart4, Users, LineChart, DollarSign, X } from "lucide-react"
import { TradeItem, useLeaderboardData } from '../../../hooks/useLeaderboardData'
import { processLeaderboardData, calculateLeaderboardStats, formatDollarAmount, getTradeValidityReason, ProcessedTraderData } from '../../../utils/leaderboardUtils'
import { Button } from "../../ui/button"
import { useState, useEffect } from "react"
import { useSmartAccount } from "@/hooks/use-smart-account"
import { TRADING_PAIRS } from '@/hooks/use-market-data'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "../../ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../ui/card"

// Countdown timer component
function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    // Set the competition end date: April 20, 2025 at 23:59 UTC
    const competitionEnd = new Date(Date.UTC(2025, 3, 20, 23, 59, 59, 999)).getTime();

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const distance = competitionEnd - now;

      if (distance <= 0) {
        // Competition has ended
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex justify-center space-x-4 py-6">
      <div className="flex flex-col items-center">
        <div className="text-4xl font-bold">{timeLeft.days}</div>
        <div className="text-sm text-muted-foreground">Days</div>
      </div>
      <div className="flex flex-col items-center">
        <div className="text-4xl font-bold">{timeLeft.hours}</div>
        <div className="text-sm text-muted-foreground">Hours</div>
      </div>
      <div className="flex flex-col items-center">
        <div className="text-4xl font-bold">{timeLeft.minutes}</div>
        <div className="text-sm text-muted-foreground">Minutes</div>
      </div>
      <div className="flex flex-col items-center">
        <div className="text-4xl font-bold">{timeLeft.seconds}</div>
        <div className="text-sm text-muted-foreground">Seconds</div>
      </div>
    </div>
  );
}

// Trader Details Component
function TraderDetails({ 
  trader, 
  onClose, 
  rawData 
}: { 
  trader: ProcessedTraderData, 
  onClose: () => void,
  rawData: TradeItem[]
}) {
  // Filter trades for this specific trader
  const traderTrades = rawData
    .filter(trade => trade.user === trader.trader)
    .map(trade => ({
      id: trade.id,
      pnl: Number(trade.pnl),
      size: Number(trade.size),
      collateral: Number(trade.maxCollateral),
      returnPercentage: (Number(trade.pnl) / Number(trade.maxCollateral)) * 100,
      isLong: trade.isLong,
      createdAt: new Date(Number(trade.createdAt) * 1000),
      closedAt: new Date(Number(trade.closedAt) * 1000),
      durationMinutes: (Number(trade.closedAt) - Number(trade.createdAt)) / 60,
      has10PctReturn: (Number(trade.pnl) / Number(trade.maxCollateral)) * 100 >= 10,
      pair: trade.tokenAddress,
      leverage: (Number(trade.size) / Number(trade.maxCollateral)).toFixed(1)
    }))
    .sort((a, b) => b.closedAt.getTime() - a.closedAt.getTime()); // Sort by most recent first

  // Calculate summary statistics
  const totalTrades = traderTrades.length;
  const profitableTrades = traderTrades.filter(t => t.pnl > 0).length;
  const tradesAbove10Pct = traderTrades.filter(t => t.returnPercentage >= 10).length;
  const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;
  const avgTradeReturn = totalTrades > 0 
    ? traderTrades.reduce((sum, t) => sum + t.returnPercentage, 0) / totalTrades 
    : 0;
  const avgTradeDuration = totalTrades > 0
    ? traderTrades.reduce((sum, t) => sum + t.durationMinutes, 0) / totalTrades
    : 0;

  // Format duration for display
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    } else if (minutes < 24 * 60) {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours}H${mins > 0 ? ` ${mins}M` : ''}`;
    } else {
      const days = Math.floor(minutes / (24 * 60));
      const hours = Math.round((minutes % (24 * 60)) / 60);
      return `${days}D${hours > 0 ? ` ${hours}H` : ''}`;
    }
  };

  // Format pair name
  const formatPairName = (tokenAddress: string): string => {
    // The tokenAddress directly maps to the key in TRADING_PAIRS
    const pair = TRADING_PAIRS[tokenAddress];
    
    if (pair) {
      return pair;
    }
    
    // Fallback: return shortened address if no matching pair
    return tokenAddress.substring(0, 6) + '...' + tokenAddress.substring(tokenAddress.length - 4);
  };

  return (
    <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
      <DialogHeader>
        <DialogTitle className="text-xl">Trader Details</DialogTitle>
        <p className="text-sm text-muted-foreground break-all">{trader.trader}</p>
      </DialogHeader>
      
      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
        <Card className="min-h-[100px]">
          <CardHeader className="py-2 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total PnL</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <p className={`text-2xl font-bold leading-none mt-4 ${trader.pnl >= 0 ? "text-[var(--color-long)]" : "text-[var(--color-short)]"}`}>
              {formatDollarAmount(trader.pnl)}
            </p>
          </CardContent>
        </Card>

        <Card className="min-h-[100px]">
          <CardHeader className="py-2 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Volume</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <p className="text-2xl font-bold leading-none mt-4">
              {trader.volume >= 1000000 
                ? `$${(trader.volume / 1000000).toFixed(1)}M` 
                : formatDollarAmount(trader.volume)}
            </p>
          </CardContent>
        </Card>

        <Card className="min-h-[100px]">
          <CardHeader className="py-2 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">10%+ Trades</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <p className="text-2xl font-bold leading-none mt-4">
              {tradesAbove10Pct} <span className="text-sm text-muted-foreground">of {totalTrades}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="min-h-[100px]">
          <CardHeader className="py-2 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <p className="text-2xl font-bold leading-none mt-4">
              {winRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="min-h-[100px]">
          <CardHeader className="py-2 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Trade Return</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <p className="text-2xl font-bold leading-none mt-4">
              {avgTradeReturn.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card className="min-h-[100px]">
          <CardHeader className="py-2 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Trade Duration</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <p className="text-2xl font-bold leading-none mt-4">
              {formatDuration(avgTradeDuration)}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Trades Table */}
      <div className="mt-6">
        <h3 className="font-semibold mb-2">All Trades ({totalTrades})</h3>
        <div className="border border-[var(--deposit-card-border)] rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Position</TableHead>
                <TableHead className="text-right hidden md:table-cell">Size</TableHead>
                <TableHead className="text-right">PnL</TableHead>
                <TableHead className="text-right hidden md:table-cell">Return</TableHead>
                <TableHead className="text-right hidden md:table-cell">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {traderTrades.map((trade) => (
                <TableRow key={trade.id} className={trade.has10PctReturn ? "bg-[var(--deposit-card-background)]" : ""}>
                  <TableCell>
                    {trade.closedAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className={trade.isLong ? "text-[var(--color-long)]" : "text-[var(--color-short)]"}>
                      <div>{formatPairName(trade.pair)}</div>
                      <div className="text-xs opacity-80">
                        {trade.leverage}x {trade.isLong ? "LONG" : "SHORT"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell">
                    {formatDollarAmount(trade.size)}
                  </TableCell>
                  <TableCell className={`text-right ${trade.pnl >= 0 ? "text-[var(--color-long)]" : "text-[var(--color-short)]"}`}>
                    {formatDollarAmount(trade.pnl)}
                    <div className="text-xs md:hidden opacity-80">
                      ({trade.returnPercentage.toFixed(1)}%)
                    </div>
                  </TableCell>
                  <TableCell className={`text-right hidden md:table-cell ${trade.returnPercentage >= 0 ? "text-[var(--color-long)]" : "text-[var(--color-short)]"}`}>
                    {trade.returnPercentage.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell">
                    {formatDuration(trade.durationMinutes)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <DialogFooter className="mt-6">
        <Button onClick={onClose}>Close</Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function LeaderboardDashboard() {
  const { data: rawData, loading, error } = useLeaderboardData()
  const { smartAccount } = useSmartAccount()
  const [activeCompetition, setActiveCompetition] = useState<'pnl' | 'volume'>('pnl')
  const [selectedTrader, setSelectedTrader] = useState<ProcessedTraderData | null>(null)
  
  // Process data only once for both competitions
  const processedData = !loading && rawData.length > 0 
    ? processLeaderboardData(rawData) 
    : [];
  
  // Get leaderboard stats
  const stats = !loading && rawData.length > 0
    ? calculateLeaderboardStats(rawData)
    : { totalVolume: 0, totalTraders: 0, totalTrades: 0, totalPnl: 0 };

  // Sort data based on the active competition
  const sortedData = [...processedData].sort((a, b) => {
    if (activeCompetition === 'pnl') {
      // Sort by PNL rank for PNL competition
      if (a.pnlRank && b.pnlRank) return a.pnlRank - b.pnlRank;
      if (a.pnlRank) return -1;
      if (b.pnlRank) return 1;
      return b.pnl - a.pnl; // Secondary sort by PNL
    } else {
      // Sort by volume rank for volume competition
      if (a.volumeRank && b.volumeRank) return a.volumeRank - b.volumeRank;
      if (a.volumeRank) return -1;
      if (b.volumeRank) return 1;
      return b.volume - a.volume; // Secondary sort by volume
    }
  });
  
  // Handler for clicking on a trader row
  const handleTraderClick = (trader: ProcessedTraderData) => {
    setSelectedTrader(trader);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <h1 className="text-3xl font-semibold">Trading Competition</h1>
          </div>

          {/* Countdown Timer - now counts down to the end */}
          <div className="bg-[var(--deposit-card-background)] border border-[var(--deposit-card-border)] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-center mb-2">Competition Ends In</h2>
            <CountdownTimer />
          </div>

          {/* Competition Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PnL Competition */}
            <div className="bg-[var(--deposit-card-background)] border border-[var(--deposit-card-border)] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[var(--color-long)]" />
                  PnL Competition
                </h3>
                <Badge className="bg-[var(--color-long-dark)]/30 text-[var(--color-long)] border-[var(--color-long)]/50">
                  $5,000 Prize Pool
                </Badge>
              </div>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  Compete for the highest raw profit and loss (PnL) during the competition period.
                </p>
                <p>
                  The trader with the highest raw PnL will win the largest prize, with additional prizes for runners-up.
                </p>
                <h4 className="font-semibold text-foreground mt-4">Prizes:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>1st Place: $3,000</li>
                  <li>2nd Place: $1,000</li>
                  <li>3rd Place: $500</li>
                  <li>4th-8th Place: $100 each</li>
                </ul>
              </div>
            </div>

            {/* Volume Competition */}
            <div className="bg-[var(--deposit-card-background)] border border-[var(--deposit-card-border)] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">                    
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <BarChart4 className="h-5 w-5 text-blue-500" />
                  Volume Competition
                </h3>
                <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/50">
                  $2,500 Prize Pool
                </Badge>
              </div>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  Compete for the highest trading volume during the competition period.
                </p>
                <p>
                  The trader with the most trading volume will win the largest prize, with a runner-up prize as well.
                </p>
                <h4 className="font-semibold text-foreground mt-4">Prizes:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>1st Place: $1,500</li>
                  <li>2nd Place: $1,000</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Rules Section */}
          <div className="bg-[var(--deposit-card-background)] border border-[var(--deposit-card-border)] rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-500" />
              Competition Rules
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                <strong>Competition Period:</strong> March 24, 2025 (00:00 UTC) to April 20, 2025 (23:59 UTC)
              </p>
              <p>
                <strong>Eligibility:</strong> All traders must complete at least 3 trades to qualify for prizes.
              </p>
              <p>
                <strong>Volume Competition Rules:</strong> Only cryptocurrency trading pairs count toward the volume competition. Trades with the native pool count for both PnL and volume competitions.
              </p>
              <p>
                <strong>PnL Competition Rules:</strong> Participants must have at least 3 qualifying trades where the PnL is above at least 10% gain to be eligible for prizes.
              </p>
              <p>
                <strong>Fair Play:</strong> Any form of manipulation or unfair trading practices will result in disqualification. The competition organizers reserve the right to disqualify trades and accounts based on community review and at their discretion.
              </p>
              <p>
                <strong>Rewards Distribution:</strong> Prizes will be distributed within 14 days of the competition end date.
              </p>
              <p className="text-sm italic mt-4">
                Note: The competition organizers reserve the right to modify the rules or prize distribution in case of unforeseen circumstances.
              </p>
            </div>
          </div>

          {/* Stats from Competition */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Competition Stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Volume */}
              <div className="bg-[var(--deposit-card-background)] border border-[var(--deposit-card-border)] rounded-lg p-6 flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Volume</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {loading ? "Loading..." : formatDollarAmount(stats.totalVolume)}
                  </h3>
                </div>
                <div className="bg-blue-500/10 p-3 rounded-full">
                  <BarChart4 className="h-5 w-5 text-blue-500" />
                </div>
              </div>

              {/* Total Traders */}
              <div className="bg-[var(--deposit-card-background)] border border-[var(--deposit-card-border)] rounded-lg p-6 flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Unique Traders</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {loading ? "Loading..." : stats.totalTraders.toLocaleString()}
                  </h3>
                </div>
                <div className="bg-violet-500/10 p-3 rounded-full">
                  <Users className="h-5 w-5 text-violet-500" />
                </div>
              </div>

              {/* Total Trades */}
              <div className="bg-[var(--deposit-card-background)] border border-[var(--deposit-card-border)] rounded-lg p-6 flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Trades</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {loading ? "Loading..." : stats.totalTrades.toLocaleString()}
                  </h3>
                </div>
                <div className="bg-amber-500/10 p-3 rounded-full">
                  <LineChart className="h-5 w-5 text-amber-500" />
                </div>
              </div>

              {/* Total PnL */}
              <div className="bg-[var(--deposit-card-background)] border border-[var(--deposit-card-border)] rounded-lg p-6 flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total PnL</p>
                  <h3 className={`text-2xl font-bold mt-1 ${
                    !loading && stats.totalPnl >= 0 
                      ? "text-[var(--color-long)]" 
                      : "text-[var(--color-short)]"
                  }`}>
                    {loading ? "Loading..." : formatDollarAmount(stats.totalPnl)}
                  </h3>
                </div>
                <div className={`${
                  !loading && stats.totalPnl >= 0 
                    ? "bg-[var(--color-long)]/10" 
                    : "bg-[var(--color-short)]/10"
                } p-3 rounded-full`}>
                  <DollarSign className={`h-5 w-5 ${
                    !loading && stats.totalPnl >= 0 
                      ? "text-[var(--color-long)]" 
                      : "text-[var(--color-short)]"
                  }`} />
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Leaderboard Rankings</h2>
            
            {/* Competition Tabs */}
            <Tabs 
              defaultValue="pnl" 
              onValueChange={(value) => setActiveCompetition(value as 'pnl' | 'volume')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="pnl" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  PnL Competition
                </TabsTrigger>
                <TabsTrigger value="volume" className="flex items-center gap-2">
                  <BarChart4 className="h-4 w-4" />
                  Volume Competition
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="pnl">
                <div className="border border-[var(--deposit-card-border)] rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Trader</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                        <TableHead className="text-right hidden md:table-cell">Trades</TableHead>
                        <TableHead className="text-right hidden md:table-cell">10%+ Trades</TableHead>
                        <TableHead className="text-right">Prize</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                            <p className="mt-2 text-sm text-muted-foreground">Loading leaderboard data...</p>
                          </TableCell>
                        </TableRow>
                      ) : sortedData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            <p className="text-muted-foreground">No data available yet.</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedData.map((trader, index) => (
                          <TableRow 
                            key={trader.trader} 
                            className={`${
                              trader.pnlRank && trader.pnlRank <= 3 ? "bg-[var(--deposit-card-background)]" : ""
                            } cursor-pointer hover:bg-[var(--deposit-card-background)]/50`}
                            onClick={() => handleTraderClick(trader)}
                          >
                            <TableCell>
                              {trader.pnlRank ? (
                                <div className="flex items-center">
                                  {trader.pnlRank <= 3 ? (
                                    <Trophy className={`mr-2 h-4 w-4 ${
                                      trader.pnlRank === 1 ? "text-yellow-500" :
                                      trader.pnlRank === 2 ? "text-gray-400" :
                                      "text-amber-800"
                                    }`} />
                                  ) : trader.pnlRank <= 8 ? (
                                    <span className="mr-2">
                                      ⭐
                                    </span>
                                  ) : null}
                                  {trader.pnlRank}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {smartAccount?.address === trader.trader ? (
                                <span className="font-bold text-primary">You</span>
                              ) : (
                                trader.trader.slice(0, 6) + '...' + trader.trader.slice(-4)
                              )}
                            </TableCell>
                            <TableCell className={`text-right ${
                              trader.pnl >= 0 ? "text-[var(--color-long)]" : "text-[var(--color-short)]"
                            }`}>
                              {trader.pnl.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right hidden md:table-cell">
                              {trader.trades}
                            </TableCell>
                            <TableCell className="text-right hidden md:table-cell">
                              {trader.profitableTradesAbove10Pct}
                              {!trader.isQualifying && trader.trades >= 3 && trader.profitableTradesAbove10Pct < 3 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="ml-1 h-3 w-3 inline text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Needs at least 3 trades with 10%+ gain to qualify</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {trader.pnlPrize ? formatDollarAmount(trader.pnlPrize) : "-"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="volume">
                <div className="border border-[var(--deposit-card-border)] rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Trader</TableHead>
                        <TableHead className="text-right">Volume</TableHead>
                        <TableHead className="text-right hidden md:table-cell">Trades</TableHead>
                        <TableHead className="text-right">Prize</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                            <p className="mt-2 text-sm text-muted-foreground">Loading leaderboard data...</p>
                          </TableCell>
                        </TableRow>
                      ) : sortedData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            <p className="text-muted-foreground">No data available yet.</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedData.map((trader, index) => (
                          <TableRow 
                            key={trader.trader} 
                            className={`${
                              trader.volumeRank && trader.volumeRank <= 2 ? "bg-[var(--deposit-card-background)]" : ""
                            } cursor-pointer hover:bg-[var(--deposit-card-background)]/50`}
                            onClick={() => handleTraderClick(trader)}
                          >
                            <TableCell>
                              {trader.volumeRank ? (
                                <div className="flex items-center">
                                  {trader.volumeRank <= 2 ? (
                                    <Trophy className={`mr-2 h-4 w-4 ${
                                      trader.volumeRank === 1 ? "text-yellow-500" : "text-gray-400"
                                    }`} />
                                  ) : null}
                                  {trader.volumeRank}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {smartAccount?.address === trader.trader ? (
                                <span className="font-bold text-primary">You</span>
                              ) : (
                                trader.trader.slice(0, 6) + '...' + trader.trader.slice(-4)
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatDollarAmount(trader.volume)}
                            </TableCell>
                            <TableCell className="text-right hidden md:table-cell">
                              {trader.trades}
                            </TableCell>
                            <TableCell className="text-right">
                              {trader.volumePrize ? formatDollarAmount(trader.volumePrize) : "-"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Trader Details Dialog */}
          {selectedTrader && (
            <Dialog open={!!selectedTrader} onOpenChange={(open) => !open && setSelectedTrader(null)}>
              <TraderDetails 
                trader={selectedTrader} 
                onClose={() => setSelectedTrader(null)}
                rawData={rawData}
              />
            </Dialog>
          )}
        </div>
      </div>
    </div>
  )
} 