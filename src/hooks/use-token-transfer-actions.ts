import { useState } from 'react';
import { useWalletClient, usePublicClient } from 'wagmi';
import { parseUnits, encodeFunctionData } from 'viem';
import { useSmartAccount } from './use-smart-account';
import { useToast } from '@/components/ui/use-toast';

const USDC_TOKEN = '0xaf88d065e77c8cc2239327c5edb3a432268e5831';

const ERC20_ABI = [
  {
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;

export function useTokenTransferActions() {
  const [isTransferring, setIsTransferring] = useState(false);
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { smartAccount, kernelClient } = useSmartAccount();
  const { toast } = useToast();

  const transferToSmartAccount = async (amount: string, fromAddress: string) => {
    if (!walletClient || !smartAccount || !publicClient) {
      toast({
        title: 'Error',
        description: 'Wallet or smart account not initialized',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsTransferring(true);

      const calldata = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [smartAccount.address, parseUnits(amount, 6)]
      });

      const hash = await walletClient.sendTransaction({
        account: fromAddress as `0x${string}`,
        to: USDC_TOKEN,
        data: calldata,
        value: BigInt(0),
      });

      toast({
        title: 'Transaction Sent',
        description: 'Waiting for confirmation...',
      });

      await publicClient.waitForTransactionReceipt({ hash });

      toast({
        title: 'Success',
        description: `Successfully transferred ${amount} USDC to smart account`,
      });

      return hash;
    } catch (error: any) {
      if (error?.message?.includes("User rejected") || 
          error?.message?.toLowerCase().includes("rejected") ||
          error?.code === 4001) {
        toast({
          title: 'Error',
          description: 'User rejected the transaction',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to transfer to smart account',
          variant: 'destructive',
        });
      }
      throw error;
    } finally {
      setIsTransferring(false);
    }
  };

  const withdrawFromSmartAccount = async (amount: string, toAddress: string) => {
    if (!kernelClient || !smartAccount) {
      toast({
        title: 'Error',
        description: '1CT wallet not initialized',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsTransferring(true);

      const calldata = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [toAddress as `0x${string}`, parseUnits(amount, 6)]
      });

      const hash = await kernelClient.sendTransaction({
        to: USDC_TOKEN,
        data: calldata,
      });

      toast({
        title: 'Transaction Sent',
        description: 'Withdrawing from 1CT wallet...',
      });

      // Wait for transaction confirmation
      const receipt = await publicClient?.waitForTransactionReceipt({ hash });

      toast({
        title: 'Success',
        description: `Successfully withdrawn ${amount} USDC from 1CT wallet`,
      });

      return receipt?.transactionHash;
    } catch (error: any) {
      if (error?.message?.includes("User rejected") || 
          error?.message?.toLowerCase().includes("rejected") ||
          error?.code === 4001) {
        toast({
          title: 'Error',
          description: 'User rejected the transaction',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to withdraw from 1CT wallet',
          variant: 'destructive',
        });
      }
      throw error;
    } finally {
      setIsTransferring(false);
    }
  };

  return {
    transferToSmartAccount,
    withdrawFromSmartAccount,
    isTransferring,
  };
}
