import { useContractReads } from "wagmi"
import { useEffect, useMemo, useState } from "react"

const VAULT_ADDRESS = "0x5f19704f393f983d5932b4453c6c87e85d22095e"
const AUSDC_TOKEN_ADDRESS = "0x724dc807b04555b71ed48a6896b6f41593b8c637"

const vaultABI = [
  {
    "inputs": [],
    "name": "getVaultUSDBalance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const

const erc20ABI = [
  {
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const

export type AssetBreakdown = {
  totalValue: number
  assets: {
    type: string
    totalValue: number
    percentage: number
    assets: {
      name: string
      value: number
      percentage: number
    }[]
    color: string
  }[]
}

function convertBigIntToNumber(value: bigint, decimals: number): number {
  return Number(value) / Math.pow(10, decimals)
}

export function useVaultBreakdown() {
  const [breakdown, setBreakdown] = useState<AssetBreakdown | null>(null)

  const { data, isError, isLoading } = useContractReads({
    contracts: [
      {
        address: VAULT_ADDRESS,
        abi: vaultABI,
        functionName: 'getVaultUSDBalance',
      },
      {
        address: AUSDC_TOKEN_ADDRESS,
        abi: erc20ABI,
        functionName: 'balanceOf',
        args: [VAULT_ADDRESS],
      },
    ],
    query: {
      refetchInterval: 15000, // Refetch every 15 seconds
    }
  })

  const calculatedBreakdown = useMemo(() => {
    if (!data?.[0].result || !data?.[1].result) return null

    // Convert values from BigInt
    const totalUSD = convertBigIntToNumber(data[0].result, 30)
    const aaveUSDC = convertBigIntToNumber(data[1].result, 6) // aUSDC has 6 decimals
    const normalUSDC = totalUSD - aaveUSDC

    // Ensure we don't divide by zero
    if (totalUSD === 0) return null

    // Calculate percentages
    const aavePercentage = (aaveUSDC / totalUSD) * 100
    const normalPercentage = (normalUSDC / totalUSD) * 100

    return {
      totalValue: totalUSD,
      assets: [
        {
          type: "Stablecoins",
          totalValue: normalUSDC,
          percentage: normalPercentage,
          assets: [
            {
              name: "Circle: USDC",
              value: normalUSDC,
              percentage: normalPercentage
            }
          ],
          color: "var(--main-accent)"
        },
        {
          type: "Rehypothecation",
          totalValue: aaveUSDC,
          percentage: aavePercentage,
          assets: [
            {
              name: "AaveV3: aUSDC",
              value: aaveUSDC,
              percentage: aavePercentage
            }
          ],
          color: "transparent"
        }
      ]
    }
  }, [data])

  useEffect(() => {
    if (calculatedBreakdown) {
      setBreakdown(calculatedBreakdown)
    }
  }, [calculatedBreakdown])

  return {
    data: breakdown,
    isLoading,
    isError
  }
} 