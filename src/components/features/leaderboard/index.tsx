'use client'

import { Header } from "../../shared/Header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table"
import { Badge } from "../../ui/badge"
import { ChevronDown, Info, Trophy, Loader2 } from "lucide-react"
import { useLeaderboardData } from '../../../hooks/useLeaderboardData'
import { processLeaderboardData } from '../../../utils/leaderboardUtils'
import { Button } from "../../ui/button"
import { useState } from "react"
import { useSmartAccount } from "@/hooks/use-smart-account"

export function LeaderboardDashboard() {
  const { data: rawData, loading, error } = useLeaderboardData()
  const processedData = processLeaderboardData(rawData)
  const [showPersonalStats, setShowPersonalStats] = useState(false)
  const { smartAccount } = useSmartAccount()

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
                  <strong className="text-foreground">Score Formula:</strong> Average percentage return per trade, calculated as: (Sum of (Trade PnL / Trade Collateral)) / Number of Trades × 100
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
              Duration: 5th August 2024 - 31st August 2024
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
                          No qualifying trades yet. Make at least 3 trades to appear on the leaderboard.
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
                      <TableHead className="text-muted-foreground">Trade</TableHead>
                      <TableHead className="text-muted-foreground text-right">PnL</TableHead>
                      <TableHead className="text-muted-foreground text-right">Size</TableHead>
                      <TableHead className="text-muted-foreground text-right">Collateral</TableHead>
                      <TableHead className="text-muted-foreground text-right">Return %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userTrades.length > 0 ? (
                      userTrades.map((trade, index) => {
                        const pnl = Number(trade.pnl)
                        const size = Number(trade.size)
                        const collateral = Number(trade.collateral)
                        const returnPercentage = (pnl / collateral) * 100

                        return (
                          <TableRow key={trade.id} className="hover:bg-[var(--deposit-card-background)] border-[var(--deposit-card-border)]">
                            <TableCell>#{index + 1}</TableCell>
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
                              ${collateral.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
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
                      <TableRow key={row.rank} className="hover:bg-[var(--deposit-card-background)] border-[var(--deposit-card-border)]">
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
                          <div className="flex items-center gap-2">
                            {row.trader}
                            {row.prize && (
                              <Badge variant="secondary" className="bg-[var(--color-long-dark)]/30 text-[var(--color-long)] border-[var(--color-long)]/50">
                                ${row.prize.toLocaleString()}
                              </Badge>
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