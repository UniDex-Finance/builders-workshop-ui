import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "../../../ui/card";
import { Button } from "../../../ui/button";
import { Alert, AlertDescription } from "../../../ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../ui/tabs";
import { useSmartAccount } from "@/hooks/use-smart-account";
import { useToast } from "@/hooks/use-toast";
import { useBalances } from "@/hooks/use-balances";
import { useTokenTransferActions } from "@/hooks/use-token-transfer-actions";
import { useAccount, useSwitchChain } from "wagmi";
import { arbitrum, optimism } from "wagmi/chains";
import { BalanceDisplay } from "./BalanceDisplay";
import { DepositForm } from "./DepositForm";
import { useTransactionHandler } from "./useTransactionHandler";
import { NetworkType } from "./types";

export default function DepositBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [smartAccountAmount, setSmartAccountAmount] = useState("");
  const [tradingAmount, setTradingAmount] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>("arbitrum");

  const depositBoxRef = useRef<HTMLDivElement>(null);

  const {
    smartAccount,
    kernelClient,
    setupSessionKey,
    isSigningSessionKey,
    isInitialized,
  } = useSmartAccount();
  const { address: eoaAddress, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const { toast } = useToast();
  const {
    balances,
    isLoading: isLoadingBalances,
    refetchBalances,
  } = useBalances(selectedNetwork);
  const { transferToSmartAccount, isTransferring, withdrawFromSmartAccount } = useTokenTransferActions();

  const {
    isLoading,
    isApproving,
    handleApproveAndDeposit,
    handleTradingOperation,
  } = useTransactionHandler({
    smartAccount,
    kernelClient,
    toast,
    refetchBalances,
  });

  const balanceRefreshInterval = useRef<NodeJS.Timeout>();
  const lastManualRefetchTime = useRef<number>(0);
  const MANUAL_REFETCH_THROTTLE = 3000; // 3 seconds

  // Throttled manual refetch
  const throttledRefetchBalances = useCallback(() => {
    const now = Date.now();
    if (now - lastManualRefetchTime.current >= MANUAL_REFETCH_THROTTLE) {
      lastManualRefetchTime.current = now;
      refetchBalances();
    }
  }, [refetchBalances]);

  // Set up periodic balance refresh
  useEffect(() => {
    if (smartAccount?.address && isOpen) {
      // Initial fetch
      refetchBalances();
      
      // Set up interval
      balanceRefreshInterval.current = setInterval(() => {
        refetchBalances();
      }, 5000);

      return () => {
        if (balanceRefreshInterval.current) {
          clearInterval(balanceRefreshInterval.current);
        }
      };
    }
  }, [smartAccount?.address, isOpen, refetchBalances]);

  // Clean up interval when component unmounts
  useEffect(() => {
    return () => {
      if (balanceRefreshInterval.current) {
        clearInterval(balanceRefreshInterval.current);
      }
    };
  }, []);

  // Update the useEffect that watches for smart account changes
  useEffect(() => {
    if (smartAccount?.address) {
      throttledRefetchBalances();
    }
  }, [smartAccount?.address, throttledRefetchBalances]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        depositBoxRef.current &&
        !depositBoxRef.current.contains(event.target as Node) &&
        isOpen
      ) {
        const selectContent = document.querySelector('[role="listbox"]');
        if (!selectContent?.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const isOnCorrectChain = () => {
    if (selectedNetwork === "arbitrum") {
      return chain?.id === arbitrum.id;
    } else {
      return chain?.id === optimism.id;
    }
  };

  const handleSwitchNetwork = () => {
    if (selectedNetwork === "arbitrum") {
      switchChain?.({ chainId: arbitrum.id });
    } else {
      switchChain?.({ chainId: optimism.id });
    }
  };

  const handleSetupSmartAccount = async () => {
    try {
      await setupSessionKey();
      toast({
        title: "Success",
        description: "1CT Account successfully created",
      });
      refetchBalances();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to setup 1CT account",
        variant: "destructive",
      });
    }
  };

  const handleMaxClick = (type: "smart-account" | "trading") => {
    if (!balances) return;

    if (type === "smart-account") {
      setSmartAccountAmount(balances.formattedEoaUsdcBalance);
    } else {
      setTradingAmount(balances.formattedUsdcBalance);
    }
  };

  const handleSmartAccountOperation = async (type: "deposit" | "withdraw") => {
    if (!eoaAddress || !smartAccount) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!isOnCorrectChain()) {
      handleSwitchNetwork();
      return;
    }

    try {
      if (type === "deposit") {
        if (selectedNetwork === "optimism") {
          return;
        }
        await transferToSmartAccount(smartAccountAmount, eoaAddress);
      } else if (type === "withdraw") {
        await withdrawFromSmartAccount(smartAccountAmount, eoaAddress);
      }

      setSmartAccountAmount("");
      refetchBalances();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${type}`,
        variant: "destructive",
      });
    }
  };

  const needsApproval = balances
    ? parseFloat(tradingAmount || "0") >
      parseFloat(balances.formattedUsdcAllowance)
    : false;

  const handleTradingDeposit = () => {
    if (needsApproval) {
      handleApproveAndDeposit(tradingAmount)
        .then(() => setTradingAmount(""))
        .catch(() => {});
    } else {
      handleTradingOperation("deposit", tradingAmount)
        .then(() => setTradingAmount(""))
        .catch(() => {});
    }
  };

  const handleTradingWithdraw = () => {
    handleTradingOperation("withdraw", tradingAmount)
      .then(() => setTradingAmount(""))
      .catch(() => {});
  };

  return (
    <div className="relative" ref={depositBoxRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[hsl(var(--component-background))]"
      >
        Deposit / Withdraw
      </Button>

      {isOpen && (
        <Card className={`
          fixed 
          z-50 
          p-6 
          space-y-6 
          w-full
          bg-[hsl(var(--component-background))]
          
          /* Mobile styles */
          bottom-0
          left-0
          right-0
          rounded-t-lg
          rounded-b-none
          max-h-[90vh]
          overflow-y-auto
          
          /* Desktop styles */
          md:fixed
          md:bottom-auto
          md:left-auto
          md:right-4
          md:top-14
          md:w-[480px]
          md:rounded-lg
          md:max-h-none
        `}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Wallet Management</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              ×
            </Button>
          </div>

          {!smartAccount && eoaAddress ? (
            <div className="space-y-4">
              <Alert>
                <AlertDescription className="space-y-4">
                  <p className="text-sm">
                    To get started with trading, you'll need to setup your 1CT
                    wallet first.
                  </p>
                  <Button
                    size="sm"
                    onClick={handleSetupSmartAccount}
                    disabled={isSigningSessionKey}
                  >
                    {isSigningSessionKey ? "Setting up..." : "Setup 1CT Wallet"}
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <>
              <BalanceDisplay
                eoaAddress={eoaAddress}
                smartAccountAddress={smartAccount?.address}
                eoaBalance={
                  balances
                    ? parseFloat(balances.formattedEoaUsdcBalance).toFixed(2)
                    : "0.00"
                }
                smartAccountBalance={
                  balances
                    ? parseFloat(balances.formattedUsdcBalance).toFixed(2)
                    : "0.00"
                }
                marginBalance={
                  balances
                    ? parseFloat(balances.formattedMusdBalance).toFixed(2)
                    : "0.00"
                }
                isLoading={isLoadingBalances}
                isEffectivelyInitialized={
                  isInitialized || !!smartAccount?.address
                }
                selectedNetwork={selectedNetwork}
              />
              <Tabs defaultValue="smart-account" className="w-full">
                <TabsList className="w-full bg-[#252525]">
                  <TabsTrigger 
                    value="smart-account" 
                    className="flex-1 data-[state=active]:bg-[#1f1f29]"
                  >
                    1CT Wallet
                  </TabsTrigger>
                  <TabsTrigger 
                    value="trading" 
                    className="flex-1 data-[state=active]:bg-[#1f1f29]"
                  >
                    Margin Balance
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="smart-account">
                  <DepositForm
                    type="smart-account"
                    amount={smartAccountAmount}
                    onAmountChange={setSmartAccountAmount}
                    onMaxClick={() => handleMaxClick("smart-account")}
                    isLoading={isTransferring}
                    disabled={!smartAccount || isLoadingBalances}
                    balances={balances}
                    selectedNetwork={selectedNetwork}
                    onNetworkChange={setSelectedNetwork}
                    onDeposit={() => handleSmartAccountOperation("deposit")}
                    onWithdraw={() => handleSmartAccountOperation("withdraw")}
                    chain={chain?.id}
                  />
                </TabsContent>

                <TabsContent value="trading">
                  <DepositForm
                    type="trading"
                    amount={tradingAmount}
                    onAmountChange={setTradingAmount}
                    onMaxClick={() => handleMaxClick("trading")}
                    isLoading={isLoading}
                    disabled={!smartAccount || isLoadingBalances}
                    balances={balances}
                    onDeposit={handleTradingDeposit}
                    onWithdraw={handleTradingWithdraw}
                    needsApproval={needsApproval}
                    isApproving={isApproving}
                  />
                </TabsContent>
              </Tabs>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
