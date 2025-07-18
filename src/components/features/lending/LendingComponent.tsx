"use client";

import { BalanceCard } from "./BalanceCard";
import { VaultCard } from "./VaultCard";
import { useLendingBalances } from "@/hooks/lending-hooks/use-lending-balances";
import { useVaultApys } from "@/hooks/lending-hooks/use-vault-apys";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "../../ui/card";
import { VaultInteractionModal } from "./VaultInteractionModal";
import { useState } from "react";
import { useInterestTokenPrice } from "@/hooks/lending-hooks/use-interest-token-price";

// Helper function to format APY
const formatApy = (apy: number | undefined | null): string => {
  if (apy === undefined || apy === null || isNaN(apy)) {
    return "N/A";
  }
  return `${apy}%`;
};

export function LendingComponent() {
  const { balances, isLoading: isLoadingBalances, isError: isErrorBalances } = useLendingBalances();
  const { apys, isLoading: isLoadingApys, isError: isErrorApys } = useVaultApys();
  const { prices, isLoading: isLoadingPrices, error: errorPrices } = useInterestTokenPrice();

  // --- State for Modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVault, setSelectedVault] = useState<{
    protocol: string;
    variant: 'aave' | 'compound' | 'fluid' | 'default';
    depositedBalance: string;
  } | null>(null);
  // ----------------------

  // Base vault structure
  const baseVaultData = [
    { protocol: "Aave", variant: "aave" as const, apyKey: "aave" as keyof typeof apys },
    { protocol: "Compound", variant: "compound" as const, apyKey: "compound" as keyof typeof apys },
    { protocol: "Fluid", variant: "fluid" as const, apyKey: "fluid" as keyof typeof apys },
  ];

  // Calculate display balances using formatted values from the hook
  const walletUsdcNum = balances ? parseFloat(balances.formattedUsdcBalance) : 0;
  const walletMusdNum = balances ? parseFloat(balances.formattedMusdBalance) : 0;
  const calculatedWalletBalanceNum = walletUsdcNum + walletMusdNum;

  const displayWalletBalance = calculatedWalletBalanceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Calculate Yield Balance by summing deposited vault balances
  const aaveBalanceNum = balances ? parseFloat(balances.formattedAUsdcBalance || '0') : 0;
  const compoundBalanceNum = balances ? parseFloat(balances.formattedCUsdcBalance || '0') : 0;
  // Assuming Fluid token value is 1:1 with USD for display, adjust if needed
  const fluidBalanceNum = balances ? parseFloat(balances.formattedFluidBalance || '0') : 0;
  const yieldBalanceNum = aaveBalanceNum + compoundBalanceNum + fluidBalanceNum;
  const displayYieldBalance = yieldBalanceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Total balance is wallet + yield
  const calculatedTotalBalanceNum = calculatedWalletBalanceNum + yieldBalanceNum;
  const displayTotalBalance = calculatedTotalBalanceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Extract wallet balance for the modal (keep as string with $)
  const displayWalletBalanceForModal = `$${(balances ? parseFloat(balances.formattedUsdcBalance) : 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Calculate Current Yield APY
  let displayCurrentYieldApy = "N/A";
  if (!isLoadingBalances && !isLoadingApys && balances && apys && yieldBalanceNum > 0) {
    const aaveApy = apys.aave ?? 0;
    const compoundApy = apys.compound ?? 0;
    const fluidApy = apys.fluid ?? 0;

    const weightedApy = (
      (aaveBalanceNum * aaveApy) +
      (compoundBalanceNum * compoundApy) +
      (fluidBalanceNum * fluidApy)
    ) / yieldBalanceNum;

    displayCurrentYieldApy = formatApy(weightedApy);
  } else if (!isLoadingBalances && !isLoadingApys && yieldBalanceNum === 0) {
    displayCurrentYieldApy = formatApy(0);
  } else if (isErrorBalances || isErrorApys) {
    displayCurrentYieldApy = "Error";
  }

  // --- Modal Handler ---
  const handleVaultClick = (
    vault: typeof baseVaultData[number],
    depositedBalance: string
  ) => {
    setSelectedVault({
      protocol: vault.protocol,
      variant: vault.variant === 'aave' || vault.variant === 'compound' || vault.variant === 'fluid' ? vault.variant : 'default',
      depositedBalance: depositedBalance,
    });
    setIsModalOpen(true);
  };
  // --------------------

  return (
    <div className="w-full space-y-4">
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row md:justify-center items-start gap-4 md:gap-6">
        <div className="w-full md:max-w-sm">
          {isLoadingBalances ? (
            <Skeleton className="w-full h-[280px]" />
          ) : isErrorBalances ? (
            <Card className="w-full h-full flex items-center justify-center bg-destructive/10 border-destructive">
              <p className="text-destructive-foreground text-sm">Error loading balances.</p>
            </Card>
          ) : balances ? (
            <BalanceCard
              totalBalance={displayTotalBalance}
              yieldBalance={displayYieldBalance}
              walletBalance={displayWalletBalance}
              apy={displayCurrentYieldApy}
            />
          ) : (
            <Card className="w-full h-full flex items-center justify-center bg-muted/50 border-border">
              <p className="text-muted-foreground text-sm">Connect wallet to view balances.</p>
            </Card>
          )}
        </div>

        <div className="w-full md:max-w-xl flex flex-col gap-4">
          {baseVaultData.map((vault) => {
            // Combine loading and error states from balances, APYs, and prices
            const isLoading = isLoadingBalances || isLoadingApys || isLoadingPrices;
            const isError = isErrorBalances || isErrorApys || !!errorPrices;

            // Determine the correct deposited balance (now in USD)
            let depositedUsdValue = "$0.00";
            let numericDepositedBalance = 0; // Raw token balance
            let tokenPrice: number | null = null;

            if (!isLoadingBalances && !isLoadingPrices && balances && prices) {
              switch (vault.variant) {
                case "aave":
                  numericDepositedBalance = parseFloat(balances.formattedAUsdcBalance || '0');
                  tokenPrice = prices.aave;
                  break;
                case "compound":
                  numericDepositedBalance = parseFloat(balances.formattedCUsdcBalance || '0');
                  tokenPrice = prices.compound;
                  break;
                case "fluid":
                  numericDepositedBalance = parseFloat(balances.formattedFluidBalance || '0');
                  tokenPrice = prices.fluid;
                  break;
              }

              // Calculate USD value if price is available
              if (tokenPrice !== null && numericDepositedBalance > 0) {
                const calculatedUsdValue = numericDepositedBalance * tokenPrice;
                depositedUsdValue = `$${calculatedUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              } else if (numericDepositedBalance === 0) {
                depositedUsdValue = "$0.00"; // Explicitly set to $0.00 if balance is zero
              } else {
                // Handle case where price is null but balance > 0 (e.g., price fetch failed)
                depositedUsdValue = "Error fetching price"; // Or some other indicator
                console.warn(`Price for ${vault.protocol} is null, cannot calculate USD value.`);
              }
            } else if (isErrorBalances || errorPrices) {
                depositedUsdValue = "Error"; // General error state
            }

            // Determine the correct APY
            let displayVaultApy = "N/A";
            if (!isLoadingApys && apys) {
              displayVaultApy = formatApy(apys[vault.apyKey]);
            }
            // Handle APY error state differently if needed
            if (isErrorApys) {
              displayVaultApy = "Error";
            }

            return (
              <VaultCard
                key={vault.protocol}
                protocol={vault.protocol}
                apy={displayVaultApy}
                depositedBalance={depositedUsdValue}
                variant={vault.variant}
                isLoading={isLoading}
                onClick={() => handleVaultClick(vault, depositedUsdValue)}
              />
            );
          })}
        </div>
      </div>

      {/* Render Modal */}
      {selectedVault && (
        <VaultInteractionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          protocol={selectedVault.protocol}
          variant={selectedVault.variant}
          depositedBalance={selectedVault.depositedBalance}
        />
      )}
    </div>
  );
} 