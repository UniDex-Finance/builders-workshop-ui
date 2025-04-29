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

    
    if (!publicClient) {
      return
    }

    setIsLoading(true)
    try {


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



      const calculatedFees = {
        stakingFee: Number(stakingFee.result || BigInt(0)) / 1000,
        unstakingFee: Number(unstakingFee.result || BigInt(0)) / 1000,
      }

      setFees(calculatedFees)
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFees()
    const interval = setInterval(fetchFees, 1 * 60 * 1000)
    return () => clearInterval(interval)
  }, [publicClient])

  return {
    fees,
    isLoading,
    refetch: fetchFees,
  }
} 