import { usePublicClient } from 'wagmi'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { arbitrum } from 'viem/chains'
import { useEffect, useState } from 'react'

const USDM_TOKEN = '0x1e0aa9b3345727979665fcc838d76324cba22253'
const USDM_STAKING = '0xf657c2fe128145dbd97621ae2946cbc65d237a7d'

const TOKEN_ABI = [
    {
        inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            { internalType: 'address', name: 'spender', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' }
        ],
        name: 'approve',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            { internalType: 'address', name: 'owner', type: 'address' },
            { internalType: 'address', name: 'spender', type: 'address' }
        ],
        name: 'allowance',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
    }
] as const

const STAKING_ABI = [
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ type: 'uint256' }]
    },
    {
        name: 'earned',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'account', type: 'address' },
            { name: '_rewardsToken', type: 'address' }
        ],
        outputs: [{ type: 'uint256' }]
    },
    {
        name: 'getReward',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [],
        outputs: []
    },
    {
        name: 'stake',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'amount', type: 'uint256' }],
        outputs: []
    },
    {
        name: 'withdraw',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'amount', type: 'uint256' }],
        outputs: []
    },
    {
        name: 'totalSupply',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'uint256' }]
    }
] as const

const formatDisplayValue = (value: string): string => {
    const [whole, decimal] = value.split('.')
    if (!decimal) return whole
    return `${whole}.${decimal.slice(0, 2)}`
}

export interface UsdmStakingData {
    stakedBalance: bigint
    earnedBalance: bigint
    formattedStakedBalance: string
    formattedEarnedBalance: string
    displayStakedBalance: string
    displayEarnedBalance: string
    allowance: bigint
    totalStaked: bigint
    formattedTotalStaked: string
    usdmBalance: bigint
    formattedUsdmBalance: string
    displayUsdmBalance: string
}

export function useUsdmStaking() {
    const { address } = useAccount()
    const publicClient = usePublicClient({ chainId: arbitrum.id })
    const [stakingData, setStakingData] = useState<UsdmStakingData | null>(null)
    const [isError, setIsError] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const fetchBalances = async () => {
        if (!address || !publicClient) return
        setIsLoading(true)
        try {
            const [stakedBalance, earnedBalance, allowance, totalStaked, usdmBalance] = await publicClient.multicall({
                contracts: [
                    {
                        address: USDM_STAKING,
                        abi: STAKING_ABI,
                        functionName: 'balanceOf',
                        args: [address]
                    },
                    {
                        address: USDM_STAKING,
                        abi: STAKING_ABI,
                        functionName: 'earned',
                        args: [address, USDM_TOKEN]
                    },
                    {
                        address: USDM_TOKEN,
                        abi: TOKEN_ABI,
                        functionName: 'allowance',
                        args: [address, USDM_STAKING]
                    },
                    {
                        address: USDM_STAKING,
                        abi: STAKING_ABI,
                        functionName: 'totalSupply'
                    },
                    {
                        address: USDM_TOKEN,
                        abi: TOKEN_ABI,
                        functionName: 'balanceOf',
                        args: [address]
                    }
                ]
            })

            const formattedStakedBalance = formatUnits(stakedBalance.result || BigInt(0), 18)
            const formattedEarnedBalance = formatUnits(earnedBalance.result || BigInt(0), 18)
            const formattedTotalStaked = formatUnits(totalStaked.result || BigInt(0), 18)
            const formattedUsdmBalance = formatUnits(usdmBalance.result || BigInt(0), 18)

            setStakingData({
                stakedBalance: stakedBalance.result || BigInt(0),
                earnedBalance: earnedBalance.result || BigInt(0),
                formattedStakedBalance,
                formattedEarnedBalance,
                displayStakedBalance: formatDisplayValue(formattedStakedBalance),
                displayEarnedBalance: formatDisplayValue(formattedEarnedBalance),
                allowance: allowance.result || BigInt(0),
                totalStaked: totalStaked.result || BigInt(0),
                formattedTotalStaked,
                usdmBalance: usdmBalance.result || BigInt(0),
                formattedUsdmBalance,
                displayUsdmBalance: formatDisplayValue(formattedUsdmBalance)
            })
            setIsError(false)
        } catch (error) {
            console.error('Error fetching balances:', error)
            setIsError(true)
        } finally {
            setIsLoading(false)
        }
    }

    const claim = async () => {
        if (!address || !publicClient) return
        try {
            const { request } = await publicClient.simulateContract({
                address: USDM_STAKING,
                abi: STAKING_ABI,
                functionName: 'getReward',
                account: address,
            })
            return request
        } catch (error) {
            console.error('Error claiming rewards:', error)
            throw error
        }
    }

    const stake = async (amount: bigint) => {
        if (!address || !publicClient) return
        try {
            const { request } = await publicClient.simulateContract({
                address: USDM_STAKING,
                abi: STAKING_ABI,
                functionName: 'stake',
                account: address,
                args: [amount]
            })
            return request
        } catch (error) {
            console.error('Error staking:', error)
            throw error
        }
    }

    const withdraw = async (amount: bigint) => {
        if (!address || !publicClient) return
        try {
            const { request } = await publicClient.simulateContract({
                address: USDM_STAKING,
                abi: STAKING_ABI,
                functionName: 'withdraw',
                account: address,
                args: [amount]
            })
            return request
        } catch (error) {
            console.error('Error withdrawing:', error)
            throw error
        }
    }

    const approve = async (amount: bigint) => {
        if (!address || !publicClient) return
        try {
            const { request } = await publicClient.simulateContract({
                address: USDM_TOKEN,
                abi: TOKEN_ABI,
                functionName: 'approve',
                args: [USDM_STAKING, amount],
                account: address,
            })
            return request
        } catch (error) {
            console.error('Error approving:', error)
            throw error
        }
    }

    useEffect(() => {
        fetchBalances()
        const interval = setInterval(fetchBalances, 10000)
        return () => clearInterval(interval)
    }, [address])

    return {
        stakingData,
        isError,
        isLoading,
        refetch: fetchBalances,
        claim,
        stake,
        withdraw,
        approve
    }
}
