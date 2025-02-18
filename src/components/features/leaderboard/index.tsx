'use client'

import { Header } from "../../shared/Header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table"
import { Badge } from "../../ui/badge"
import { ChevronDown, ChevronUp, Info, Trophy, Loader2 } from "lucide-react"
import { useLeaderboardData } from '../../../hooks/useLeaderboardData'
import { processLeaderboardData } from '../../../utils/leaderboardUtils'
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
  const [showPersonalStats, setShowPersonalStats] = useState(false)
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
                  <strong className="text-foreground">Minimum Requirements:</strong> At least 3 trades and minimum $50 total PnL
                </span>
              </p>
            </div>
          </div>

          {/* Duration and View Stats Button */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Duration: 16th February - 28th February (UTC start & end)
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
                        PnL (Score)
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
                                ${userStats.prize.toLocaleString()}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell 
                          className={`text-right ${
                            userStats.pnl >= 0 
                              ? "text-[var(--color-long)]" 
                              : "text-[var(--color-short)]"
                          }`}
                        >
                          ${userStats.pnl.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          <span className="text-muted-foreground ml-1">
                            ({userStats.score.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%)
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          ${userStats.volume.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          ${userStats.avgCollateral.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                      <TableHead className="text-muted-foreground text-right">Max Collateral</TableHead>
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

                        return (
                          <TableRow 
                            key={trade.id} 
                            className="hover:bg-[var(--deposit-card-background)] border-[var(--deposit-card-border)]"
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
                              </div>
                            </TableCell>
                            <TableCell 
                              className={`text-right ${
                                pnl >= 0 
                                  ? "text-[var(--color-long)]" 
                                  : "text-[var(--color-short)]"
                              }`}
                            >
                              ${pnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right">
                              ${size.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right">
                              ${maxCollateral.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
            <div className="border border-[var(--deposit-card-border)] rounded-lg overflow-hidden">
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : error ? (
                <div className="flex justify-center items-center p-8 text-red-500">
                  Error loading leaderboard data
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-[var(--deposit-card-background)] border-[var(--deposit-card-border)]">
                      <TableHead className="text-muted-foreground">Rank</TableHead>
                      <TableHead className="text-muted-foreground">Trader</TableHead>
                      <TableHead className="text-muted-foreground text-right">
                        PnL (Score)
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
                    {processedData.map((row) => (
                      <>
                        <TableRow 
                          key={row.rank} 
                          className="hover:bg-[var(--deposit-card-background)] border-[var(--deposit-card-border)] cursor-pointer"
                          onClick={() => toggleTraderExpand(row.trader)}
                        >
                          <TableCell className="font-medium">
                            {row.rank <= 3 ? (
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
                            ) : (
                              row.rank
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {row.trader}
                                {row.prize && (
                                  <Badge variant="secondary" className="bg-[var(--color-long-dark)]/30 text-[var(--color-long)] border-[var(--color-long)]/50">
                                    ${row.prize.toLocaleString()}
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
                          <TableCell 
                            className={`text-right ${
                              row.pnl >= 0 
                                ? "text-[var(--color-long)]" 
                                : "text-[var(--color-short)]"
                            }`}
                          >
                            ${row.pnl.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className="text-muted-foreground ml-1">
                              ({row.score.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%)
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            ${row.volume.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right">
                            ${row.avgCollateral.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                      <TableHead className="text-muted-foreground text-right">Max Collateral</TableHead>
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

                                      return (
                                        <TableRow 
                                          key={trade.id} 
                                          className="hover:bg-[var(--deposit-card-background)] border-[var(--deposit-card-border)]"
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
                                            </div>
                                          </TableCell>
                                          <TableCell 
                                            className={`text-right ${
                                              pnl >= 0 
                                                ? "text-[var(--color-long)]" 
                                                : "text-[var(--color-short)]"
                                            }`}
                                          >
                                            ${pnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            ${size.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            ${maxCollateral.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
          )}
        </div>
      </div>
    </div>
  )
} 