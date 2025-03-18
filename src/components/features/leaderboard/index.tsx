'use client'

import { Header } from "../../shared/Header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table"
import { Badge } from "../../ui/badge"
import { ChevronDown, ChevronUp, Info, Trophy, Loader2, BarChart4, Users, LineChart, DollarSign, X } from "lucide-react"
import { useLeaderboardData } from '../../../hooks/useLeaderboardData'
import { processLeaderboardData, calculateLeaderboardStats, formatDollarAmount, getTradeValidityReason } from '../../../utils/leaderboardUtils'
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

// Countdown timer component
function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    // Set the competition start date: March 24, 2025 at 00:00 UTC
    const competitionStart = new Date(Date.UTC(2025, 2, 24, 0, 0, 0, 0)).getTime();

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const distance = competitionStart - now;

      if (distance <= 0) {
        // Competition has started
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

export function LeaderboardDashboard() {
  // We'll still load the data in the background, but won't display it yet
  const { data: rawData, loading, error } = useLeaderboardData()
  const { smartAccount } = useSmartAccount()

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <h1 className="text-3xl font-semibold">Trading Competition</h1>
          </div>

          {/* Upcoming Competition Banner */}
          <div className="bg-[var(--deposit-card-background)] border border-[var(--deposit-card-border)] rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Upcoming Trading Competition
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                Get ready for our next trading competition starting on March 24th and running until April 21st, 2025 (UTC).
              </p>
              <p>
                This time we're running <strong>two separate competitions</strong> to reward different trading styles:
              </p>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="bg-[var(--deposit-card-background)] border border-[var(--deposit-card-border)] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-center mb-2">Competition Starts In</h2>
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
                <strong>Competition Period:</strong> March 24, 2025 (00:00 UTC) to April 21, 2025 (23:59 UTC)
              </p>
              <p>
                <strong>Eligibility:</strong> All traders must complete at least 5 trades to qualify for prizes.
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

          {/* Stats from Previous Competition - Simplified version */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Previous Competition Stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Volume */}
              <div className="bg-[var(--deposit-card-background)] border border-[var(--deposit-card-border)] rounded-lg p-6 flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Volume</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {loading ? "Loading..." : formatDollarAmount(calculateLeaderboardStats(rawData).totalVolume)}
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
                    {loading ? "Loading..." : calculateLeaderboardStats(rawData).totalTraders.toLocaleString()}
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
                    {loading ? "Loading..." : calculateLeaderboardStats(rawData).totalTrades.toLocaleString()}
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
                    !loading && calculateLeaderboardStats(rawData).totalPnl >= 0 
                      ? "text-[var(--color-long)]" 
                      : "text-[var(--color-short)]"
                  }`}>
                    {loading ? "Loading..." : formatDollarAmount(calculateLeaderboardStats(rawData).totalPnl)}
                  </h3>
                </div>
                <div className={`${
                  !loading && calculateLeaderboardStats(rawData).totalPnl >= 0 
                    ? "bg-[var(--color-long)]/10" 
                    : "bg-[var(--color-short)]/10"
                } p-3 rounded-full`}>
                  <DollarSign className={`h-5 w-5 ${
                    !loading && calculateLeaderboardStats(rawData).totalPnl >= 0 
                      ? "text-[var(--color-long)]" 
                      : "text-[var(--color-short)]"
                  }`} />
                </div>
              </div>
            </div>
          </div>

          {/* The actual leaderboard is commented out since it won't have data until the competition starts */}
          {/* We'll uncomment and update this section when the competition begins */}
          {/* 
          <div className="space-y-8">
            <h2 className="text-xl font-semibold">Leaderboard Rankings</h2>
            <div className="border border-[var(--deposit-card-border)] rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Trader</TableHead>
                    <TableHead className="text-right">PnL</TableHead>
                    <TableHead className="text-right">Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10">
                      Competition has not started yet. Check back on March 24th!
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
          */}
        </div>
      </div>
    </div>
  )
} 