'use client'

import { Header } from "../../shared/Header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table"
import { Badge } from "../../ui/badge"
import { ChevronDown, Info, Trophy, Loader2 } from "lucide-react"
import { useLeaderboardData } from '../../../hooks/useLeaderboardData'
import { processLeaderboardData } from '../../../utils/leaderboardUtils'

export function LeaderboardDashboard() {
  const { data: rawData, loading, error } = useLeaderboardData()
  const processedData = processLeaderboardData(rawData)

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
                  <strong className="text-foreground">ROI Formula:</strong> (Profit and Loss (PnL) / max(userCollateral,
                  Average Collateral)) × 100
                </span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-muted-foreground/50 font-mono">•</span>
                <span>
                  <strong className="text-foreground">Maximum Average Collateral:</strong> Computed as the average of all users
                  participating in the round who conduct trades in a given tier
                </span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-muted-foreground/50 font-mono">•</span>
                <span>
                  If collateral falls below the average collateral, the maximum average collateral will be used to
                  calculate ROI. Otherwise, your actual collateral will be used.
                </span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-muted-foreground/50 font-mono">•</span>
                <span>
                  <strong className="text-foreground">Minimum Requirements:</strong> At least 3 trades must be placed to
                  qualify for the leaderboard
                </span>
              </p>
            </div>
          </div>

          {/* Duration */}
          <div className="text-sm text-muted-foreground">Duration: 5th August 2024 - 31st August 2024</div>

          {/* Table */}
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
                      Realized PnL
                      <ChevronDown className="ml-2 h-4 w-4 inline" />
                    </TableHead>
                    <TableHead className="text-muted-foreground text-right">
                      Perp. Volume
                      <ChevronDown className="ml-2 h-4 w-4 inline" />
                    </TableHead>
                    <TableHead className="text-muted-foreground text-right">
                      ROI %
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
                      </TableCell>
                      <TableCell className="text-right">
                        ${row.volume.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell 
                        className={`text-right ${
                          row.roi >= 0 
                            ? "text-[var(--color-long)]" 
                            : "text-[var(--color-short)]"
                        }`}
                      >
                        {row.roi.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 