"use client";

import * as React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, Loader2 } from "lucide-react";
import { useVaultInteraction } from "@/hooks/lending-hooks/use-vault-interaction";
import type { VaultProtocol, InteractionType } from "@/hooks/lending-hooks/use-vault-interaction";
import { useInterestTokenPrice } from "@/hooks/lending-hooks/use-interest-token-price";
import { useBalances } from "@/hooks/use-balances";
import { formatUnits, parseUnits } from "viem";
import { useLendingBalances } from "@/hooks/lending-hooks/use-lending-balances";

// --- Debounce Utility (can also be imported) ---
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>): void => { // Adjusted return type for simple debounce
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      func(...args);
    }, waitFor);
  };
}

interface VaultInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  protocol: string;
  variant: 'aave' | 'compound' | 'fluid' | 'default';
  depositedBalance: string;
}

export function VaultInteractionModal({
  isOpen,
  onClose,
  protocol,
  variant,
  depositedBalance,
}: VaultInteractionModalProps) {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [activeTab, setActiveTab] = useState<InteractionType>('deposit');

  const hookProtocol = variant === 'default' ? 'aave' : variant as VaultProtocol;

  // --- Internal Balance Fetching --- 
  const { balances, isLoading: isLoadingBalances } = useBalances("arbitrum");

  const {
    deposit,
    withdraw,
    fetchQuote,
    isLoading,
    isQuoteLoading,
    isError,
    error,
    quoteAmountOut,
  } = useVaultInteraction({ protocol: hookProtocol });

  // Fetch interest token prices
  const { prices: interestTokenPrices, isLoading: isLoadingPrices, error: priceError } = useInterestTokenPrice();

  // --- Debounced Quote Fetching ---
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetchQuote = useCallback(
    debounce((amount: string, type: InteractionType) => {
      fetchQuote(amount, type);
    }, 500),
    [fetchQuote]
  );

  // Effect to fetch quote when amount and tab changes
  useEffect(() => {
    if (activeTab === 'deposit' && depositAmount) {
      debouncedFetchQuote(depositAmount, 'deposit');
    } else if (activeTab === 'withdraw' && withdrawAmount) {
      debouncedFetchQuote(withdrawAmount, 'withdraw');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depositAmount, withdrawAmount, activeTab]);

  // Effect to reset state when protocol changes or modal closes
  useEffect(() => {
    setDepositAmount("");
    setWithdrawAmount("");
    setActiveTab('deposit');
  }, [protocol, isOpen]); // Also reset when reopening

  // --- Calculate Combined Depositable Balance --- 
  const combinedDepositableBalanceWei = useMemo(() => {
    if (!balances) return 0n;
    // MUSD has 30 decimals, USDC has 6. Withdrawal treats 1 MUSD as 1 USDC.
    // Convert raw 30-decimal MUSD balance to its 6-decimal USDC equivalent value.
    const musdInUsdcValueWei = balances.musdBalance / (10n ** 24n); // Divide by 10^(30-6)
    return balances.usdcBalance + musdInUsdcValueWei;
  }, [balances]);

  const formattedCombinedBalance = useMemo(() => {
    if (isLoadingBalances || !balances) return "$0.00 USDC";
    const formatted = formatUnits(combinedDepositableBalanceWei, 6); // Correctly format the 6-decimal combined value
    const numericValue = parseFloat(formatted);
    return isNaN(numericValue)
      ? "$0.00 USDC"
      : `$${numericValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`;
  }, [combinedDepositableBalanceWei, isLoadingBalances, balances]);

  // --- Parsing Helper (Only needed for withdraw max now) ---
  const parseDepositedBalance = (balanceString: string): number => {
    const cleanedString = balanceString.replace(/[$,]/g, '').trim().split(' ')[0];
    const numericValue = parseFloat(cleanedString);
    return isNaN(numericValue) ? 0 : numericValue;
  };

  // We need to track the raw balance value for withdrawal max
  const [rawDepositedBalance, setRawDepositedBalance] = useState<bigint>(0n);
  
  // Access raw lending balances for Withdraw Max
  const { balances: lendingBalances, isLoading: isLoadingLendingBalances } = useLendingBalances();

  useEffect(() => {
    // Update raw balance when lending balances are loaded
    if (lendingBalances) {
      if (variant === 'aave') {
        setRawDepositedBalance(lendingBalances.aUsdcBalance);
      } else if (variant === 'compound') {
        setRawDepositedBalance(lendingBalances.cUsdcBalance);
      } else if (variant === 'fluid') {
        setRawDepositedBalance(lendingBalances.fluidBalance);
      }
    }
  }, [lendingBalances, variant]);

  const handleDepositMax = () => {
    if (isLoadingBalances || !balances) return;
    // This is correct as it uses formatUnits which preserves full precision
    const maxAmountString = formatUnits(combinedDepositableBalanceWei, 6);
    setDepositAmount(maxAmountString);
  };

  const handleWithdrawMax = () => {
    // Instead of parsing the formatted string, use the raw bigint value
    if (rawDepositedBalance > 0n) {
      // Get appropriate decimal based on protocol
      const decimals = variant === 'aave' || variant === 'compound' || variant === 'fluid' ? 6 : 6;
      const maxWithdrawAmount = formatUnits(rawDepositedBalance, decimals);
      setWithdrawAmount(maxWithdrawAmount);
    } else {
      // Fallback to existing logic for backward compatibility
      const numericBalance = parseDepositedBalance(depositedBalance);
      setWithdrawAmount(numericBalance.toString());
    }
  };

  // --- Submit Handlers ---
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) <= 0 || isLoading || isLoadingBalances) return;
    await deposit(depositAmount);
    if (!isLoading && !isError) {
      setDepositAmount("");
      // Optionally close modal on success
      // onClose(); 
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0 || isLoading) return;
    await withdraw(withdrawAmount);
    if (!isLoading && !isError) {
      setWithdrawAmount("");
      // Optionally close modal on success
      // onClose();
    }
  };

  // --- Display Helpers ---
  const getDepositQuoteDisplay = () => {
      // If input is empty, don't show any quote, even if stale data exists
      if (!depositAmount) return `0.00`; // Default to 0.00

      if (isQuoteLoading && activeTab === 'deposit') return <Loader2 className="w-4 h-4 animate-spin" />;

      if (quoteAmountOut && activeTab === 'deposit') {
        const amount = parseFloat(quoteAmountOut);
        // Round the token amount to 2 decimal places for display
        const roundedAmountString = !isNaN(amount) ? amount.toFixed(2) : "0.00"; 
        const price = interestTokenPrices[hookProtocol];

        if (isLoadingPrices) {
          return (
             <span className="flex items-center">
                {roundedAmountString} (<Loader2 className="w-3 h-3 animate-spin ml-1" />)
             </span>
           );
        }

        if (price !== null && !isNaN(amount)) {
           const usdValue = (amount * price).toFixed(2); // Keep USD value precise
           return `${roundedAmountString} ($${usdValue})`;
        } else {
          // Fallback if price is missing or amount is invalid
          console.warn("Could not calculate USD value for deposit quote. Price:", price, "Amount:", quoteAmountOut);
           return `${roundedAmountString}`; // Show only the rounded amount
        }
      }

      return `0.00`; // Default to 0.00
  };

  const getWithdrawQuoteDisplay = () => {
       // If input is empty, don't show any quote
      if (!withdrawAmount) return "$0.00 USDC";

      if (isQuoteLoading && activeTab === 'withdraw') return <Loader2 className="w-4 h-4 animate-spin" />;
      if (quoteAmountOut && activeTab === 'withdraw') return `$${quoteAmountOut} USDC`; // Display USDC amount
      return "$0.00 USDC";
  }

  const handleClose = () => {
      setDepositAmount("");
      setWithdrawAmount("");
      onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{protocol} Vault</DialogTitle>
          <DialogDescription>
            Deposit or withdraw USDC from the {protocol} vault.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="deposit" value={activeTab} onValueChange={(value) => setActiveTab(value as InteractionType)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>

          {/* Deposit Tab */}
          <TabsContent value="deposit">
            <form onSubmit={handleDepositSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="deposit-amount">Amount (USDC)</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="deposit-amount"
                      type="number"
                      placeholder="0.00"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      min="0"
                      step="any"
                      required
                      disabled={isLoading || isLoadingBalances} // Disable if main tx or balances loading
                    />
                    <Button variant="outline" size="sm" onClick={handleDepositMax} type="button" disabled={isLoading || isLoadingBalances}>Max</Button> { /* Disable Max if balances are loading */}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground pt-1">
                    <Wallet className="w-3 h-3 mr-1.5" />
                    {/* Display the combined balance */} 
                    <span>Wallet Balance: {isLoadingBalances ? <Loader2 className="w-3 h-3 animate-spin inline-block ml-1" /> : formattedCombinedBalance}</span>
                  </div>
                </div>
                <Card className="bg-muted/50">
                  <CardContent className="p-3 text-sm space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Share Tokens:</span>
                      <span className="font-medium text-foreground flex items-center">
                        {getDepositQuoteDisplay()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                {isError && !isQuoteLoading && <p className="text-sm text-red-500 pt-2">Error: {error}</p>}
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full" disabled={isLoading || isQuoteLoading || isLoadingBalances || !depositAmount || parseFloat(depositAmount) <= 0}>
                  {isLoading ? 'Depositing...' : (isQuoteLoading ? 'Getting Quote...' : (isLoadingBalances ? 'Loading Balances...' : 'Deposit USDC'))}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* Withdraw Tab */}
          <TabsContent value="withdraw">
             <form onSubmit={handleWithdrawSubmit}>
               <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="withdraw-amount">Amount ({protocol.toUpperCase()} Vault Tokens)</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="withdraw-amount"
                      type="number"
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      min="0"
                      step="any"
                      required
                      disabled={isLoading}
                    />
                    <Button variant="outline" size="sm" onClick={handleWithdrawMax} type="button" disabled={isLoading}>Max</Button>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground pt-1">
                    <span>Deposited: {depositedBalance}</span>
                  </div>
                </div>
                <Card className="bg-muted/50">
                  <CardContent className="p-3 text-sm space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">USDC Received:</span>
                      <span className="font-medium text-foreground flex items-center">
                        {getWithdrawQuoteDisplay()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                {isError && !isQuoteLoading && <p className="text-sm text-red-500 pt-2">Error: {error}</p>}
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full" disabled={isLoading || isQuoteLoading || !withdrawAmount || parseFloat(withdrawAmount) <= 0}>
                 {isLoading ? 'Withdrawing...' : (isQuoteLoading ? 'Getting Quote...' : 'Withdraw USDC')}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 