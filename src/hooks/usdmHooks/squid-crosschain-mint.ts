import { useCallback } from 'react'
import { createPublicClient, http, encodeFunctionData, parseUnits, formatUnits } from 'viem'
import { arbitrum, optimism, base, mainnet } from 'viem/chains'
import axios from 'axios'

const INTEGRATOR_ID = "unidex-77ac50ba-0584-461c-a9e9-2e6621269fdc"
const SQUID_CONTRACT = '0xce16F69375520ab01377ce7B88f5BA8C48F8D666'
const VAULT_CONTRACT = '0x5f19704F393F983d5932b4453C6C87E85D22095E'
const ARBITRUM_USDC_ADDRESS = '0xaf88d065e77c8cc2239327c5edb3a432268e5831'

type TokenConfig = {
  address: string
  decimals: number
}

type ChainConfig = {
  chain: typeof arbitrum | typeof optimism | typeof base | typeof mainnet
  tokens: { [key: string]: TokenConfig }
}

const chainConfigs: { [key: string]: ChainConfig } = {
  '42161': {
    chain: arbitrum,
    tokens: {
      USDC: { address: ARBITRUM_USDC_ADDRESS, decimals: 6 },
    },
  },
  '1': {
    chain: mainnet,
    tokens: {
      USDC: { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', decimals: 6 },
    },
  },
  '10': {
    chain: optimism,
    tokens: {
      USDC: { address: '0x0b2c639c533813f4aa9d7837caf62653d097ff85', decimals: 6 },
    },
  },
  '8453': {
    chain: base,
    tokens: {
      USDC: { address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', decimals: 6 },
    },
  },
}

const erc20Abi = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }, { name: '_spender', type: 'address' }],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [{ name: '_spender', type: 'address' }, { name: '_value', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
]

const vaultAbi = [
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'stake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

const getRoute = async (params: any) => {
  try {
    const result = await axios.post(
      'https://apiplus.squidrouter.com/v2/route',
      params,
      {
        headers: {
          'x-integrator-id': INTEGRATOR_ID,
          'Content-Type': 'application/json',
        },
      }
    )
    return result.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error getting route:', error.response?.data || error.message)
      throw new Error(`Axios error: ${error.response?.data?.message || error.message}`)
    } else {
      console.error('Error getting route:', (error as Error).message)
      throw error
    }
  }
}

const safeAccess = (obj: any, path: string) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj)
}

export const useSquidCrossChainMint = () => {
  const checkApproval = useCallback(async (
    userAddress: string,
    fromChainId: string,
    tokenAddress: string,
    amount: string
  ) => {
    const chainConfig = chainConfigs[fromChainId]
    if (!chainConfig) throw new Error('Unsupported chain')

    const tokenConfig = Object.entries(chainConfig.tokens).find(([_, config]) => 
      config.address.toLowerCase() === tokenAddress.toLowerCase()
    )
    if (!tokenConfig) throw new Error('Unsupported token')

    const [_, tokenData] = tokenConfig

    const publicClient = createPublicClient({
      chain: chainConfig.chain,
      transport: http(),
    })

    const amountInWei = parseUnits(amount, tokenData.decimals)

    const allowance = await publicClient.readContract({
      address: tokenData.address as `0x${string}`,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [userAddress as `0x${string}`, SQUID_CONTRACT as `0x${string}`],
    }) as bigint

    const needsApproval = allowance < amountInWei

    if (needsApproval) {
      return {
        needsApproval: true,
        currentApproval: formatUnits(allowance, tokenData.decimals),
        approvalData: {
          address: tokenData.address as `0x${string}`,
          abi: erc20Abi,
          functionName: 'approve',
          args: [SQUID_CONTRACT as `0x${string}`, amountInWei],
        },
      }
    }

    return {
      needsApproval: false,
      currentApproval: formatUnits(allowance, tokenData.decimals),
    }
  }, [])

  const getCrossChainMintTransaction = useCallback(async (
    userAddress: string,
    fromChainId: string,
    tokenAddress: string,
    amount: string
  ) => {
    const chainConfig = chainConfigs[fromChainId]
    if (!chainConfig) throw new Error('Unsupported chain')

    const tokenConfig = Object.entries(chainConfig.tokens).find(([_, config]) => 
      config.address.toLowerCase() === tokenAddress.toLowerCase()
    )
    if (!tokenConfig) throw new Error('Unsupported token')

    const [_, tokenData] = tokenConfig
    const amountInWei = parseUnits(amount, tokenData.decimals)
    const amountForApi = formatUnits(amountInWei, 0)

    const arbitrumConfig = chainConfigs['42161']
    const arbitrumUSDC = arbitrumConfig.tokens.USDC

    const params = {
      fromAddress: userAddress,
      fromChain: fromChainId,
      fromToken: tokenData.address,
      fromAmount: amountForApi,
      toChain: '42161',
      enableExpress: true,
      toToken: ARBITRUM_USDC_ADDRESS,
      toAddress: userAddress,
      slippage: 10,
      enableForecall: true,
      quoteOnly: false,
      postHook: {
        chainType: 'evm',
        calls: [
          {
            callType: 1,
            target: ARBITRUM_USDC_ADDRESS,
            value: '0',
            callData: encodeFunctionData({
              abi: erc20Abi,
              functionName: 'approve',
              args: [VAULT_CONTRACT as `0x${string}`, amountInWei],
            }),
            payload: {
              tokenAddress: ARBITRUM_USDC_ADDRESS,
              inputPos: '1',
            },
            estimatedGas: '150000',
            chainType: "evm",
          },
          {
            callType: 1,
            target: VAULT_CONTRACT,
            value: '0',
            callData: encodeFunctionData({
              abi: vaultAbi,
              functionName: 'stake',
              args: [userAddress as `0x${string}`, ARBITRUM_USDC_ADDRESS as `0x${string}`, amountInWei],
            }),
            payload: {
              tokenAddress: ARBITRUM_USDC_ADDRESS,
              inputPos: '2',
            },
            estimatedGas: '850000',
            chainType: "evm",
          },
        ],
        provider: "UniDex",
        description: "UniDex Cross-Chain Perp Deposit",
        logoURI: "https://pbs.twimg.com/profile_images/1548647667135291394/W2WOtKUq_400x400.jpg",
      },
    }

    const route = await getRoute(params)

    const routeToToken = safeAccess(route, 'route.toToken')
    if (routeToToken && routeToToken.toLowerCase() !== ARBITRUM_USDC_ADDRESS.toLowerCase()) {
      throw new Error('Invalid route: output token does not match Arbitrum USDC')
    }

    return {
      transactionRequest: safeAccess(route, 'route.transactionRequest') || {},
      toAmount: formatUnits(BigInt(safeAccess(route, 'route.estimate.toAmount') || '0'), arbitrumUSDC.decimals),
      toAmountMin: formatUnits(BigInt(safeAccess(route, 'route.estimate.toAmountMin') || '0'), arbitrumUSDC.decimals),
      exchangeRate: safeAccess(route, 'route.estimate.exchangeRate') || '0',
      fromAmountUSD: safeAccess(route, 'route.estimate.fromAmountUSD') || '0',
      estimatedRouteDuration: safeAccess(route, 'route.estimate.estimatedRouteDuration') || 0,
    }
  }, [])

  return {
    checkApproval,
    getCrossChainMintTransaction,
  }
}
