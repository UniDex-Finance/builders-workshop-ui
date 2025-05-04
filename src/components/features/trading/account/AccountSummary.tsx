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
import { createPortal } from 'react-dom';

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

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (address) {
      navigator.clipboard.writeText(address);
      toast({
        title: "Address copied",
        description: "Address copied to clipboard",
      });
    }
  };

  const handleExplorer = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (explorerUrl) {
      window.open(explorerUrl, '_blank');
    }
  };

  const handleLookupClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onLookupClick) {
      onLookupClick();
    }
  };

  const handleRevoke = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRevoke) {
      onRevoke();
    }
  };

  return (
    <div className="flex items-start space-x-3" onClick={(e) => e.stopPropagation()}>
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
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
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
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
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
                    onClick={handleLookupClick}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
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
                    onClick={handleRevoke}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
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

export function AccountSummary({ buttonText = "Deposit / Withdraw", className = "" }: AccountSummaryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [selectedChain, setSelectedChain] = useState<"arbitrum" | "optimism">("arbitrum");
  const [amount, setAmount] = useState("");
  const summaryRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
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
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isLookupExpanded, setIsLookupExpanded] = useState(false);
  const [isAgentLookupExpanded, setIsAgentLookupExpanded] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const handleDepositClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // For mobile, portal the deposit card to body explicitly
    if (isMobile) {
      setIsOpen(false);
      // Short delay to ensure the first modal is closed
      setTimeout(() => {
        setShowDeposit(true);
      }, 10);
    } else {
      setShowDeposit(true);
      setIsOpen(false);
    }
  };

  const handleWithdrawClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // For mobile, portal the withdraw card to body explicitly
    if (isMobile) {
      setIsOpen(false);
      // Short delay to ensure the first modal is closed
      setTimeout(() => {
        setShowWithdraw(true);
      }, 10);
    } else {
      setShowWithdraw(true);
      setIsOpen(false);
    }
  };

  const handleMaxClick = () => {
    if (balances) {
      setAmount(balances.formattedEoaUsdcBalance);
    }
  };

  const handleRevoke = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
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
      // Close if clicking the backdrop
      if (event.target instanceof Element && 
          event.target.classList.contains('bg-black/50')) {
        setIsOpen(false);
        return;
      }
      
      // Don't close if clicking inside the trigger area OR inside the modal
      if ((summaryRef.current && summaryRef.current.contains(event.target as Node)) ||
          (modalRef.current && modalRef.current.contains(event.target as Node))) {
        return;
      }

      // Otherwise, close the modal
      setIsOpen(false);
    }

    // Add listener only when the modal is open
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    
    // Cleanup listener on unmount or when isOpen changes
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const modal = (
    <>
      <div
        className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(false);
        }}
      />
      <Card 
        ref={modalRef}
        className={`
          z-[9999] 
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
          md:fixed
          md:animate-none
          md:bottom-auto
          md:top-[60px]
          md:right-6
          md:left-auto
          md:w-[400px]
          md:rounded-lg
        `}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // Prevent bubbling completely
          if (e.nativeEvent) {
            e.nativeEvent.stopImmediatePropagation?.();
          }
        }}
      >
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
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openConnectModal();
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
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
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsLookupExpanded(!isLookupExpanded);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-zinc-400">Address no longer the same?</p>
                          <ChevronDown 
                            className={`w-4 h-4 text-zinc-400 transition-transform ${isLookupExpanded ? 'transform rotate-180' : ''}`}
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSetupSmartAccount();
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  disabled={isSigningSessionKey}
                >
                  {isSigningSessionKey ? (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white rounded-full animate-spin border-t-transparent" />
                      Setting up...
                    </div>
                  ) : (
                    "Sign in with Wallet"
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
                <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                  <AddressLookupCard 
                    isExpanded={isAgentLookupExpanded}
                    onClose={() => setIsAgentLookupExpanded(false)}
                  />
                </div>
              )}
              <div className="h-px bg-border" />
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
                    ${(parseFloat(balances?.formattedMusdBalance || "0") + parseFloat(balances?.formattedUsdcBalance || "0")).toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="h-px bg-border" />
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
                  onClick={(e) => {
                    e.preventDefault(); 
                    e.stopPropagation(); 
                    handleDepositClick(e);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  Deposit
                </Button>
                <Button 
                  className="flex-1 bg-[var(--color-long-short-button)] hover:bg-[var(--color-long-short-button-hover)] text-[var(--foreground)]"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleWithdrawClick(e);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  Withdraw
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </>
  );

  // Determine the button text based on connection and smart account status
  const needsSetup = isConnected && !smartAccount?.address;
  const displayButtonText = needsSetup ? "Log In / Sign Up" : buttonText;

  return (
    <div className="relative" ref={summaryRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-[var(--header-button-background)] hover:bg-[var(--header-button-hover)] ${className}`}
      >
        {displayButtonText}
      </Button>

      {isOpen && createPortal(modal, document.body)}

      {/* Render modals outside the account popup */}
      {showDeposit && createPortal(
        <DepositCard 
          onClose={() => setShowDeposit(false)} 
          balances={balances} 
          onSuccess={() => {
            setShowDeposit(false);
          }}
        />,
        document.body
      )}
      
      {showWithdraw && createPortal(
        <WithdrawCard 
          onClose={() => setShowWithdraw(false)} 
          balances={balances} 
          onSuccess={() => {
            setShowWithdraw(false);
          }}
        />,
        document.body
      )}
    </div>
  );
} 