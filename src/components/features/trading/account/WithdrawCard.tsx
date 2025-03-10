"use client"

import { X, ArrowRight } from 'lucide-react'
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
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
  const { smartAccount, kernelClient } = useSmartAccount()
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
          className={`w-3 h-3 ${isIncrease ? 'text-long' : 'text-short'}`}
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
        const response = await fetch(
          "https://unidexv4-api-production.up.railway.app/api/wallet",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "withdraw",
              tokenAddress: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
              amount,
              userAddress: smartAccount.address,
              fromMargin: true,
            }),
          }
        );

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to process margin withdrawal");
        }

        await kernelClient.sendTransaction({
          to: data.vaultAddress,
          data: data.calldata,
        });
      }

      onSuccess?.();
      setAmount("");
      
      toast({
        title: "Success",
        description: `Successfully withdrawn ${amount} USDC from ${
          selectedSource === "1ct" ? "1CT wallet" : "margin wallet"
        }`,
      });

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
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-md bg-[var(--deposit-card-background)] border-zinc-800 p-6"
        hideClose
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Withdraw</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="block mb-2 text-sm font-medium">
                Source Wallet
              </label>
              
              <Select
                value={selectedSource}
                onValueChange={(value) => setSelectedSource(value as WithdrawSource)}
              >
                <SelectTrigger className="w-full bg-[#272734] border-zinc-800 h-[52px] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <SelectValue placeholder="Select Source" />
                </SelectTrigger>
                <SelectContent className="bg-[#272734] border-zinc-800">
                  <SelectItem value="1ct">1CT Wallet</SelectItem>
                  <SelectItem value="margin">Margin Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="relative">
              <label className="block mb-2 text-sm font-medium">
                Amount
              </label>
              
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
            variant="market"
            className="w-full mt-4 h-[52px]"
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
        </div>
      </DialogContent>
    </Dialog>
  );
} 