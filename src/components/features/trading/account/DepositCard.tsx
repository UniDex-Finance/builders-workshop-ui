"use client"

import { X, ArrowRight } from 'lucide-react'
import { useState, useEffect } from "react"
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
import { arbitrum, optimism } from "wagmi/chains"
import { CrossChainDepositCall } from "../deposit/CrossChainDepositCall"
import { formatUnits } from "viem"
import { parseUnits } from "viem"
import Image from "next/image"
import USDCIcon from "@/../../public/static/images/tokens/USDC.svg"

interface DepositCardProps {
  onClose: () => void;
  balances?: any;
  onSuccess?: () => void;
}

interface QuoteData {
  estimate?: {
    toAmount: string;
  };
  feeCosts?: Array<{
    name: string;
    amount: string;
  }>;
}

export function DepositCard({ onClose, balances, onSuccess }: DepositCardProps) {
  const [amount, setAmount] = useState("")
  const [selectedChain, setSelectedChain] = useState("arbitrum")
  const [isLoading, setIsLoading] = useState(false)
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null)
  const { address, chain } = useAccount()
  const { smartAccount } = useSmartAccount()
  const { toast } = useToast()
  const { switchChain } = useSwitchChain()
  const { transferToSmartAccount } = useTokenTransferActions()

  // Only fetch quote if we're on Optimism
  useEffect(() => {
    const fetchQuote = async () => {
      if (
        selectedChain !== "optimism" || 
        !amount || 
        parseFloat(amount) <= 0 || 
        !address || 
        !smartAccount?.address
      ) {
        setQuoteData(null);
        return;
      }

      try {
        const amountInUsdcUnits = parseUnits(amount, 6).toString();
        const quoteUrl = `https://li.quest/v1/quote?fromChain=10&toChain=42161&fromToken=0x0b2c639c533813f4aa9d7837caf62653d097ff85&toToken=0xaf88d065e77c8cc2239327c5edb3a432268e5831&fromAddress=${address}&toAddress=${smartAccount.address}&fromAmount=${amountInUsdcUnits}&integrator=unidex&allowBridges=across&skipSimulation=true`;
        
        const response = await fetch(quoteUrl);
        if (!response.ok) return;
        
        const data = await response.json();
        setQuoteData(data);
      } catch (error) {
        console.error("Error fetching quote:", error);
      }
    };

    const timeoutId = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timeoutId);
  }, [amount, address, smartAccount?.address, selectedChain]);

  const isOnCorrectChain = () => {
    if (selectedChain === "arbitrum") {
      return chain?.id === arbitrum.id;
    } else {
      return chain?.id === optimism.id;
    }
  };

  const handleSwitchNetwork = () => {
    if (selectedChain === "arbitrum") {
      switchChain?.({ chainId: arbitrum.id });
    } else {
      switchChain?.({ chainId: optimism.id });
    }
  };

  const getAvailableBalance = () => {
    if (!balances) return "0.0000";
    return selectedChain === "arbitrum" 
      ? balances.formattedEoaUsdcBalance 
      : balances.formattedEoaOptimismUsdcBalance;
  };

  const isAmountExceedingBalance = () => {
    const availableBalance = getAvailableBalance();
    return parseFloat(amount) > parseFloat(availableBalance);
  };

  const getExpectedDepositAmount = () => {
    if (selectedChain === "arbitrum") {
      return amount || "0";
    }
    if (!quoteData?.estimate?.toAmount) return "—";
    return formatUnits(BigInt(quoteData.estimate.toAmount), 6);
  };

  const getRelayerFee = () => {
    if (selectedChain === "arbitrum") {
      return "0";
    }
    if (!quoteData?.feeCosts) return "—";
    const relayerFee = quoteData.feeCosts.find(fee => fee.name === "Relayer gas fee");
    return relayerFee ? formatUnits(BigInt(relayerFee.amount), 6) : "—";
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

  const getCurrentAndNewBalance = () => {
    if (!balances?.formattedUsdcBalance) return "—";
    const currentBalance = parseFloat(balances.formattedUsdcBalance);
    
    if (selectedChain === "arbitrum") {
      const newBalance = currentBalance + (parseFloat(amount) || 0);
      return getBalanceWithArrow(currentBalance, newBalance);
    }

    if (!quoteData?.estimate?.toAmount) return "—";
    const addedAmount = parseFloat(formatUnits(BigInt(quoteData.estimate.toAmount), 6));
    return getBalanceWithArrow(currentBalance, currentBalance + addedAmount);
  };

  const handleDeposit = async () => {
    if (!address || !smartAccount?.address) {
      toast({
        title: "Error",
        description: "Please connect your wallet and ensure 1CT wallet is setup",
        variant: "destructive",
      });
      return;
    }

    if (selectedChain === "optimism") {
      if (!isOnCorrectChain()) {
        handleSwitchNetwork();
        return;
      }
      return;
    }

    if (!isOnCorrectChain()) {
      handleSwitchNetwork();
      return;
    }

    setIsLoading(true);
    try {
      await transferToSmartAccount(amount, address);
      
      toast({
        title: "Success",
        description: "Deposit completed successfully",
      });

      onSuccess?.();
      onClose();
      setAmount("");

    } catch (error: any) {
      console.error("Deposit error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process deposit",
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
          <h3 className="text-lg font-medium">Deposit</h3>
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
              <label className="text-sm text-zinc-500 mb-1.5 block">Source</label>
              <Select value={selectedChain} onValueChange={setSelectedChain}>
                <SelectTrigger className="bg-[#272734] border-zinc-800 h-[52px]">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <TokenIcon pair={selectedChain === "arbitrum" ? "ARB/USD" : "OP/USD"} size={24} />
                      <span className="capitalize">{selectedChain}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#272734] border-zinc-800">
                  <SelectItem value="arbitrum">
                    <div className="flex items-center gap-2">
                      <TokenIcon pair="ARB/USD" size={24} />
                      <span>Arbitrum</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="optimism">
                    <div className="flex items-center gap-2">
                      <TokenIcon pair="OP/USD" size={24} />
                      <span>Optimism</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-zinc-500 mb-1.5 block">Asset</label>
              <Select defaultValue="usdc">
                <SelectTrigger className="bg-[#272734] border-zinc-800 h-[52px]">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <Image src={USDCIcon} alt="USDC" width={24} height={24} />
                      USD Coin
                      <span className="text-xs text-white px-1.5 py-0.5 bg-[#27272a] rounded ml-1">USDC</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#272734] border-zinc-800">
                  <SelectItem value="usdc">
                    <div className="flex items-center gap-2">
                      <Image src={USDCIcon} alt="USDC" width={24} height={24} />
                      USD Coin
                      <span className="text-xs text-white px-1.5 py-0.5 bg-[#27272a] rounded ml-1">USDC</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Swap</span>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-xs text-white px-1.5 py-0.5 bg-[#27272a] rounded">USDC</span>
                  <span className="text-zinc-500">→</span>
                  <span className="text-xs text-white px-1.5 py-0.5 bg-[#27272a] rounded">USDC</span>
                </div>
              </div>
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
                {amount && (
                  <button 
                    onClick={() => setAmount("")}
                    className="absolute -translate-y-1/2 right-3 top-1/2 text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
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
              <span className="text-sm text-zinc-500">Expected Deposit Amount</span>
              <span className="text-sm">{getExpectedDepositAmount()}</span>
            </div>
            {selectedChain === "optimism" && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Bridge Fee</span>
                <span className="text-sm">{getRelayerFee()}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Equity</span>
              <span className="text-sm">{getCurrentAndNewBalance()}</span>
            </div>
          </div>

          {selectedChain === "optimism" ? (
            <CrossChainDepositCall
              amount={amount}
              onSuccess={() => {
                onSuccess?.();
                onClose();
                setAmount("");
              }}
              chain={chain?.id}
              isLoading={isLoading}
              disabled={
                !amount || 
                parseFloat(amount) <= 0 || 
                isAmountExceedingBalance()
              }
              quoteData={quoteData}
            />
          ) : (
            <Button 
              className="w-full h-[52px] bg-[#7142cf] hover:bg-[#7142cf]/80 text-white"
              disabled={
                !amount || 
                parseFloat(amount) <= 0 || 
                isLoading ||
                isAmountExceedingBalance()
              }
              onClick={handleDeposit}
            >
              {!isOnCorrectChain() 
                ? `Switch to ${selectedChain}` 
                : isLoading 
                  ? "Processing..." 
                  : "Acknowledge terms and deposit"
              }
            </Button>
          )}

          <p className="text-xs text-zinc-500">
            I agree to the Terms of Use, including that I accept the risks associated with these products and services and will not use them from any restricted jurisdiction.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 