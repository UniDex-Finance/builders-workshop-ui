'use client'

import { useState } from "react"
import { Header } from "../../shared/Header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpIcon } from 'lucide-react'
import { useCallApi } from '@/hooks/emilia-hooks/use-call-api'
import { LoadingDots } from '@/components/ui/loading-dots'
import { StreamingText } from '@/components/ui/streaming-text'
import { TradeSummary } from './trade-summary'

export function EmiliaChat() {
  const [message, setMessage] = useState("")
  const [pendingTrades, setPendingTrades] = useState<any[] | null>(null)
  
  // TODO: Get actual balance from AccountSummary
  const { chatHistory, isLoading, sendMessage } = useCallApi({ 
    balance: 1000 
  })

  const handleSendMessage = async () => {
    if (!message.trim()) return
    
    const response = await sendMessage(message)
    if (response?.trades) {
      setPendingTrades(response.trades)
    }
    setMessage("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleExampleClick = (exampleMessage: string) => {
    setMessage(exampleMessage)
  }

  const handleConfirmTrade = () => {
    setPendingTrades(null)
    sendMessage("Yes, execute the trade")
  }

  const handleRejectTrade = () => {
    setPendingTrades(null)
    sendMessage("No, cancel the trade")
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-3xl mx-auto space-y-4">
          {chatHistory.length === 0 ? (
            <div className="my-8 space-y-4 text-center">
              <h2 className="text-xl font-medium text-zinc-200">
                Send Emilia a message to get started
              </h2>
              <div className="space-y-2 text-sm text-zinc-400">
                <p>Try these example prompts:</p>
                <div className="space-y-1">
                  <p 
                    className="cursor-pointer hover:text-zinc-300"
                    onClick={() => handleExampleClick("I want to long ETH with 20x leverage with $1")}
                  >
                    "I want to long ETH with 20x leverage with $1"
                  </p>
                  <p 
                    className="cursor-pointer hover:text-zinc-300"
                    onClick={() => handleExampleClick("Short BTC with 10x leverage using $5")}
                  >
                    "Short BTC with 10x leverage using $5"
                  </p>
                  <p 
                    className="cursor-pointer hover:text-zinc-300"
                    onClick={() => handleExampleClick("Long SOL with $2 at 15x leverage")}
                  >
                    "Long SOL with $2 at 15x leverage"
                  </p>
                </div>
              </div>
            </div>
          ) : (
            chatHistory.map((msg, index) => (
              <div key={index}>
                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  <div className={`${
                    msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-white'
                  } rounded-lg p-3 max-w-[80%]`}>
                    {msg.role === 'user' ? (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <StreamingText text={msg.content} />
                    )}
                  </div>
                </div>
                {msg.role === 'assistant' && 
                 index === chatHistory.length - 1 && 
                 pendingTrades && (
                  <TradeSummary
                    trades={pendingTrades}
                    onConfirm={handleConfirmTrade}
                    onReject={handleRejectTrade}
                  />
                )}
              </div>
            ))
          )}
          {isLoading && <LoadingDots />}
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
              onKeyPress={handleKeyPress}
              rows={1}
              disabled={isLoading}
            />
            <Button 
              size="icon"
              className="absolute -translate-y-1/2 right-3 top-1/2 bg-zinc-800 hover:bg-zinc-700"
              onClick={handleSendMessage}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white rounded-full animate-spin border-t-transparent" />
              ) : (
                <ArrowUpIcon className="w-4 h-4" />
              )}
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
