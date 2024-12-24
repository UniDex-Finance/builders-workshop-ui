import { useContractRead } from 'wagmi'
import { useSmartAccount } from './use-smart-account'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { useEffect, useMemo } from 'react'
import { optimism, arbitrum, base, mainnet } from 'viem/chains'
import { useBalancesStore } from '../stores/balances'

const BALANCES_CONTRACT = '0xeae57c7bce5caf160343a83440e98bc976ab7274'
const USDC_TOKEN = '0xaf88d065e77c8cc2239327c5edb3a432268e5831'
const USDC_TOKEN_OPTIMISM = '0x0b2c639c533813f4aa9d7837caf62653d097ff85'
const USDC_TOKEN_BASE = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'
const USDC_TOKEN_ETH = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'

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
  eoaBaseUsdcBalance: bigint
  formattedEoaUsdcBalance: string
  formattedEoaOptimismUsdcBalance: string
  formattedEoaBaseUsdcBalance: string
  eoaEthUsdcBalance: bigint
  formattedEoaEthUsdcBalance: string
}

function truncateToTwoDecimals(value: string): string {
  const parts = value.split('.');
  if (parts.length === 2) {
    return `${parts[0]}.${parts[1].slice(0, 2)}`;
  }
  return value;
}

export function useBalances(selectedNetwork: 'arbitrum' | 'optimism' | 'base' = 'arbitrum') {
  const { address: eoaAddress } = useAccount()
  const { smartAccount, isInitialized } = useSmartAccount()
  const { balances, setBalances, setLoading, setError } = useBalancesStore()

  // Memoize the contract read arguments
  const smartAccountArgs = useMemo(() => {
    if (!smartAccount?.address) return undefined;
    return [smartAccount.address] as const;
  }, [smartAccount?.address]);

  const eoaArgs = useMemo(() => {
    if (!eoaAddress) return undefined;
    return [eoaAddress] as const;
  }, [eoaAddress]);

  // Smart Account balances (always on Arbitrum)
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
    args: eoaAddress ? [eoaAddress] : undefined,
    chainId: arbitrum.id,
    query: {
      enabled: !!eoaAddress,
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
      enabled: !!eoaAddress,
      staleTime: 4000,
      refetchInterval: 5000,
    }
  })

  // Base USDC Balance
  const { 
    data: eoaBaseUsdcBalance,
    refetch: refetchEoaBase
  } = useContractRead({
    address: USDC_TOKEN_BASE,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: eoaArgs,
    chainId: base.id,
    query: {
      enabled: !!eoaAddress,
      staleTime: 4000,
      refetchInterval: 5000,
    }
  })

  // ETH USDC Balance
  const { 
    data: eoaEthUsdcBalance,
    refetch: refetchEoaEth
  } = useContractRead({
    address: USDC_TOKEN_ETH,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: eoaArgs,
    chainId: mainnet.id,
    query: {
      enabled: !!eoaAddress,
      staleTime: 4000,
      refetchInterval: 5000,
    }
  })

  // Update store when data changes
  useEffect(() => {
    if (!smartAccountData) return;

    setBalances({
      ...smartAccountData,
      eoaUsdcBalance: eoaUsdcBalance || BigInt(0),
      eoaOptimismUsdcBalance: eoaOptimismUsdcBalance || BigInt(0),
      eoaBaseUsdcBalance: eoaBaseUsdcBalance || BigInt(0),
      eoaEthUsdcBalance: eoaEthUsdcBalance || BigInt(0),
      formattedEoaUsdcBalance: eoaUsdcBalance ? formatUnits(eoaUsdcBalance, 6) : '0',
      formattedEoaOptimismUsdcBalance: eoaOptimismUsdcBalance ? formatUnits(eoaOptimismUsdcBalance, 6) : '0',
      formattedEoaBaseUsdcBalance: eoaBaseUsdcBalance ? formatUnits(eoaBaseUsdcBalance, 6) : '0',
      formattedEoaEthUsdcBalance: eoaEthUsdcBalance ? formatUnits(eoaEthUsdcBalance, 6) : '0'
    });
  }, [smartAccountData, eoaUsdcBalance, eoaOptimismUsdcBalance, eoaBaseUsdcBalance, eoaEthUsdcBalance]);

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
        eoaArgs ? refetchEoaArbitrum() : Promise.resolve(null),
        eoaArgs ? refetchEoaOptimism() : Promise.resolve(null),
        eoaArgs ? refetchEoaBase() : Promise.resolve(null),
        eoaArgs ? refetchEoaEth() : Promise.resolve(null)
      ]);
    } catch (error) {
      console.error('Error refetching balances:', error);
    }
  };

  // When we get the EOA USDC balance
  useEffect(() => {
    if (eoaUsdcBalance) {
      setBalances({
        ...balances || {
          ethBalance: BigInt(0),
          usdcBalance: BigInt(0),
          usdcAllowance: BigInt(0),
          musdBalance: BigInt(0),
          formattedEthBalance: '0',
          formattedUsdcBalance: '0',
          formattedUsdcAllowance: '0',
          formattedMusdBalance: '0',
          eoaOptimismUsdcBalance: BigInt(0),
          eoaBaseUsdcBalance: BigInt(0),
          eoaEthUsdcBalance: BigInt(0),
          formattedEoaOptimismUsdcBalance: '0',
          formattedEoaBaseUsdcBalance: '0',
          formattedEoaEthUsdcBalance: '0'
        },
        eoaUsdcBalance: eoaUsdcBalance,
        formattedEoaUsdcBalance: formatUnits(eoaUsdcBalance, 6)
      })
    }
  }, [eoaUsdcBalance])

  return {
    balances,
    isError: isSmartAccountError,
    isLoading: isSmartAccountLoading || !isInitialized,
    refetchBalances
  }
}