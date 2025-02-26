import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSmartAccount } from "@/hooks/use-smart-account";
import { useBalances } from "@/hooks/use-balances";
import { useAccount } from "wagmi";
import { Wallet, Copy, ExternalLink, ChevronDown, RefreshCcw } from "lucide-react";
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
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AddressLookupCard } from "./AddressLookupCard";

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
    "Emilia's Wallet Balance": "This is the main wallet address that is placing trades across various platforms. Only you have permission to manage this address",
    "UniDex Margin Balance": "This is the margin balance of the aggregated source \"UniDex V4\". This balance can be used to place orders on other exchanges, but we show it so you can micro manage if you wanted"
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
  onRevoke?: () => void;
  showRevoke?: boolean;
  onLookupClick?: () => void;
  showLookup?: boolean;
  isLookupExpanded?: boolean;
}

function AddressDisplay({ 
  label, 
  address, 
  explorerUrl, 
  onRevoke, 
  showRevoke,
  onLookupClick,
  showLookup,
  isLookupExpanded
}: AddressDisplayProps) {
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="p-0 h-7 w-7"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy Address</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExplorer}
                  className="p-0 h-7 w-7"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View in Explorer</p>
              </TooltipContent>
            </Tooltip>

            {showLookup && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onLookupClick}
                    className="p-0 h-7 w-7 text-muted-foreground hover:text-muted-foreground/80"
                  >
                    <ChevronDown 
                      className={`w-3.5 h-3.5 transition-transform ${
                        isLookupExpanded ? 'transform rotate-180' : ''
                      }`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Address Lookup</p>
                </TooltipContent>
              </Tooltip>
            )}

            {showRevoke && onRevoke && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRevoke}
                    className="p-0 h-7 w-7 text-muted-foreground hover:text-muted-foreground/80"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset Session</p>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
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
  const { 
    smartAccount, 
    setupSessionKey, 
    isSigningSessionKey, 
    revokeCurrentSession,
    predictedAddress 
  } = useSmartAccount();
  const { address: eoaAddress, isConnected } = useAccount();
  const { balances, isLoading } = useBalances("arbitrum");
  const { positions, loading: positionsLoading } = usePositions();
  const { toast } = useToast();
  const [isLookupExpanded, setIsLookupExpanded] = useState(false);
  const [isAgentLookupExpanded, setIsAgentLookupExpanded] = useState(false);

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
    // position.pnl already has fees deducted, so we just need to parse it
    return total + parseFloat(position.pnl.replace(/[^0-9.-]/g, ""));
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

  const handleRevoke = async () => {
    try {
      await revokeCurrentSession();
      toast({
        title: "Success",
        description: "Session key revoked successfully",
      });
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke session key",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        summaryRef.current &&
        !summaryRef.current.contains(event.target as Node) ||
        (event.target as Element).classList.contains('bg-black/50')
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
        className={`bg-[var(--header-button-background)] hover:bg-[var(--header-button-hover)] ${className}`}
      >
        {buttonText}
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" 
            onClick={() => setIsOpen(false)}
          />
          
          <Card className={`
            z-50 
            p-4 
            space-y-4 
            bg-[var(--deposit-card-background)]
            text-[var(--foreground)]
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
                label="Your Wallet Address"
                address={eoaAddress}
                explorerUrl={eoaAddress ? getExplorerUrl(eoaAddress) : undefined}
              />
              
              {!isConnected ? (
                <>
                  <div className="my-4 border-t border-zinc-800" />
                  <div className="space-y-4">
                    <p className="text-sm text-zinc-400">
                      Connect your wallet to start trading.
                    </p>
                    <ConnectButton.Custom>
                      {({ openConnectModal }) => (
                        <Button
                          className="w-full h-[52px] bg-[var(--main-accent)] hover:bg-[var(--main-accent)]/80 text-white"
                          onClick={openConnectModal}
                        >
                          Connect Wallet
                        </Button>
                      )}
                    </ConnectButton.Custom>
                  </div>
                </>
              ) : !smartAccount?.address ? (
                <>
                  <div className="my-4 border-t border-zinc-800" />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm text-zinc-400">
                        To start trading, you need to setup a trading account.
                        <br /><br />
                        Every trading account address is unique to the wallet address used to setup the account.
                      </p>
                      {predictedAddress && (
                        <>
                          <div 
                            className="p-3 rounded-md bg-zinc-900/50 border border-zinc-800 cursor-pointer hover:bg-zinc-900/70 transition-colors"
                            onClick={() => setIsLookupExpanded(!isLookupExpanded)}
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-zinc-400">Address no longer the same?</p>
                              <ChevronDown 
                                className={`w-4 h-4 text-zinc-400 transition-transform ${
                                  isLookupExpanded ? 'transform rotate-180' : ''
                                }`}
                              />
                            </div>
                          </div>
                          <AddressLookupCard 
                            isExpanded={isLookupExpanded}
                            onClose={() => setIsLookupExpanded(false)}
                          />
                        </>
                      )}
                    </div>
                    <Button
                      className="w-full h-[52px] bg-[var(--main-accent)] hover:bg-[var(--main-accent)]/80 text-white"
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
                  <div className="relative">
                    <AddressDisplay
                      label="Trading Address"
                      address={smartAccount?.address}
                      explorerUrl={smartAccount?.address ? getExplorerUrl(smartAccount.address) : undefined}
                      onRevoke={handleRevoke}
                      showRevoke={true}
                      onLookupClick={() => setIsAgentLookupExpanded(!isAgentLookupExpanded)}
                      showLookup={true}
                      isLookupExpanded={isAgentLookupExpanded}
                    />
                  </div>
                  {isAgentLookupExpanded && (
                    <div className="mt-2">
                      <AddressLookupCard 
                        isExpanded={isAgentLookupExpanded}
                        onClose={() => setIsAgentLookupExpanded(false)}
                      />
                    </div>
                  )}
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
                            Emilia's Balance
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-[300px]">
                              The trading account balance is the sum of the 1ct wallet and any margin account balances. This is the amount that you have which can be used to open trades.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <div className="text-lg">
                        ${(parseFloat(balances?.formattedMusdBalance || "0") + parseFloat(balances?.formattedUsdcBalance || "0")).toFixed(2)}
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
                      className={totalUnrealizedPnl && totalUnrealizedPnl >= 0 ? "text-long" : "text-short"}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-[var(--color-long-short-button)] hover:bg-[var(--color-long-short-button-hover)] text-[var(--foreground)]"
                      onClick={handleDepositClick}
                    >
                      Deposit
                    </Button>
                    <Button 
                      className="flex-1 bg-[var(--color-long-short-button)] hover:bg-[var(--color-long-short-button-hover)] text-[var(--foreground)]"
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