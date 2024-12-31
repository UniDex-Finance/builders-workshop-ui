'use client'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Trade {
  isLong: boolean
  Pair: string
  Leverage: string
  Collateral: string
}

interface TradeSummaryProps {
  trades: Trade[]
  onConfirm: () => void
  onReject: () => void
}

export function TradeSummary({ trades, onConfirm, onReject }: TradeSummaryProps) {
  return (
    <div className="flex flex-col p-4 mt-2 space-y-4 rounded-lg bg-zinc-800/50 animate-fade-in">
      {trades.map((trade, index) => (
        <div key={index} className="space-y-2">
          {trades.length > 1 && (
            <div className="text-sm text-zinc-400">Trade {index + 1}</div>
          )}
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant="outline" 
              className={`${
                trade.isLong ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
              } px-2 py-0.5 text-xs border-transparent`}
            >
              Side: {trade.isLong ? 'Longing' : 'Shorting'}
            </Badge>
            <Badge 
              variant="outline" 
              className="bg-zinc-800 text-zinc-300 px-2 py-0.5 text-xs border-zinc-700"
            >
              Pair: {trade.Pair}
            </Badge>
            <Badge 
              variant="outline" 
              className="bg-zinc-800 text-zinc-300 px-2 py-0.5 text-xs border-zinc-700"
            >
              Leverage: {trade.Leverage}
            </Badge>
            <Badge 
              variant="outline" 
              className="bg-zinc-800 text-zinc-300 px-2 py-0.5 text-xs border-zinc-700"
            >
              Collateral: ${trade.Collateral}
            </Badge>
          </div>
        </div>
      ))}
      
      <div className="flex gap-2 pt-2">
        <Button
          onClick={onConfirm}
          className="flex-1 text-green-500 bg-green-500/20 hover:bg-green-500/30"
        >
          Yes, Execute Trade
        </Button>
        <Button
          onClick={onReject}
          className="flex-1 text-red-500 bg-red-500/20 hover:bg-red-500/30"
        >
          No, Cancel
        </Button>
      </div>
    </div>
  )
} 