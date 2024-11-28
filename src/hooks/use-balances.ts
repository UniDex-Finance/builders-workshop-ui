import { useContractRead } from 'wagmi'
import { useSmartAccount } from './use-smart-account'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { useEffect, useMemo } from 'react'
import { optimism, arbitrum } from 'viem/chains'
import { useBalancesStore } from '../stores/balances'

const BALANCES_CONTRACT = '0xeae57c7bce5caf160343a83440e98bc976ab7274'
const USDC_TOKEN = '0xaf88d065e77c8cc2239327c5edb3a432268e5831'
const USDC_TOKEN_OPTIMISM = '0x0b2c639c533813f4aa9d7837caf62653d097ff85'

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
] as const

const ERC20_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

export interface Balances {
  ethBalance: bigint
  usdcBalance: bigint
  usdcAllowance: bigint
  musdBalance: bigint
  formattedEthBalance: string
  formattedUsdcBalance: string
  formattedUsdcAllowance: string
  formattedMusdBalance: string
  eoaUsdcBalance: bigint
  eoaOptimismUsdcBalance: bigint
  formattedEoaUsdcBalance: string
  formattedEoaOptimismUsdcBalance: string
}

function truncateToTwoDecimals(value: string): string {
  const parts = value.split('.');
  if (parts.length === 2) {
    return `${parts[0]}.${parts[1].slice(0, 2)}`;
  }
  return value;
}

export function useBalances(selectedNetwork: 'arbitrum' | 'optimism' = 'arbitrum') {
  const { smartAccount, isInitialized } = useSmartAccount()
  const { address: eoaAddress } = useAccount()
  const { balances, setBalances, setLoading, setError } = useBalancesStore()

  // Memoize the contract read arguments to ensure stability
  const smartAccountArgs = useMemo(() => {
    if (!smartAccount?.address) return undefined;
    return [smartAccount.address] as const;
  }, [smartAccount?.address]);

  const eoaArgs = useMemo(() => {
    if (!eoaAddress) return undefined;
    return [eoaAddress] as const;
  }, [eoaAddress]);

  const {
    data: smartAccountData,
    isError: isSmartAccountError,
    isLoading: isSmartAccountLoading,
    refetch: refetchSmartAccount
  } = useContractRead({
    address: BALANCES_CONTRACT,
    abi: BALANCES_ABI,
    functionName: 'getUserBalances',
    args: smartAccountArgs,
    chainId: arbitrum.id,
    query: {
      enabled: !!smartAccount?.address,
      retry: 5,
      retryDelay: 1000,
      staleTime: 4000,
      refetchInterval: 5000,
      select: (data: readonly [bigint, bigint, bigint, bigint]) => {
        const [ethBalance, usdcBalance, usdcAllowance, musdBalance] = data;
        return {
          ethBalance,
          usdcBalance,
          usdcAllowance,
          musdBalance,
          formattedEthBalance: formatUnits(ethBalance, 18),
          formattedUsdcBalance: formatUnits(usdcBalance, 6),
          formattedUsdcAllowance: formatUnits(usdcAllowance, 6),
          formattedMusdBalance: truncateToTwoDecimals(formatUnits(musdBalance, 30)),
        };
      }
    }
  })

  // Arbitrum USDC Balance
  const { 
    data: eoaUsdcBalance,
    refetch: refetchEoaArbitrum
  } = useContractRead({
    address: USDC_TOKEN,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: eoaArgs,
    chainId: arbitrum.id,
    query: {
      enabled: !!eoaAddress && selectedNetwork === 'arbitrum',
      staleTime: 4000,
      refetchInterval: 5000,
    }
  })

  // Optimism USDC Balance
  const { 
    data: eoaOptimismUsdcBalance,
    refetch: refetchEoaOptimism
  } = useContractRead({
    address: USDC_TOKEN_OPTIMISM,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: eoaArgs,
    chainId: optimism.id,
    query: {
      enabled: !!eoaAddress && selectedNetwork === 'optimism',
      staleTime: 4000,
      refetchInterval: 5000,
    }
  })

  // Update store when data changes
  useEffect(() => {
    if (!smartAccountData) return;

    const currentEoaBalance = selectedNetwork === 'arbitrum' ? eoaUsdcBalance : eoaOptimismUsdcBalance;

    setBalances({
      ...smartAccountData,
      eoaUsdcBalance: eoaUsdcBalance || BigInt(0),
      eoaOptimismUsdcBalance: eoaOptimismUsdcBalance || BigInt(0),
      formattedEoaUsdcBalance: currentEoaBalance ? formatUnits(currentEoaBalance, 6) : '0',
      formattedEoaOptimismUsdcBalance: eoaOptimismUsdcBalance ? formatUnits(eoaOptimismUsdcBalance, 6) : '0'
    });
  }, [smartAccountData, eoaUsdcBalance, eoaOptimismUsdcBalance, selectedNetwork]);

  // Update loading state
  useEffect(() => {
    setLoading(isSmartAccountLoading || !isInitialized);
  }, [isSmartAccountLoading, isInitialized]);

  // Update error state
  useEffect(() => {
    setError(isSmartAccountError);
  }, [isSmartAccountError]);

  const refetchBalances = async () => {
    try {
      await Promise.all([
        smartAccountArgs ? refetchSmartAccount() : Promise.resolve(null),
        eoaArgs && selectedNetwork === 'arbitrum' ? refetchEoaArbitrum() : Promise.resolve(null),
        eoaArgs && selectedNetwork === 'optimism' ? refetchEoaOptimism() : Promise.resolve(null)
      ]);
    } catch (error) {
      console.error('Error refetching balances:', error);
    }
  };

  return {
    balances,
    isError: isSmartAccountError,
    isLoading: isSmartAccountLoading || !isInitialized,
    refetchBalances
  }
}