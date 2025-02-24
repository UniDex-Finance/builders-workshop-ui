import { useContractRead } from 'wagmi'
import { useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import { useEffect, useState } from 'react'
import { Chain } from 'viem'

const MOLTEN_TOKEN_ADDRESS = '0x66E535e8D2ebf13F49F3D49e5c50395a97C137b1'

const ERC20_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

export function useGetMoltenBalance(chain: Chain | undefined) {
  const { address: eoaAddress } = useAccount()
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [formattedBalance, setFormattedBalance] = useState<string>("0");

  const { data, refetch } = useContractRead({
    address: MOLTEN_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: eoaAddress ? [eoaAddress] : undefined,
    chainId: chain?.id,
    query: {
      enabled: !!eoaAddress && !!chain,
      staleTime: 4000,
      refetchInterval: 5000,
    }
  })

    useEffect(() => {
        if (data) {
            setBalance(data);
            setFormattedBalance(formatUnits(data, 18)); // Assuming Molten has 18 decimals
        }
    }, [data])

  return { balance, formattedBalance, refetch }
}
