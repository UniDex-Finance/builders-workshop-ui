'use client'

import { Header } from "../../shared/Header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table"
import { Badge } from "../../ui/badge"
import { ChevronDown, ChevronUp, Info, Trophy, Loader2, BarChart4, Users, LineChart, DollarSign, X } from "lucide-react"
import { useLeaderboardData } from '../../../hooks/useLeaderboardData'
import { processLeaderboardData, calculateLeaderboardStats, formatDollarAmount, getTradeValidityReason } from '../../../utils/leaderboardUtils'
import { Button } from "../../ui/button"
import { useState } from "react"
import { useSmartAccount } from "@/hooks/use-smart-account"
import { TRADING_PAIRS } from '@/hooks/use-market-data'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip"

export function LeaderboardDashboard() {
  const { data: rawData, loading, error } = useLeaderboardData()
  const processedData = processLeaderboardData(rawData)
  const leaderboardStats = calculateLeaderboardStats(rawData)
  const [showPersonalStats, setShowPersonalStats] = useState(false)
  const [showAllTraders, setShowAllTraders] = useState(true)
  const { smartAccount } = useSmartAccount()
  const [expandedTrader, setExpandedTrader] = useState<string | null>(null)

  const togglePersonalStats = () => {
    if (!smartAccount?.address) {
      // Optionally show a toast/alert that user needs to connect first
      return
    }
    setShowPersonalStats(!showPersonalStats)
  }

  const userStats = processedData.find(row => row.trader.toLowerCase() === smartAccount?.address?.toLowerCase())
  const userTrades = rawData.filter(trade => 
    trade.user.toLowerCase() === smartAccount?.address?.toLowerCase()
  )

  const toggleTraderExpand = (trader: string) => {
    setExpandedTrader(expandedTrader === trader ? null : trader)
  }

  const getTraderTrades = (trader: string) => {
    return rawData.filter(trade => 
      trade.user.toLowerCase() === trader.toLowerCase()
    )
  }

  // Filter displayed data based on the checkbox state
  const displayData = showAllTraders 
    ? processedData 
    : processedData.filter(row => row.isQualifying);

  // Separate top 3 winners and the rest
  const topWinners = displayData.filter(row => row.rank > 0 && row.rank <= 3);
  const remainingTraders = displayData.filter(row => row.rank > 3 || row.rank === 0);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <h1 className="text-3xl font-semibold">Leaderboard</h1>
          </div>

          {/* Rules Section */}
          <div className="bg-[var(--deposit-card-background)] border border-[var(--deposit-card-border)] rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Info className="w-5 h-5" />
              Competition Rules
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p className="flex items-start gap-2">
                <span className="text-muted-foreground/50 font-mono">•</span>
                <span>
                  <strong className="text-foreground">Scoring:</strong> Your PnL divided by your collateral per trade, averaged across all trades. Higher scores rank better.
                </span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-muted-foreground/50 font-mono">•</span>
                <span className="flex items-center gap-2">
                  <strong className="text-foreground">Percentage PnL Formula (Score):</strong> Average of (Trade PnL ÷ Trade Collateral) × 100
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge 
                          variant="outline" 
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          See Example
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent 
                        className="w-[420px] p-4 bg-[var(--deposit-card-background)] border border-[var(--deposit-card-border)]"
                      >
                        <div className="space-y-3 text-sm">
                          <p><strong>Example Calculation:</strong></p>
                          <div className="space-y-2">
                            <p><strong>Trade 1:</strong></p>
                            <p className="pl-4">
                              Collateral: $1,000<br />
                              PnL: +$150<br />
                              Return = 150/1000 = 15%
                            </p>
                            
                            <p><strong>Trade 2:</strong></p>
                            <p className="pl-4">
                              Collateral: $1,500<br />
                              PnL: +$200<br />
                              Return = 200/1500 = 13.3%
                            </p>
                            
                            <p><strong>Trade 3:</strong></p>
                            <p className="pl-4">
                              Collateral: $800<br />
                              PnL: -$120<br />
                              Return = -120/800 = -15%
                            </p>
                            
                            <p><strong>Final Score:</strong></p>
                            <p className="pl-4">
                              Sum returns: 15% + 13.3% + (-15%) = 13.3%<br />
                              Average: 13.3% ÷ 3 = 4.43%
                            </p>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-muted-foreground/50 font-mono">•</span>
                <span>
                  <strong className="text-foreground">Minimum Requirements:</strong> At least 3 trades, minimum $50 total PnL, minimum 5 minute duration, and minimum $10 collateral.
                </span>
              </p>
            </div>
          </div>

          {/* Stats Counter Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Volume */}
            <div className="bg-[var(--deposit-card-background)] border border-[var(--deposit-card-border)] rounded-lg p-6 flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Volume</p>
                <h3 className="text-2xl font-bold mt-1">
                  {formatDollarAmount(leaderboardStats.totalVolume)}
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
                  {leaderboardStats.totalTraders.toLocaleString()}
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
                  {leaderboardStats.totalTrades.toLocaleString()}
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
                  leaderboardStats.totalPnl >= 0 
                    ? "text-[var(--color-long)]" 
                    : "text-[var(--color-short)]"
                }`}>
                  {formatDollarAmount(leaderboardStats.totalPnl)}
                </h3>
              </div>
              <div className={`${
                leaderboardStats.totalPnl >= 0 
                  ? "bg-[var(--color-long)]/10" 
                  : "bg-[var(--color-short)]/10"
              } p-3 rounded-full`}>
                <DollarSign className={`h-5 w-5 ${
                  leaderboardStats.totalPnl >= 0 
                    ? "text-[var(--color-long)]" 
                    : "text-[var(--color-short)]"
                }`} />
              </div>
            </div>
          </div>

          {/* Duration and View Stats Button */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Duration: 16th February - 28th February (UTC start & end)
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="showAllTraders" 
                  checked={showAllTraders} 
                  onChange={(e) => setShowAllTraders(e.target.checked)}
                  className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                />
                <label 
                  htmlFor="showAllTraders" 
                  className="text-sm cursor-pointer text-muted-foreground"
                >
                  Show non-qualifying traders
                </label>
              </div>
              <Button 
                variant="secondary" 
                onClick={togglePersonalStats}
                className="text-sm"
                disabled={!smartAccount?.address}
              >
                {showPersonalStats ? "View All Rankings" : "View Your Stats"}
              </Button>
            </div>
          </div>

          {/* Personal Stats Section */}
          {showPersonalStats && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Your Performance</h2>
              </div>
              
              {/* Use same table design as main leaderboard */}
              <div className="border border-[var(--deposit-card-border)] rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-[var(--deposit-card-background)] border-[var(--deposit-card-border)]">
                      <TableHead className="text-muted-foreground">Rank</TableHead>
                      <TableHead className="text-muted-foreground">Trader</TableHead>
                      <TableHead className="text-muted-foreground text-right">
                        Score (PnL)
                        <ChevronDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead className="text-muted-foreground text-right">
                        Perp. Volume
                        <ChevronDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead className="text-muted-foreground text-right">
                        Avg. Collateral
                        <ChevronDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userStats ? (
                      <TableRow className="hover:bg-[var(--deposit-card-background)] border-[var(--deposit-card-border)]">
                        <TableCell className="font-medium">
                          {userStats.rank <= 3 ? (
                            <Badge
                              variant="outline"
                              className={`
                                ${userStats.rank === 1 ? "border-yellow-500 text-yellow-500" : ""}
                                ${userStats.rank === 2 ? "border-zinc-400 text-zinc-400" : ""}
                                ${userStats.rank === 3 ? "border-amber-700 text-amber-700" : ""}
                              `}
                            >
                              <Trophy className="w-3 h-3 mr-1" />
                              {userStats.rank}
                            </Badge>
                          ) : (
                            userStats.rank
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {userStats.trader}
                            {userStats.prize && (
                              <Badge variant="secondary" className="bg-[var(--color-long-dark)]/30 text-[var(--color-long)] border-[var(--color-long)]/50">
                                {formatDollarAmount(userStats.prize, { maximumFractionDigits: 0 })}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-medium ${
                            userStats.score >= 0 
                              ? "text-[var(--color-long)]" 
                              : "text-[var(--color-short)]"
                          }`}>{userStats.score.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
                          <span className={`ml-1 opacity-75 ${
                            userStats.pnl >= 0 
                              ? "text-[var(--color-long)]" 
                              : "text-[var(--color-short)]"
                          }`}>
                            ({formatDollarAmount(userStats.pnl)})
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatDollarAmount(userStats.volume)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatDollarAmount(userStats.avgCollateral)}
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          You are not qualifying yet. Make at least 3 trades to appear on the leaderboard.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Trade History */}
              <div className="flex items-center justify-between mt-8">
                <h2 className="text-xl font-semibold text-foreground">Trade History</h2>
              </div>

              <div className="border border-[var(--deposit-card-border)] rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-[var(--deposit-card-background)] border-[var(--deposit-card-border)]">
                      <TableHead className="text-muted-foreground pl-8">Date</TableHead>
                      <TableHead className="text-muted-foreground">Position</TableHead>
                      <TableHead className="text-muted-foreground text-right">PnL</TableHead>
                      <TableHead className="text-muted-foreground text-right">Size</TableHead>
                      <TableHead className="text-muted-foreground text-right">Collateral</TableHead>
                      <TableHead className="text-muted-foreground text-right">Return %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userTrades.length > 0 ? (
                      userTrades.map((trade) => {
                        const pnl = Number(trade.pnl)
                        const size = Number(trade.size)
                        const maxCollateral = Number(trade.maxCollateral)
                        const returnPercentage = (pnl / maxCollateral) * 100
                        const leverage = (size / maxCollateral).toFixed(1)
                        const date = new Date(Number(trade.closedAt) * 1000)
                        const formattedDate = date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                        const pair = TRADING_PAIRS[trade.tokenAddress] || 'Unknown'
                        const { isValid, reason } = getTradeValidityReason(trade)

                        return (
                          <TableRow 
                            key={trade.id} 
                            className={`hover:bg-[var(--deposit-card-background)] border-[var(--deposit-card-border)] ${!isValid ? 'opacity-70' : ''}`}
                          >
                            <TableCell className="pl-8">{formattedDate}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span>{pair}</span>
                                <span className={`${
                                  trade.isLong 
                                    ? "text-[var(--color-long)]" 
                                    : "text-[var(--color-short)]"
                                }`}>
                                  {leverage}x
                                </span>
                                {!isValid && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <X className="h-4 w-4 text-red-500" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{reason}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </TableCell>
                            <TableCell 
                              className={`text-right ${
                                pnl >= 0 
                                  ? "text-[var(--color-long)]" 
                                  : "text-[var(--color-short)]"
                              }`}
                            >
                              {formatDollarAmount(pnl)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatDollarAmount(size)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatDollarAmount(maxCollateral)}
                            </TableCell>
                            <TableCell 
                              className={`text-right ${
                                returnPercentage >= 0 
                                  ? "text-[var(--color-long)]" 
                                  : "text-[var(--color-short)]"
                              }`}
                            >
                              {returnPercentage.toFixed(2)}%
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No trades found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Main Leaderboard Table (show only if not viewing personal stats) */}
          {!showPersonalStats && (
            <div className="space-y-8">
              {/* Top Winners Section */}
              {topWinners.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Top Winners</h2>
                  <div className="border border-[var(--deposit-card-border)] rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-[var(--deposit-card-background)] border-[var(--deposit-card-border)]">
                          <TableHead className="text-muted-foreground">Rank</TableHead>
                          <TableHead className="text-muted-foreground">Trader</TableHead>
                          <TableHead className="text-muted-foreground text-right">
                            Score (PnL)
                            <ChevronDown className="ml-2 h-4 w-4 inline" />
                          </TableHead>
                          <TableHead className="text-muted-foreground text-right">
                            Perp. Volume
                            <ChevronDown className="ml-2 h-4 w-4 inline" />
                          </TableHead>
                          <TableHead className="text-muted-foreground text-right">
                            Avg. Collateral
                            <ChevronDown className="ml-2 h-4 w-4 inline" />
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topWinners.map((row) => (
                          <>
                            <TableRow 
                              key={row.trader} 
                              className="hover:bg-[var(--deposit-card-background)] border-[var(--deposit-card-border)] cursor-pointer"
                              onClick={() => toggleTraderExpand(row.trader)}
                            >
                              <TableCell className="font-medium">
                                <Badge
                                  variant="outline"
                                  className={`
                                    ${row.rank === 1 ? "border-yellow-500 text-yellow-500" : ""}
                                    ${row.rank === 2 ? "border-zinc-400 text-zinc-400" : ""}
                                    ${row.rank === 3 ? "border-amber-700 text-amber-700" : ""}
                                  `}
                                >
                                  <Trophy className="w-3 h-3 mr-1" />
                                  {row.rank}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {row.trader}
                                    {row.prize && (
                                      <Badge variant="secondary" className="bg-[var(--color-long-dark)]/30 text-[var(--color-long)] border-[var(--color-long)]/50">
                                        {formatDollarAmount(row.prize, { maximumFractionDigits: 0 })}
                                      </Badge>
                                    )}
                                  </div>
                                  {expandedTrader === row.trader ? (
                                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={`font-medium ${
                                  row.score >= 0 
                                    ? "text-[var(--color-long)]" 
                                    : "text-[var(--color-short)]"
                                }`}>{row.score.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
                                <span className={`ml-1 opacity-50 ${
                                  row.pnl >= 0 
                                    ? "text-[var(--color-long)]" 
                                    : "text-[var(--color-short)]"
                                }`}>
                                  ({formatDollarAmount(row.pnl)})
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                {formatDollarAmount(row.volume)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatDollarAmount(row.avgCollateral)}
                              </TableCell>
                            </TableRow>

                            {/* Expanded trades section */}
                            {expandedTrader === row.trader && (
                              <TableRow className="bg-[var(--deposit-card-background)]/50">
                                <TableCell colSpan={5} className="p-0">
                                  <div className="border-t border-[var(--deposit-card-border)]">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="hover:bg-[var(--deposit-card-background)] border-[var(--deposit-card-border)]">
                                          <TableHead className="text-muted-foreground pl-8">Date</TableHead>
                                          <TableHead className="text-muted-foreground">Position</TableHead>
                                          <TableHead className="text-muted-foreground text-right">PnL</TableHead>
                                          <TableHead className="text-muted-foreground text-right">Size</TableHead>
                                          <TableHead className="text-muted-foreground text-right">Collateral</TableHead>
                                          <TableHead className="text-muted-foreground text-right">Return %</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {getTraderTrades(row.trader).map((trade) => {
                                          const pnl = Number(trade.pnl)
                                          const size = Number(trade.size)
                                          const maxCollateral = Number(trade.maxCollateral)
                                          const returnPercentage = (pnl / maxCollateral) * 100
                                          const leverage = (size / maxCollateral).toFixed(1)
                                          const date = new Date(Number(trade.closedAt) * 1000)
                                          const formattedDate = date.toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })
                                          const pair = TRADING_PAIRS[trade.tokenAddress] || 'Unknown'
                                          const { isValid, reason } = getTradeValidityReason(trade)

                                          return (
                                            <TableRow 
                                              key={trade.id} 
                                              className={`hover:bg-[var(--deposit-card-background)] border-[var(--deposit-card-border)] ${!isValid ? 'opacity-70' : ''}`}
                                            >
                                              <TableCell className="pl-8">{formattedDate}</TableCell>
                                              <TableCell>
                                                <div className="flex items-center gap-2">
                                                  <span>{pair}</span>
                                                  <span className={`${
                                                    trade.isLong 
                                                      ? "text-[var(--color-long)]" 
                                                      : "text-[var(--color-short)]"
                                                  }`}>
                                                    {leverage}x
                                                  </span>
                                                  {!isValid && (
                                                    <TooltipProvider>
                                                      <Tooltip>
                                                        <TooltipTrigger>
                                                          <X className="h-4 w-4 text-red-500" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                          <p>{reason}</p>
                                                        </TooltipContent>
                                                      </Tooltip>
                                                    </TooltipProvider>
                                                  )}
                                                </div>
                                              </TableCell>
                                              <TableCell 
                                                className={`text-right ${
                                                  pnl >= 0 
                                                    ? "text-[var(--color-long)]" 
                                                    : "text-[var(--color-short)]"
                                                }`}
                                              >
                                                {formatDollarAmount(pnl)}
                                              </TableCell>
                                              <TableCell className="text-right">
                                                {formatDollarAmount(size)}
                                              </TableCell>
                                              <TableCell className="text-right">
                                                {formatDollarAmount(maxCollateral)}
                                              </TableCell>
                                              <TableCell 
                                                className={`text-right ${
                                                  returnPercentage >= 0 
                                                    ? "text-[var(--color-long)]" 
                                                    : "text-[var(--color-short)]"
                                                }`}
                                              >
                                                {returnPercentage.toFixed(2)}%
                                              </TableCell>
                                            </TableRow>
                                          )
                                        })}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Remaining Traders Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Leaderboard Rankings</h2>
                <div className="border border-[var(--deposit-card-border)] rounded-lg overflow-hidden">
                  {loading ? (
                    <div className="flex justify-center items-center p-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : error ? (
                    <div className="flex justify-center items-center p-8 text-red-500">
                      Error loading leaderboard data
                    </div>
                  ) : remainingTraders.length === 0 ? (
                    <div className="flex justify-center items-center p-8 text-muted-foreground">
                      No traders found
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-[var(--deposit-card-background)] border-[var(--deposit-card-border)]">
                          <TableHead className="text-muted-foreground">Rank</TableHead>
                          <TableHead className="text-muted-foreground">Trader</TableHead>
                          <TableHead className="text-muted-foreground text-right">
                            Score (PnL)
                            <ChevronDown className="ml-2 h-4 w-4 inline" />
                          </TableHead>
                          <TableHead className="text-muted-foreground text-right">
                            Perp. Volume
                            <ChevronDown className="ml-2 h-4 w-4 inline" />
                          </TableHead>
                          <TableHead className="text-muted-foreground text-right">
                            Avg. Collateral
                            <ChevronDown className="ml-2 h-4 w-4 inline" />
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {remainingTraders.map((row) => (
                          <>
                            <TableRow 
                              key={row.trader} 
                              className="hover:bg-[var(--deposit-card-background)] border-[var(--deposit-card-border)] cursor-pointer"
                              onClick={() => toggleTraderExpand(row.trader)}
                            >
                              <TableCell className="font-medium">
                                {row.isQualifying ? (
                                  row.rank
                                ) : (
                                  <span className="text-muted-foreground">X</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {row.trader}
                                    {row.prize && (
                                      <Badge variant="secondary" className="bg-[var(--color-long-dark)]/30 text-[var(--color-long)] border-[var(--color-long)]/50">
                                        {formatDollarAmount(row.prize, { maximumFractionDigits: 0 })}
                                      </Badge>
                                    )}
                                  </div>
                                  {expandedTrader === row.trader ? (
                                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={`font-medium ${
                                  row.score >= 0 
                                    ? "text-[var(--color-long)]" 
                                    : "text-[var(--color-short)]"
                                }`}>{row.score.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
                                <span className={`ml-1 opacity-50 ${
                                  row.pnl >= 0 
                                    ? "text-[var(--color-long)]" 
                                    : "text-[var(--color-short)]"
                                }`}>
                                  ({formatDollarAmount(row.pnl)})
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                {formatDollarAmount(row.volume)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatDollarAmount(row.avgCollateral)}
                              </TableCell>
                            </TableRow>

                            {/* Expanded trades section */}
                            {expandedTrader === row.trader && (
                              <TableRow className="bg-[var(--deposit-card-background)]/50">
                                <TableCell colSpan={5} className="p-0">
                                  <div className="border-t border-[var(--deposit-card-border)]">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="hover:bg-[var(--deposit-card-background)] border-[var(--deposit-card-border)]">
                                          <TableHead className="text-muted-foreground pl-8">Date</TableHead>
                                          <TableHead className="text-muted-foreground">Position</TableHead>
                                          <TableHead className="text-muted-foreground text-right">PnL</TableHead>
                                          <TableHead className="text-muted-foreground text-right">Size</TableHead>
                                          <TableHead className="text-muted-foreground text-right">Collateral</TableHead>
                                          <TableHead className="text-muted-foreground text-right">Return %</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {getTraderTrades(row.trader).map((trade) => {
                                          const pnl = Number(trade.pnl)
                                          const size = Number(trade.size)
                                          const maxCollateral = Number(trade.maxCollateral)
                                          const returnPercentage = (pnl / maxCollateral) * 100
                                          const leverage = (size / maxCollateral).toFixed(1)
                                          const date = new Date(Number(trade.closedAt) * 1000)
                                          const formattedDate = date.toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })
                                          const pair = TRADING_PAIRS[trade.tokenAddress] || 'Unknown'
                                          const { isValid, reason } = getTradeValidityReason(trade)

                                          return (
                                            <TableRow 
                                              key={trade.id} 
                                              className={`hover:bg-[var(--deposit-card-background)] border-[var(--deposit-card-border)] ${!isValid ? 'opacity-70' : ''}`}
                                            >
                                              <TableCell className="pl-8">{formattedDate}</TableCell>
                                              <TableCell>
                                                <div className="flex items-center gap-2">
                                                  <span>{pair}</span>
                                                  <span className={`${
                                                    trade.isLong 
                                                      ? "text-[var(--color-long)]" 
                                                      : "text-[var(--color-short)]"
                                                  }`}>
                                                    {leverage}x
                                                  </span>
                                                  {!isValid && (
                                                    <TooltipProvider>
                                                      <Tooltip>
                                                        <TooltipTrigger>
                                                          <X className="h-4 w-4 text-red-500" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                          <p>{reason}</p>
                                                        </TooltipContent>
                                                      </Tooltip>
                                                    </TooltipProvider>
                                                  )}
                                                </div>
                                              </TableCell>
                                              <TableCell 
                                                className={`text-right ${
                                                  pnl >= 0 
                                                    ? "text-[var(--color-long)]" 
                                                    : "text-[var(--color-short)]"
                                                }`}
                                              >
                                                {formatDollarAmount(pnl)}
                                              </TableCell>
                                              <TableCell className="text-right">
                                                {formatDollarAmount(size)}
                                              </TableCell>
                                              <TableCell className="text-right">
                                                {formatDollarAmount(maxCollateral)}
                                              </TableCell>
                                              <TableCell 
                                                className={`text-right ${
                                                  returnPercentage >= 0 
                                                    ? "text-[var(--color-long)]" 
                                                    : "text-[var(--color-short)]"
                                                }`}
                                              >
                                                {returnPercentage.toFixed(2)}%
                                              </TableCell>
                                            </TableRow>
                                          )
                                        })}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 