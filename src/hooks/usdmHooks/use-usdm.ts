import { usePublicClient } from 'wagmi'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { arbitrum } from 'viem/chains'
import { useEffect, useState } from 'react'
import { useBalances } from './use-balances'

const USDM_TOKEN = '0x1e0aa9b3345727979665fcc838d76324cba22253'
const USDM_VAULT = '0x5f19704F393F983d5932b4453C6C87E85D22095E'
const USDC_TOKEN = '0xaf88d065e77c8cc2239327c5edb3a432268e5831'

const USDM_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'stake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'tokenOut', type: 'address' },
      { internalType: 'uint256', name: 'usdmAmount', type: 'uint256' },
    ],
    name: 'unstake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getUSDMPrice',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getVaultUSDBalance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const ERC20_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

interface UsdmData {
  usdcAllowance: bigint
  usdmAllowance: bigint
  usdmBalance: bigint
  formattedUsdmBalance: string
  displayUsdmBalance: string
  usdmPrice: bigint
  formattedUsdmPrice: string
  vaultBalance: bigint
  formattedVaultBalance: string
}

export function useUsdm() {
  const { address } = useAccount()
  const publicClient = usePublicClient({ chainId: arbitrum.id })
  const [usdmData, setUsdmData] = useState<UsdmData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { balances } = useBalances('arbitrum')

  const fetchData = async () => {
    if (!address || !publicClient) return
    setIsLoading(true)
    try {
      const [usdcAllowance, usdmAllowance, usdmBalance, usdmPrice, vaultBalance] = await publicClient.multicall({
        contracts: [
          {
            address: USDC_TOKEN,
            abi: ERC20_ABI,
            functionName: 'allowance',
            args: [address, USDM_VAULT],
          },
          {
            address: USDM_TOKEN,
            abi: ERC20_ABI,
            functionName: 'allowance',
            args: [address, USDM_VAULT],
          },
          {
            address: USDM_TOKEN,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address],
          },
          {
            address: USDM_VAULT,
            abi: USDM_ABI,
            functionName: 'getUSDMPrice',
            args: [],
          },
          {
            address: USDM_VAULT,
            abi: USDM_ABI,
            functionName: 'getVaultUSDBalance',
            args: [],
          },
        ],
      })

      const formattedUsdmBalance = formatUnits(usdmBalance.result || BigInt(0), 18)
      const formattedUsdmPrice = formatUnits(usdmPrice.result || BigInt(0), 5)
      // Update vault balance calculation: divide by 10^30
      const rawVaultBalance = vaultBalance.result || BigInt(0)
      const formattedVaultBalance = (Number(rawVaultBalance) / Number(10n ** 30n)).toFixed(2)
      
      setUsdmData({
        usdcAllowance: usdcAllowance.result || BigInt(0),
        usdmAllowance: usdmAllowance.result || BigInt(0),
        usdmBalance: usdmBalance.result || BigInt(0),
        usdmPrice: usdmPrice.result || BigInt(0),
        vaultBalance: rawVaultBalance,
        formattedUsdmBalance,
        formattedUsdmPrice,
        formattedVaultBalance,
        displayUsdmBalance: formattedUsdmBalance.split('.')[1] 
          ? `${formattedUsdmBalance.split('.')[0]}.${formattedUsdmBalance.split('.')[1].slice(0, 2)}`
          : formattedUsdmBalance,
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const approveUsdc = async (amount: bigint) => {
    if (!address || !publicClient) return
    try {
      const { request } = await publicClient.simulateContract({
        address: USDC_TOKEN,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [USDM_VAULT, amount],
        account: address,
      })
      return request
    } catch (error) {
      console.error('Error approving USDC:', error)
      throw error
    }
  }

  const approveUsdm = async (amount: bigint) => {
    if (!address || !publicClient) return
    try {
      const { request } = await publicClient.simulateContract({
        address: USDM_TOKEN,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [USDM_VAULT, amount],
        account: address,
      })
      return request
    } catch (error) {
      console.error('Error approving USDM:', error)
      throw error
    }
  }

  const mint = async (amount: bigint) => {
    if (!address || !publicClient) return
    try {
      const { request } = await publicClient.simulateContract({
        address: USDM_VAULT,
        abi: USDM_ABI,
        functionName: 'stake',
        args: [address, USDC_TOKEN, amount],
        account: address,
      })
      return request
    } catch (error) {
      console.error('Error minting USDM:', error)
      throw error
    }
  }

  const burn = async (amount: bigint) => {
    if (!address || !publicClient) return
    try {
      const { request } = await publicClient.simulateContract({
        address: USDM_VAULT,
        abi: USDM_ABI,
        functionName: 'unstake',
        args: [USDC_TOKEN, amount],
        account: address,
      })
      return request
    } catch (error) {
      console.error('Error burning USDM:', error)
      throw error
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [address])

  return {
    usdmData,
    isLoading,
    approveUsdc,
    approveUsdm,
    mint,
    burn,
    refetch: fetchData,
    usdcBalance: balances?.formattedEoaUsdcBalance || '0',
    usdcBalanceRaw: balances?.eoaUsdcBalance || BigInt(0),
  }
}
