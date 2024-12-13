import { usePublicClient } from 'wagmi'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { arbitrum } from 'viem/chains'
import { useEffect, useState } from 'react'

const MOLTEN_TOKEN = '0x66E535e8D2ebf13F49F3D49e5c50395a97C137b1'
const MOLTEN_STAKING = '0x35AD17C9EE4aab967ECBD95b4ce7Eb9D8E761A2B'

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


export interface MoltenStakingData {
    walletBalance: bigint
    stakedBalance: bigint
    earnedBalance: bigint
    formattedWalletBalance: string
    formattedStakedBalance: string
    formattedEarnedBalance: string
    displayWalletBalance: string
    displayStakedBalance: string
    displayEarnedBalance: string
    allowance: bigint
    totalStaked: bigint
    formattedTotalStaked: string
    percentageStaked: string
}


export function useMoltenStaking() {
    const { address: eoaAddress } = useAccount()
    const publicClient = usePublicClient({ chainId: arbitrum.id })
    const [stakingData, setStakingData] = useState<MoltenStakingData | null>(null)
    const [isError, setIsError] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const fetchBalances = async () => {
        if (!publicClient) return
        setIsLoading(true)
        try {
            // First fetch public data (total staked)
            const [totalStaked] = await publicClient.multicall({
                contracts: [
                    {
                        address: MOLTEN_STAKING,
                        abi: STAKING_ABI,
                        functionName: 'totalSupply'
                    }
                ]
            })

            // Initialize data with public values
            const formattedTotalStaked = formatUnits(totalStaked.result || BigInt(0), 18)
            const percentageStaked = ((Number(totalStaked.result || BigInt(0)) / 10**18) / 3900000 * 100).toFixed(2)

            let userData = {
                walletBalance: BigInt(0),
                stakedBalance: BigInt(0),
                earnedBalance: BigInt(0),
                formattedWalletBalance: '0',
                formattedStakedBalance: '0',
                formattedEarnedBalance: '0',
                displayWalletBalance: '0',
                displayStakedBalance: '0',
                displayEarnedBalance: '0',
                allowance: BigInt(0),
            }

            // Only fetch user-specific data if wallet is connected
            if (eoaAddress) {
                const [walletBalance, stakedBalance, earnedBalance, allowance] = await publicClient.multicall({
                    contracts: [
                        {
                            address: MOLTEN_TOKEN,
                            abi: TOKEN_ABI,
                            functionName: 'balanceOf',
                            args: [eoaAddress]
                        },
                        {
                            address: MOLTEN_STAKING,
                            abi: STAKING_ABI,
                            functionName: 'balanceOf',
                            args: [eoaAddress]
                        },
                        {
                            address: MOLTEN_STAKING,
                            abi: STAKING_ABI,
                            functionName: 'earned',
                            args: [eoaAddress, MOLTEN_TOKEN]
                        },
                        {
                            address: MOLTEN_TOKEN,
                            abi: TOKEN_ABI,
                            functionName: 'allowance',
                            args: [eoaAddress, MOLTEN_STAKING]
                        }
                    ]
                })

                const formattedWalletBalance = formatUnits(walletBalance.result || BigInt(0), 18)
                const formattedStakedBalance = formatUnits(stakedBalance.result || BigInt(0), 18)
                const formattedEarnedBalance = formatUnits(earnedBalance.result || BigInt(0), 18)

                userData = {
                    walletBalance: walletBalance.result || BigInt(0),
                    stakedBalance: stakedBalance.result || BigInt(0),
                    earnedBalance: earnedBalance.result || BigInt(0),
                    formattedWalletBalance,
                    formattedStakedBalance,
                    formattedEarnedBalance,
                    displayWalletBalance: formatDisplayValue(formattedWalletBalance),
                    displayStakedBalance: formatDisplayValue(formattedStakedBalance),
                    displayEarnedBalance: formatDisplayValue(formattedEarnedBalance),
                    allowance: allowance.result || BigInt(0),
                }
            }

            setStakingData({
                ...userData,
                totalStaked: totalStaked.result || BigInt(0),
                formattedTotalStaked,
                percentageStaked
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
        if (!eoaAddress || !publicClient) return
        try {
            const { request } = await publicClient.simulateContract({
                address: MOLTEN_STAKING,
                abi: STAKING_ABI,
                functionName: 'getReward',
                account: eoaAddress,
            })
            // Need to handle the request with your wallet client
            return request
        } catch (error) {
            console.error('Error claiming rewards:', error)
            throw error
        }
    }

    const stake = async (amount: bigint) => {
        if (!eoaAddress || !publicClient) return
        try {
            const { request } = await publicClient.simulateContract({
                address: MOLTEN_STAKING,
                abi: STAKING_ABI,
                functionName: 'stake',
                account: eoaAddress,
                args: [amount]
            })
            return request
        } catch (error) {
            console.error('Error staking:', error)
            throw error
        }
    }

    const withdraw = async (amount: bigint) => {
        if (!eoaAddress || !publicClient) return
        try {
            const { request } = await publicClient.simulateContract({
                address: MOLTEN_STAKING,
                abi: STAKING_ABI,
                functionName: 'withdraw',
                account: eoaAddress,
                args: [amount]
            })
            return request
        } catch (error) {
            console.error('Error withdrawing:', error)
            throw error
        }
    }

    const approve = async (amount: bigint) => {
        if (!eoaAddress || !publicClient) return
        try {
            const { request } = await publicClient.simulateContract({
                address: MOLTEN_TOKEN,
                abi: TOKEN_ABI,
                functionName: 'approve',
                args: [MOLTEN_STAKING, amount],
                account: eoaAddress,
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
    }, [eoaAddress])

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
