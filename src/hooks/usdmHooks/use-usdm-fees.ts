import { usePublicClient } from 'wagmi'
import { arbitrum } from 'viem/chains'
import { useEffect, useState } from 'react'

const USDM_VAULT = '0x6f43f5ebfd5219d1c57d40a44e7d4524367253a0'
const USDC_TOKEN = '0xaf88d065e77c8cc2239327c5edb3a432268e5831'

const USDM_FEE_ABI = [
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'stakingFee',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'unstakingFee',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

interface UsdmFees {
  stakingFee: number
  unstakingFee: number
}

export function useUsdmFees() {
  const publicClient = usePublicClient({ chainId: arbitrum.id })
  const [fees, setFees] = useState<UsdmFees | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchFees = async () => {
    console.log('Fetching fees...')
    console.log('Public client:', !!publicClient)
    
    if (!publicClient) {
      console.log('No public client available')
      return
    }

    setIsLoading(true)
    try {
      console.log('Making multicall to fetch fees...')
      console.log('USDM_VAULT:', USDM_VAULT)
      console.log('USDC_TOKEN:', USDC_TOKEN)

      const [stakingFee, unstakingFee] = await publicClient.multicall({
        contracts: [
          {
            address: USDM_VAULT,
            abi: USDM_FEE_ABI,
            functionName: 'stakingFee',
            args: [USDC_TOKEN],
          },
          {
            address: USDM_VAULT,
            abi: USDM_FEE_ABI,
            functionName: 'unstakingFee',
            args: [USDC_TOKEN],
          },
        ],
      })

      console.log('Raw staking fee result:', stakingFee.result)
      console.log('Raw unstaking fee result:', unstakingFee.result)

      const calculatedFees = {
        stakingFee: Number(stakingFee.result || BigInt(0)) / 1000,
        unstakingFee: Number(unstakingFee.result || BigInt(0)) / 1000,
      }

      console.log('Calculated fees:', calculatedFees)
      setFees(calculatedFees)
    } catch (error) {
      console.error('Error fetching USDM fees:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    console.log('useEffect triggered in useUsdmFees')
    fetchFees()
    const interval = setInterval(fetchFees, 1 * 60 * 1000)
    return () => clearInterval(interval)
  }, [publicClient])

  console.log('Current fees state:', fees)
  return {
    fees,
    isLoading,
    refetch: fetchFees,
  }
} 