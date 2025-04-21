import { useContractRead, useContractReads } from 'wagmi';
import { useSmartAccount } from '../use-smart-account'; // Assuming this path is correct relative to use-lending-balances
import { formatUnits } from 'viem';
import { arbitrum } from 'viem/chains';
import { useMemo } from 'react';

// Aave USDC (aArbUSDC) on Arbitrum
const AAVE_USDC_ADDRESS = '0x724dc807b04555b71ed48a6896b6f41593b8c637';
const AAVE_USDC_DECIMALS = 6; // 6 decimals like USDC

// Compound USDC (cUSDCv3) on Arbitrum
const COMPOUND_USDC_ADDRESS = '0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf';
const COMPOUND_USDC_DECIMALS = 6; // 6 decimals like USDC

// Fluid Token (assuming this represents deposited balance in Fluid protocol)
const FLUID_TOKEN_ADDRESS = '0x1A996cb54bb95462040408C06122D45D6Cdb6096';
const FLUID_TOKEN_DECIMALS = 6; // 6 decimals like USDC

// Minimal ERC20 ABI for balanceOf
const ERC20_ABI_MINIMAL = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Reusing constants from use-balances.ts (consider centralizing these)
const BALANCES_CONTRACT = '0xeae57c7bce5caf160343a83440e98bc976ab7274';
const BALANCES_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getUserBalances',
    outputs: [
      { internalType: 'uint256', name: 'ethBalance', type: 'uint256' },
      { internalType: 'uint256', name: 'usdcBalance', type: 'uint256' },
      { internalType: 'uint256', name: 'usdcAllowance', type: 'uint256' },
      { internalType: 'uint256', name: 'musdBalance', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

// Helper function (optional, could be moved to a utils file)
function truncateToTwoDecimals(value: string): string {
  const parts = value.split('.');
  if (parts.length === 2) {
    return `${parts[0]}.${parts[1].slice(0, 2)}`;
  }
  return value;
}

export interface LendingBalances {
  usdcBalance: bigint;       // Raw USDC balance (for calculations)
  musdBalance: bigint;       // Raw MUSD balance (for calculations) - Assuming 30 decimals
  aUsdcBalance: bigint;      // Raw Aave USDC balance
  cUsdcBalance: bigint;      // Raw Compound USDC balance
  fluidBalance: bigint;      // Raw Fluid token balance
  formattedUsdcBalance: string; // Formatted USDC balance (for display)
  formattedMusdBalance: string; // Formatted MUSD balance (for display)
  formattedAUsdcBalance: string; // Formatted Aave USDC balance (for display)
  formattedCUsdcBalance: string; // Formatted Compound USDC balance (for display)
  formattedFluidBalance: string; // Formatted Fluid token balance (for display)
}

export function useLendingBalances() {
  const { smartAccount, isInitialized: isSmartAccountInitialized } = useSmartAccount();

  // Contract calls configuration
  const multiBalancesContract = {
    address: BALANCES_CONTRACT,
    abi: BALANCES_ABI,
    functionName: 'getUserBalances',
    args: [smartAccount?.address!], // Use ! assertion assuming enabled logic handles undefined
    chainId: arbitrum.id,
  } as const;

  const aUsdcContract = {
    address: AAVE_USDC_ADDRESS,
    abi: ERC20_ABI_MINIMAL,
    functionName: 'balanceOf',
    args: [smartAccount?.address!], // Use ! assertion assuming enabled logic handles undefined
    chainId: arbitrum.id,
  } as const;

  const cUsdcContract = {
    address: COMPOUND_USDC_ADDRESS,
    abi: ERC20_ABI_MINIMAL,
    functionName: 'balanceOf',
    args: [smartAccount?.address!], // Use ! assertion assuming enabled logic handles undefined
    chainId: arbitrum.id,
  } as const;

  const fluidContract = {
    address: FLUID_TOKEN_ADDRESS,
    abi: ERC20_ABI_MINIMAL,
    functionName: 'balanceOf',
    args: [smartAccount?.address!], // Use ! assertion assuming enabled logic handles undefined
    chainId: arbitrum.id,
  } as const;

  const {
    data: combinedData,
    isError: combinedIsError,
    isLoading: combinedIsLoading,
    refetch: refetchLendingBalances,
  } = useContractReads({
    contracts: [multiBalancesContract, aUsdcContract, cUsdcContract, fluidContract],
    query: {
        enabled: !!smartAccount?.address && isSmartAccountInitialized,
        staleTime: 5000,
        refetchInterval: 6000,
        select: (data) => {
            const multiResult = data[0];
            const aUsdcResult = data[1];
            const cUsdcResult = data[2];
            const fluidResult = data[3]; // Add Fluid result

            if (multiResult.status !== 'success' || 
                aUsdcResult.status !== 'success' ||
                cUsdcResult.status !== 'success' ||
                fluidResult.status !== 'success' // Check Fluid result status
            ) {
              // Handle potential individual call failures if needed, or let combinedIsError handle it
              // For now, return undefined if any part fails to ensure type safety below
              return undefined;
            }

            const [, usdcBalance, , musdBalance] = multiResult.result as readonly [bigint, bigint, bigint, bigint];
            const aUsdcBalance = aUsdcResult.result as bigint;
            const cUsdcBalance = cUsdcResult.result as bigint;
            const fluidBalance = fluidResult.result as bigint; // Extract Fluid balance

            return {
              usdcBalance: usdcBalance,
              musdBalance: musdBalance,
              aUsdcBalance: aUsdcBalance,
              cUsdcBalance: cUsdcBalance,
              fluidBalance: fluidBalance, // Include raw Fluid balance
              formattedUsdcBalance: formatUnits(usdcBalance, 6),
              formattedMusdBalance: formatUnits(musdBalance, 30), // Keep 30 decimals for MUSD
              formattedAUsdcBalance: formatUnits(aUsdcBalance, AAVE_USDC_DECIMALS),
              formattedCUsdcBalance: formatUnits(cUsdcBalance, COMPOUND_USDC_DECIMALS),
              formattedFluidBalance: formatUnits(fluidBalance, FLUID_TOKEN_DECIMALS), // Include formatted Fluid balance
            };
          },
    },
  });


  // Use combined loading state, considering smart account initialization
  const isLoading = combinedIsLoading || !isSmartAccountInitialized;

  // Memoize the results to prevent unnecessary re-renders
  const balances: LendingBalances | undefined = useMemo(() => {
    return combinedData;
  }, [combinedData]);


  return {
    balances,
    isLoading,
    isError: combinedIsError, // Use combined error state
    refetchLendingBalances,
  };
}
