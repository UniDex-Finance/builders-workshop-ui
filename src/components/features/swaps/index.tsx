'use client'

import * as React from "react"
import { Settings, ChevronDown, ArrowDown } from 'lucide-react'
import { TokenSelector } from "./TokenSelector"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Header } from "../../shared/Header"
import { useTokenList, type Token } from '@/hooks/use-token-list'
import { useTokenListBalances } from "@/hooks/use-tokenlist-balances"
import { useSwapWorkflow } from "./hooks"

export function Swaps() {
  const { tokens } = useTokenList()
  const [tokenSelectorOpen, setTokenSelectorOpen] = React.useState(false)
  const [selectedField, setSelectedField] = React.useState<'input' | 'output'>('input')
  const [inputAmount, setInputAmount] = React.useState("")
  const { balances } = useTokenListBalances(tokens)
  const [routesExpanded, setRoutesExpanded] = React.useState(false)
  
  const defaultInputToken = tokens.find(t => t.address === '0xaf88d065e77c8cC2239327C5EDb3A432268e5831')
  const defaultOutputToken = tokens.find(t => t.address === '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1')
  
  const [inputToken, setInputToken] = React.useState<Token>(defaultInputToken || { 
    symbol: 'USDC', 
    name: 'USD Coin', 
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
    address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    decimals: 6
  })
  const [outputToken, setOutputToken] = React.useState<Token>(defaultOutputToken || { 
    symbol: 'WETH', 
    name: 'Wrapped Ether', 
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
    address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    decimals: 18
  })

  const inputBalance = balances.find(t => t.address === inputToken.address)
  const outputBalance = balances.find(t => t.address === outputToken.address)

  const {
    quote,
    outputAmount,
    exchangeRate,
    isLoading,
    error,
    handleSwap,
    selectedRouteName,
    allQuotes
  } = useSwapWorkflow({
    inputToken,
    outputToken,
    inputAmount: inputAmount ? inputAmount : undefined,
  })

  const handleTokenSelect = (token: Token) => {
    if (selectedField === 'input') {
      setInputToken(token)
    } else {
      setOutputToken(token)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimals
    const value = e.target.value
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setInputAmount(value)
    }
  }

  const onSwap = async () => {
    try {
      await handleSwap()
      setInputAmount('') // Reset form on success
    } catch (error) {
      console.error('Swap failed:', error)
      // Error is handled by the hook and displayed in UI
    }
  }

  // Get all route quotes for comparison display
  const routeQuotes = Object.entries(allQuotes).map(([routeName, { quote, isLoading }]) => ({
    name: routeName,
    amount: quote?.outAmounts?.[0] || '0.0',
    loading: isLoading
  }))

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2" />
          </div>
          
          <TooltipProvider>
            <div className="w-full max-w-md mx-auto space-y-4">
              <div className="flex items-center justify-end">
                <Button variant="ghost" size="icon" className="text-gray-400">
                  <Settings className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-1">
                <div className="p-4 bg-neutral-900 rounded-xl">
                  {/* Sell Section */}
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Sell</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={inputAmount}
                      onChange={handleInputChange}
                      placeholder="0.0"
                      className="w-1/2 text-4xl bg-transparent focus:outline-none"
                    />
                    <div className="flex flex-col items-end">
                      <button
                        onClick={() => {
                          setSelectedField('input')
                          setTokenSelectorOpen(true)
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800"
                      >
                        <img
                          src={inputToken.icon}
                          className="w-6 h-6 rounded-full"
                          alt={inputToken.name}
                        />
                        {inputToken.symbol}
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {inputBalance && (
                        <span className="mt-1 text-sm text-gray-400">
                          Balance: {Number(inputBalance.formattedBalance).toFixed(4)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    ${quote?.inValues?.[0]?.toFixed(2) || "0.00"}
                  </div>
                </div>

                <div className="relative flex justify-center">
                  <div className="absolute flex items-center -top-3 -bottom-3">
                    <div className="p-2 rounded-xl bg-[#232323]">
                      <ArrowDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-neutral-900 rounded-xl">
                  {/* Buy Section */}
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Buy</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={isLoading ? "Loading..." : outputAmount}
                      readOnly
                      className="w-1/2 text-4xl bg-transparent opacity-50 cursor-not-allowed focus:outline-none"
                    />
                    <div className="flex flex-col items-end">
                      <button
                        onClick={() => {
                          setSelectedField('output')
                          setTokenSelectorOpen(true)
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800"
                      >
                        <img
                          src={outputToken.icon}
                          className="w-6 h-6 rounded-full"
                          alt={outputToken.name}
                        />
                        {outputToken.symbol}
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {outputBalance && (
                        <span className="mt-1 text-sm text-gray-400">
                          Balance: {Number(outputBalance.formattedBalance).toFixed(4)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    ${quote?.outValues?.[0]?.toFixed(2) || "0.00"}
                  </div>
                </div>
              </div>

              <Button 
                className="w-full py-6 text-white bg-pink-500 hover:bg-pink-600"
                onClick={onSwap}
                disabled={!quote || !inputAmount || isLoading}
              >
                {isLoading ? 'Loading...' : !quote ? 'Enter an amount' : 'Review'}
              </Button>

              {error && (
                <div className="p-3 text-sm text-short rounded-lg bg-short/10">
                  {error}
                </div>
              )}


                {/* Rate Section */}
                <div className="flex items-center justify-between text-gray-400">
                  <div className="flex items-center gap-1">
                    Rate: 1 {inputToken.symbol} = {exchangeRate} {outputToken.symbol}
                    <span className="text-gray-500">
                      (${quote?.inValues?.[0]?.toFixed(2) || "0.00"})
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </div>
                
              <div className="space-y-3 text-sm">
                {/* Order Routing Section */}
                <div
                  onClick={() => setRoutesExpanded(!routesExpanded)}
                  className="flex items-center justify-between text-gray-400 cursor-pointer"
                >
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1">
                      Order Routing
                      <div className="w-4 h-4 text-xs text-center bg-gray-700 rounded-full">?</div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Selected route for best price</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="flex items-center gap-2">
                    <span className="capitalize">{selectedRouteName || 'Auto'}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${routesExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expandable Route Details */}
                {routesExpanded && (
                  <div className="p-4 space-y-2 rounded-lg bg-neutral-800">
                    <div className="font-medium text-gray-400">Available Routes</div>
                    {routeQuotes.map(({ name, amount, loading }) => (
                      <div key={name} className="flex items-center justify-between">
                        <span className={`capitalize ${name === selectedRouteName ? 'text-pink-500' : 'text-gray-400'}`}>
                          {name}
                          {name === selectedRouteName && ' (Best)'}
                        </span>
                        <span className="text-gray-300">
                          {loading ? 'Loading...' : `${amount} ${outputToken.symbol}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-gray-400">
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1">
                      Price Impact
                      <div className="w-4 h-4 text-xs text-center bg-gray-700 rounded-full">?</div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Price impact on trade</p>
                    </TooltipContent>
                  </Tooltip>
                  <span>{quote?.priceImpact ? (quote.priceImpact).toFixed(2) : '0.00'}%</span>
                </div>

                <div className="flex items-center justify-between text-gray-400">
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1">
                      Network cost
                      <div className="w-4 h-4 text-xs text-center bg-gray-700 rounded-full">?</div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Estimated network fee</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="flex items-center gap-1">
                    <img
                      src="/placeholder.svg?height=16&width=16"
                      className="w-4 h-4 rounded-full"
                      alt="Network"
                    />
                    ${quote?.gasEstimateValue?.toFixed(2) || '0.00'}
                  </div>
                </div>

                <div className="flex items-center justify-between text-gray-400">
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1">
                      Max slippage
                      <div className="w-4 h-4 text-xs text-center bg-gray-700 rounded-full">?</div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Maximum price slippage</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="flex items-center gap-2">
                    <span className="px-2 bg-gray-800 rounded py-1px">Auto</span>
                    <span>0.3%</span>
                  </div>
                </div>
              </div>

              <TokenSelector
                open={tokenSelectorOpen}
                onClose={() => setTokenSelectorOpen(false)}
                onSelect={handleTokenSelect}
              />
            </div>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}
