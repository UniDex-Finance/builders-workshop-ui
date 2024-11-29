"use client"

import * as React from "react"
import { ChevronDown } from 'lucide-react'
import { useWalletClient } from 'wagmi'
import { parseUnits } from 'viem'
import { useUsdm } from "@/hooks/use-usdm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUsdcPrice } from "@/hooks/use-usdc-price"

interface ActionsCardProps {
  isStaking: boolean
  setIsStaking: (value: boolean) => void
}

export function ActionsCard({ isStaking, setIsStaking }: ActionsCardProps) {
  const [amount, setAmount] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(true)
  const [action, setAction] = React.useState<'mint' | 'burn'>('mint')
  const { data: walletClient } = useWalletClient()
  const { 
    usdmData,
    approveUsdc,
    approveUsdm,
    mint,
    burn,
    refetch,
    usdcBalance, // Add this
    usdcBalanceRaw // Add this
  } = useUsdm()
  const { price: usdcPrice } = useUsdcPrice()

  const handleTransaction = async () => {
    if (!walletClient || !amount) return

    try {
      if (action === 'mint') {
        const parsedAmount = parseUnits(amount, 6) // USDC has 6 decimals
        if (usdmData && parsedAmount > usdmData.usdcAllowance) {
          const request = await approveUsdc(parsedAmount)
          if (request) {
            await walletClient.writeContract(request)
            await new Promise(r => setTimeout(r, 2000))
            await refetch()
          }
          return
        }
        
        const request = await mint(parsedAmount)
        if (request) {
          await walletClient.writeContract(request)
          setAmount("")
        }
      } else {
        // For approvals, use 18 decimals (ERC20 standard)
        const approvalAmount = parseUnits(amount, 18)
        // For burning, use 30 decimals (vault requirement)
        const burnAmount = parseUnits(amount, 18)

        if (usdmData && approvalAmount > usdmData.usdmAllowance) {
          const request = await approveUsdm(approvalAmount)
          if (request) {
            await walletClient.writeContract(request)
            await new Promise(r => setTimeout(r, 2000))
            await refetch()
          }
          return
        }
        
        const request = await burn(burnAmount)
        if (request) {
          await walletClient.writeContract(request)
          setAmount("")
        }
      }
    } catch (error) {
      console.error('Transaction failed:', error)
    }
  }

  const needsApproval = () => {
    if (!amount || !usdmData) return false
    try {
      const parsedAmount = action === 'mint'
        ? parseUnits(amount, 6)
        : parseUnits(amount, 18) // Use 18 decimals for USD.m approvals
      return action === 'mint' 
        ? parsedAmount > usdmData.usdcAllowance
        : parsedAmount > usdmData.usdmAllowance
    } catch {
      return false
    }
  }

  // Update the button text based on action and approval status
  const getButtonText = () => {
    if (needsApproval()) {
      return action === 'mint' ? 'Approve USDC' : 'Approve USD.m'
    }
    return action === 'mint' ? 'Mint USD.m' : 'Burn USD.m'
  }

  // Fix: Update getAvailableBalance to use correct balance
  const getAvailableBalance = () => {
    if (action === 'mint') {
      return `Available: ${usdcBalance} USDC`
    }
    return `Available: ${usdmData?.displayUsdmBalance || '0.00'} USD.m`
  }

  // Add: Handle max button click
  const handleMaxClick = () => {
    if (action === 'mint') {
      setAmount(usdcBalance)
    } else {
      setAmount(usdmData?.displayUsdmBalance || '0')
    }
  }

  // Update canSubmit function to use correct decimal places for validation
  const canSubmit = () => {
    if (!amount || amount === '0') return false
    try {
      if (action === 'mint') {
        const parsedAmount = parseUnits(amount, 6)
        return parsedAmount <= usdcBalanceRaw
      } else {
        // Use 18 decimals when checking USD.m balance
        const parsedAmount = parseUnits(amount, 18)
        return parsedAmount <= (usdmData?.usdmBalance || BigInt(0))
      }
    } catch {
      return false
    }
  }

  // Update percentage buttons to work
  const handlePercentageClick = (percentage: number) => {
    if (action === 'mint') {
      const value = (Number(usdcBalance) * percentage).toFixed(6)
      setAmount(value)
    } else {
      // Update to show fewer decimal places for USD.m
      const value = (Number(usdmData?.formattedUsdmBalance || 0) * percentage).toFixed(6)
      setAmount(value)
    }
  }

  const calculateUsdValue = (inputAmount: string) => {
    if (!inputAmount) return '0.00'
    
    // Use USDC price when minting, USD.m price when burning
    const price = action === 'mint' 
      ? usdcPrice 
      : Number(usdmData?.formattedUsdmPrice || 0)
      
    const usdValue = Number(inputAmount) * price
    return usdValue.toFixed(2)
  }

  // Update calculate output amount to account for fees
  const calculateOutputAmount = (inputAmount: string) => {
    if (!inputAmount || !usdmData) return '0.00'
    try {
      const input = Number(inputAmount)
      const fee = input * 0.0025 // 0.25% fee
      const amountAfterFees = input - fee
      const usdmPrice = Number(usdmData.formattedUsdmPrice)

      if (action === 'mint') {
        // When minting: (USDC amount - fees) / USDM price
        // Example: 9.975 USDC / 1.03847 = 9.6054 USDM
        return (amountAfterFees / usdmPrice).toFixed(6)
      } else {
        // When burning: (USDM amount - fees) * USDM price
        // Example: If burning 10 USDM with 1.03847 price
        // 9.975 USDM * 1.03847 = 10.35873 USDC
        return (amountAfterFees * usdmPrice).toFixed(6)
      }
    } catch {
      return '0.00'
    }
  }

  // Update the fee calculation to show 2 decimal places
  const calculateFees = (inputAmount: string) => {
    if (!inputAmount) return '0.00'
    try {
      const input = Number(inputAmount)
      const fee = input * 0.0025 // 0.25%
      return fee.toFixed(2) // Changed from toFixed(6) to toFixed(2)
    } catch {
      return '0.00'
    }
  }

  return (
    <Card className="bg-[#16161D] border-[#1b1b22]">
      <CardHeader className="pt-4 pb-0">
        <div className="flex items-center justify-between">
          <CardTitle>{action === 'mint' ? 'Mint' : 'Burn'} USD.m</CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              className={`text-[#A0AEC0] hover:text-white ${action === 'mint' ? 'bg-[#272734]' : ''}`}
              onClick={() => setAction('mint')}
            >
              Mint
            </Button>
            <Button 
              variant="ghost" 
              className={`text-[#A0AEC0] hover:text-white ${action === 'burn' ? 'bg-[#272734]' : ''}`}
              onClick={() => setAction('burn')}
            >
              Burn
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        <div className="space-y-4">
          <div className="relative mb-2">
            <div className="flex gap-2">
              <Select defaultValue="usdc" disabled>
                <SelectTrigger className="w-[140px] h-[42px] bg-[#272734] border-0 focus:ring-0">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-6 h-6 text-sm bg-blue-500 rounded-full">
                        $
                      </div>
                      <span>USDC</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usdc">USDC</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-[42px] bg-[#272734] border-0 text-lg pr-20"
                  placeholder="0.00"
                />
                <div className="absolute text-[#A0AEC0] -translate-y-1/2 right-3 top-1/2">
                  ~${calculateUsdValue(amount)}
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-[#A0AEC0]">
            {getAvailableBalance()}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {["25", "50", "75", "100"].map((percent) => (
              <Button
                key={percent}
                variant="outline"
                className="bg-[#272734] border-0 hover:bg-[#373745]"
                onClick={() => handlePercentageClick(Number(percent) / 100)}
              >
                {percent}%
              </Button>
            ))}
          </div>

          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-[#272734] rounded-lg">
              <span className="text-[#A0AEC0]">Summary</span>
              <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="bg-[#272734] rounded-lg mt-px p-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#A0AEC0]">Balance</span>
                  <div className="flex items-center gap-2">
                    <span>0.00</span>
                    <span className="text-[#A0AEC0]">→</span>
                    <span>{amount ? calculateOutputAmount(amount) : '0.00'}</span>
                    <span className="text-[#A0AEC0]">{action === 'mint' ? 'USD.m' : 'USDC'}</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#A0AEC0]">Fees (0.25%)</span>
                  <div className="flex items-center gap-2">
                    <span>{amount ? calculateFees(amount) : '0.00'}</span>
                    <span className="text-[#A0AEC0]">{action === 'mint' ? 'USDC' : 'USD.m'}</span>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Button 
            className="w-full h-14 bg-[#7C5CFF] hover:bg-[#6B4FE0] text-base"
            onClick={handleTransaction}
            disabled={!canSubmit()}
          >
            {getButtonText()}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}