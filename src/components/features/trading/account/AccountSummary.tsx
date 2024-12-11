import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSmartAccount } from "@/hooks/use-smart-account";
import { useBalances } from "@/hooks/use-balances";
import { useAccount } from "wagmi";
import { Wallet, Copy, ExternalLink, ChevronDown } from "lucide-react";
import { usePositions } from "@/hooks/use-positions";
import { useToast } from "@/hooks/use-toast";
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TokenIcon } from "@/hooks/use-token-icon";
import { DepositCard } from "./DepositCard";
import { WithdrawCard } from "./WithdrawCard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BalanceItemProps {
  title: string;
  balance: string;
  isLoading: boolean;
  suffix?: string;
  className?: string;
}

function BalanceItem({ title, balance, isLoading, suffix = "USDC", className }: BalanceItemProps) {
  const tooltipContent = {
    "Trading Account": "The trading account balance is the sum of the 1ct wallet and any margin account balances. This is the amount that you have which can be used to open trades.",
    "1CT Wallet Balance": "This is the main wallet address that is placing trades across various platforms. Only you have permission to manage this address",
    "UniDex Margin Balance": "This is the margin balance of the aggregated source \"UniDex V4\". This balence can be used to place orders on other exchanges, but we show it so you can micro manage if you wanted"
  }[title];

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {tooltipContent ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="text-sm text-muted-foreground hover:text-muted-foreground/80">
              {title}
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-[300px]">{tooltipContent}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <span className="text-sm text-muted-foreground">{title}</span>
      )}
      <span className="text-sm">
        {isLoading ? "Loading..." : `${balance} ${suffix}`}
      </span>
    </div>
  );
}

interface AddressDisplayProps {
  label: string;
  address?: string;
  explorerUrl?: string;
}

function AddressDisplay({ label, address, explorerUrl }: AddressDisplayProps) {
  const { toast } = useToast();

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({
        title: "Address copied",
        description: "Address copied to clipboard",
      });
    }
  };

  const handleExplorer = () => {
    if (explorerUrl) {
      window.open(explorerUrl, '_blank');
    }
  };

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
            className="p-0 h-7 w-7"
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExplorer}
            className="p-0 h-7 w-7"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

interface AccountSummaryProps {
  buttonText?: string;
  className?: string;
}

export function AccountSummary({ buttonText = "Wallet", className = "" }: AccountSummaryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [selectedChain, setSelectedChain] = useState<"arbitrum" | "optimism">("arbitrum");
  const [amount, setAmount] = useState("");
  const summaryRef = useRef<HTMLDivElement>(null);
  const { smartAccount, setupSessionKey, isSigningSessionKey } = useSmartAccount();
  const { address: eoaAddress } = useAccount();
  const { balances, isLoading } = useBalances("arbitrum");
  const { positions, loading: positionsLoading } = usePositions();
  const { toast } = useToast();

  const handleSetupSmartAccount = async () => {
    try {
      await setupSessionKey();
      toast({
        title: "Success",
        description: "1CT Account successfully created",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to setup 1CT account",
        variant: "destructive",
      });
    }
  };

  // Calculate total unrealized PnL
  const totalUnrealizedPnl = positions?.reduce((total, position) => {
    if (!position?.pnl) return total;
    const pnlWithoutFees = parseFloat(position.pnl.replace(/[^0-9.-]/g, ""));
    const totalFees =
      parseFloat(position.fees.positionFee || "0") +
      parseFloat(position.fees.borrowFee || "0") +
      parseFloat(position.fees.fundingFee || "0");
    return total + (pnlWithoutFees - totalFees);
  }, 0);

  // Calculate total equity
  const calculateTotalEquity = () => {
    if (isLoading) return "Loading...";
    const musdBalance = parseFloat(balances?.formattedMusdBalance || "0");
    const usdcBalance = parseFloat(balances?.formattedUsdcBalance || "0");
    const unrealizedPnl = totalUnrealizedPnl || 0;
    const total = musdBalance + usdcBalance + unrealizedPnl;
    return `$${total.toFixed(2)}`;
  };

  const getExplorerUrl = (address: string) => {
    return `https://arbiscan.io/address/${address}`;
  };

  const handleDepositClick = () => {
    setShowDeposit(true);
    setIsOpen(false);
  };

  const handleWithdrawClick = () => {
    setShowWithdraw(true);
    setIsOpen(false);
  };

  const handleMaxClick = () => {
    if (balances) {
      setAmount(balances.formattedEoaUsdcBalance);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        summaryRef.current &&
        !summaryRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (showWithdraw) {
    return <WithdrawCard onClose={() => setShowWithdraw(false)} balances={balances} />;
  }

  if (showDeposit) {
    return <DepositCard onClose={() => setShowDeposit(false)} balances={balances} />;
  }

  return (
    <div className="relative" ref={summaryRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-[#1f1f29] hover:bg-[#1f1f29]/90 ${className}`}
      >
        {buttonText}
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" />
          
          <Card className={`
            z-50 
            p-4 
            space-y-4 
            bg-[#17161d]
            text-white
            border-zinc-800
            
            /* Mobile styles */
            fixed
            inset-x-0
            bottom-0
            rounded-b-none
            w-full
            animate-slide-up-mobile
            
            /* Desktop styles */
            md:absolute
            md:animate-none
            md:bottom-auto
            md:right-0
            md:left-auto
            md:w-[400px]
            md:rounded-lg
            md:mt-2
          `}>
            {/* Address Section */}
            <div className="space-y-3">
              <AddressDisplay
                label="Source Address"
                address={eoaAddress}
                explorerUrl={eoaAddress ? getExplorerUrl(eoaAddress) : undefined}
              />
              
              {!smartAccount?.address ? (
                <>
                  <div className="my-4 border-t border-zinc-800" />
                  <div className="space-y-4">
                    <p className="text-sm text-zinc-400">
                      To start trading, you need to setup a trading account.
                    </p>
                    <Button
                      className="w-full h-[52px] bg-[#7142cf] hover:bg-[#7142cf]/80 text-white"
                      onClick={handleSetupSmartAccount}
                      disabled={isSigningSessionKey}
                    >
                      {isSigningSessionKey ? (
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white rounded-full animate-spin border-t-transparent" />
                          Setting up...
                        </div>
                      ) : (
                        "Establish Connection"
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <AddressDisplay
                    label="Trading Address"
                    address={smartAccount?.address}
                    explorerUrl={smartAccount?.address ? getExplorerUrl(smartAccount.address) : undefined}
                  />

                  <div className="h-px bg-border" />

                  {/* Net Worth and Trading Account Section */}
                  <div className="flex items-end justify-between">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Net Worth</div>
                      <div className="text-2xl font-semibold">{calculateTotalEquity()}</div>
                    </div>
                    <div className="space-y-1 text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="text-sm text-muted-foreground">
                            Trading Account
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-[300px]">
                              The trading account balance is the sum of the 1ct wallet and any margin account balances. This is the amount that you have which can be used to open trades.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <div className="text-lg">
                        ${parseFloat(balances?.formattedMusdBalance || "0").toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-border" />

                  {/* Detailed Breakdown */}
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Balance Breakdown</div>
                    <BalanceItem
                      title="1CT Wallet Balance"
                      balance={balances ? balances.formattedUsdcBalance : "0.00"}
                      isLoading={isLoading}
                    />
                    <BalanceItem
                      title="UniDex Margin Balance"
                      balance={balances ? balances.formattedMusdBalance : "0.00"}
                      isLoading={isLoading}
                    />
                    <BalanceItem
                      title="Unrealized PnL"
                      balance={totalUnrealizedPnl?.toFixed(2) || "0.00"}
                      isLoading={positionsLoading}
                      suffix="USD"
                      className={totalUnrealizedPnl && totalUnrealizedPnl >= 0 ? "text-green-400" : "text-red-400"}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-[#1f1f29] hover:bg-[#1f1f29]/90 text-white"
                      onClick={handleDepositClick}
                    >
                      Deposit
                    </Button>
                    <Button 
                      className="flex-1 bg-[#1f1f29] hover:bg-[#1f1f29]/90 text-white"
                      onClick={handleWithdrawClick}
                    >
                      Withdraw
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
} 