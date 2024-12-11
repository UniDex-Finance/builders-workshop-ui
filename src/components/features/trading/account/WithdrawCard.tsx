"use client"

import { X, ArrowRight } from 'lucide-react'
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TokenIcon } from "@/hooks/use-token-icon"
import { useAccount, useSwitchChain } from "wagmi"
import { useSmartAccount } from "@/hooks/use-smart-account"
import { useToast } from "@/hooks/use-toast"
import { useTokenTransferActions } from "@/hooks/use-token-transfer-actions"
import { arbitrum } from "wagmi/chains"

interface WithdrawCardProps {
  onClose: () => void;
  balances?: any;
  onSuccess?: () => void;
}

type WithdrawSource = "margin" | "1ct";

export function WithdrawCard({ onClose, balances, onSuccess }: WithdrawCardProps) {
  const [amount, setAmount] = useState("")
  const [selectedSource, setSelectedSource] = useState<WithdrawSource>("1ct")
  const [isLoading, setIsLoading] = useState(false)
  const { address, chain } = useAccount()
  const { smartAccount } = useSmartAccount()
  const { toast } = useToast()
  const { withdrawFromSmartAccount } = useTokenTransferActions()
  const { switchChain } = useSwitchChain()

  const isOnArbitrum = chain?.id === arbitrum.id

  const getAvailableBalance = () => {
    if (!balances) return "0.0000";
    return selectedSource === "margin" 
      ? balances.formattedMusdBalance 
      : balances.formattedUsdcBalance;
  };

  const isAmountExceedingBalance = () => {
    const availableBalance = getAvailableBalance();
    return parseFloat(amount) > parseFloat(availableBalance);
  };

  const getBalanceWithArrow = (currentBalance: number, newBalance: number) => {
    const isIncrease = newBalance > currentBalance;
    return (
      <div className="flex items-center gap-1">
        <span>{currentBalance.toFixed(2)}</span>
        <ArrowRight 
          className={`w-3 h-3 ${isIncrease ? 'text-green-400' : 'text-red-400'}`}
        />
        <span>{newBalance.toFixed(2)}</span>
      </div>
    );
  };

  const getWebWalletBalance = () => {
    if (!balances?.formattedEoaUsdcBalance) return "—";
    const currentBalance = parseFloat(balances.formattedEoaUsdcBalance);
    const newBalance = currentBalance + (parseFloat(amount) || 0);
    return getBalanceWithArrow(currentBalance, newBalance);
  };

  const getSourceWalletBalance = () => {
    if (!balances) return "—";
    const currentBalance = selectedSource === "margin"
      ? parseFloat(balances.formattedMusdBalance)
      : parseFloat(balances.formattedUsdcBalance);
    const newBalance = currentBalance - (parseFloat(amount) || 0);
    return getBalanceWithArrow(currentBalance, newBalance);
  };

  const handleWithdraw = async () => {
    if (!isOnArbitrum) {
      switchChain?.({ chainId: arbitrum.id })
      return
    }

    if (!address || !smartAccount?.address) {
      toast({
        title: "Error",
        description: "Please connect your wallet and ensure 1CT wallet is setup",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (selectedSource === "1ct") {
        await withdrawFromSmartAccount(amount, address);
      } else {
        // Handle margin withdrawal logic here
        // This would likely involve a different function call
        console.log("Margin withdrawal not implemented yet");
      }
      
      toast({
        title: "Success",
        description: "Withdrawal completed successfully",
      });

      onSuccess?.();
      onClose();
      setAmount("");

    } catch (error: any) {
      console.error("Withdrawal error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process withdrawal",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex md:items-center md:justify-center">
      {/* Mobile overlay */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" />
      
      <Card className={`
        z-50
        w-full
        bg-[#17161d]
        text-white
        border-zinc-800
        p-4
        
        /* Mobile styles */
        fixed
        bottom-0
        rounded-b-none
        animate-slide-up-mobile
        
        /* Desktop styles */
        md:relative
        md:animate-none
        md:w-[440px]
        md:rounded-lg
      `}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Withdraw</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="text-zinc-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <CardContent className="p-0 space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm text-zinc-500 mb-1.5 block">Withdraw From</label>
              <Select value={selectedSource} onValueChange={(value: WithdrawSource) => setSelectedSource(value)}>
                <SelectTrigger className="bg-[#272734] border-zinc-800 h-[52px]">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <TokenIcon pair="USDC" size={24} />
                      <span>{selectedSource === "margin" ? "Margin Wallet" : "1CT Wallet"}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#272734] border-zinc-800">
                  <SelectItem value="1ct">
                    <div className="flex items-center gap-2">
                      <TokenIcon pair="USDC" size={24} />
                      <span>1CT Wallet</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="margin">
                    <div className="flex items-center gap-2">
                      <TokenIcon pair="USDC" size={24} />
                      <span>Margin Wallet</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-zinc-500 mb-1.5 block">Amount</label>
              <div className="relative">
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#272734] border-zinc-800 rounded-md px-3 h-[52px] text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.0000"
                />
                {amount !== getAvailableBalance() && (
                  <button 
                    onClick={() => setAmount(getAvailableBalance())}
                    className="absolute -translate-y-1/2 right-4 top-1/2 
                      text-xs font-medium
                      bg-[#272734] hover:bg-[#323242]
                      text-zinc-400 hover:text-white
                      px-2 py-1 rounded-md
                      transition-colors"
                  >
                    MAX
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Available</span>
              <span className="text-sm">
                {getAvailableBalance()}
              </span>
            </div>
          </div>

          <div className="space-y-2 bg-[#272734] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Withdrawal Amount</span>
              <span className="text-sm">{amount || "0.0000"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">
                {selectedSource === "margin" ? "Margin Wallet" : "1CT Wallet"}
              </span>
              <span className="text-sm">{getSourceWalletBalance()}</span>
            </div>
            {selectedSource === "1ct" && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Web Wallet</span>
                <span className="text-sm">{getWebWalletBalance()}</span>
              </div>
            )}
          </div>

          <Button 
            className="w-full h-[52px] bg-[#7142cf] hover:bg-[#7142cf]/80 text-white"
            disabled={
              !amount || 
              parseFloat(amount) <= 0 || 
              isLoading ||
              isAmountExceedingBalance()
            }
            onClick={handleWithdraw}
          >
            {!isOnArbitrum
              ? "Switch to Arbitrum"
              : isLoading 
                ? "Processing..." 
                : "Withdraw"
            }
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 