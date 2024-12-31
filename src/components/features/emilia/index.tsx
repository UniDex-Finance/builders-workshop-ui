'use client'

import { useState } from "react"
import { Header } from "../../shared/Header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpIcon } from 'lucide-react'

export function EmiliaChat() {
  const [message, setMessage] = useState("")

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex justify-end">
            <div className="bg-blue-600 text-white rounded-lg p-3 max-w-[80%]">
              <p className="text-sm">How do I calculate the Sharpe ratio?</p>
            </div>
          </div>
          <div className="flex justify-start">
            <div className="bg-zinc-800 text-white rounded-lg p-3 max-w-[80%]">
              <p className="text-sm">The Sharpe ratio is a measure of risk-adjusted return for a financial portfolio or investment. Here's how to calculate it:</p>
              <ol className="mt-2 space-y-1 text-sm list-decimal list-inside">
                <li>Calculate the expected return of the portfolio</li>
                <li>Calculate the risk-free rate of return</li>
                <li>Determine the standard deviation of the portfolio's excess return</li>
                <li>Apply the formula: (Expected Return - Risk-Free Rate) / Standard Deviation of Excess Return</li>
              </ol>
              <p className="mt-2 text-sm">A higher Sharpe ratio indicates better risk-adjusted performance. Generally, a ratio greater than 1 is considered good, greater than 2 is very good, and 3 or higher is excellent.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Input Section */}
      <div className="p-4 border-t border-zinc-800">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <textarea
              className="w-full bg-zinc-900 text-white placeholder-zinc-400 rounded-lg p-4 pr-16 resize-none border border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-700 min-h-[60px]"
              placeholder="Ask a follow up..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={1}
            />
            <Button 
              size="icon"
              className="absolute -translate-y-1/2 right-3 top-1/2 bg-zinc-800 hover:bg-zinc-700"
            >
              <ArrowUpIcon className="w-4 h-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-2">
              <Badge 
                variant="outline" 
                className="bg-zinc-900 text-zinc-400 hover:bg-zinc-900 rounded-none px-2 py-0.5 text-xs border-zinc-700"
              >
                Leverage: 50x
              </Badge>
              <Badge 
                variant="outline" 
                className="bg-zinc-900 text-zinc-400 hover:bg-zinc-900 rounded-none px-2 py-0.5 text-xs border-zinc-700"
              >
                Margin: $1
              </Badge>
              <Badge 
                variant="outline" 
                className="bg-zinc-900 text-zinc-400 hover:bg-zinc-900 rounded-none px-2 py-0.5 text-xs border-zinc-700"
              >
                Referrer: 0xKrunal
              </Badge>
            </div>
            <p className="text-[10px] text-zinc-600">
              Emilia by UniDex may make mistakes. Please use with discretion.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
