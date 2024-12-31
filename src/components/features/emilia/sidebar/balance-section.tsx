'use client'

import { useBalances } from "@/hooks/use-balances"
import { Button } from "@/components/ui/button"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { useAccount } from "wagmi"
import { useSmartAccount } from "@/hooks/use-smart-account"
import { Copy, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon'

interface AddressDisplayProps {
  label: string
  address?: string
  explorerUrl?: string
}

function AddressDisplay({ label, address, explorerUrl }: AddressDisplayProps) {
  const { toast } = useToast()

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast({
        title: "Address copied",
        description: "Address copied to clipboard",
      })
    }
  }

  const handleExplorer = () => {
    if (explorerUrl) {
      window.open(explorerUrl, '_blank')
    }
  }

  return (
    <div className="flex items-start space-x-3">
      {address && (
        <div className="mt-1">
          <Jazzicon diameter={20} seed={jsNumberForAddress(address)} />
        </div>
      )}
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-mono text-sm">
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not Connected"}
        </div>
      </div>
      {address && (
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="p-0 h-7 w-7 hover:bg-zinc-800"
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExplorer}
            className="p-0 h-7 w-7 hover:bg-zinc-800"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}

interface BalanceSectionProps {
  onBalanceChange?: (balance: number) => void;
}

export function BalanceSection({ onBalanceChange }: BalanceSectionProps) {
  const { balances, isLoading } = useBalances("arbitrum")
  const { address: eoaAddress } = useAccount()
  const { smartAccount } = useSmartAccount()

  const getExplorerUrl = (address: string) => {
    return `https://arbiscan.io/address/${address}`
  }

  const calculateTotalEquity = () => {
    if (isLoading) return "Loading..."
    const musdBalance = parseFloat(balances?.formattedMusdBalance || "0")
    const usdcBalance = parseFloat(balances?.formattedUsdcBalance || "0")
    return `$${(musdBalance + usdcBalance).toFixed(2)}`
  }

  const calculateTradingAccount = () => {
    if (isLoading) return "Loading..."
    const musdBalance = parseFloat(balances?.formattedMusdBalance || "0")
    const usdcBalance = parseFloat(balances?.formattedUsdcBalance || "0")
    const total = musdBalance + usdcBalance
    
    onBalanceChange?.(total)
    
    return `$${total.toFixed(2)}`
  }

  return (
    <div className="p-4 space-y-4 border-b border-zinc-800">
      {/* Addresses */}
      <div className="space-y-3">
        <AddressDisplay
          label="Source Address"
          address={eoaAddress}
          explorerUrl={eoaAddress ? getExplorerUrl(eoaAddress) : undefined}
        />
        <AddressDisplay
          label="Trading Address"
          address={smartAccount?.address}
          explorerUrl={smartAccount?.address ? getExplorerUrl(smartAccount.address) : undefined}
        />
      </div>

      <div className="h-px bg-zinc-800" />

      {/* Balance Overview */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Net Worth</div>
          <div className="text-2xl font-semibold">{calculateTotalEquity()}</div>
        </div>
        <div className="space-y-1 text-right">
          <div className="text-sm text-muted-foreground">Trading Account</div>
          <div className="text-lg">{calculateTradingAccount()}</div>
        </div>
      </div>

      {/* Deposit/Withdraw Buttons */}
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm"
          className="flex-1 border-transparent bg-zinc-800 hover:bg-zinc-700"
        >
          Deposit
        </Button>
        <Button 
          variant="outline"
          size="sm"
          className="flex-1 border-transparent bg-zinc-800 hover:bg-zinc-700"
        >
          Withdraw
        </Button>
      </div>
    </div>
  )
} 