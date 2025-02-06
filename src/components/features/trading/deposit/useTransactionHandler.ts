import { useState, useRef, useCallback } from "react";
import { parseUnits, encodeFunctionData } from "viem";
import { TransactionHandlerProps } from "./types";

const TRADING_CONTRACT = "0x5f19704F393F983d5932b4453C6C87E85D22095E";
const USDC_TOKEN = "0xaf88d065e77c8cc2239327c5edb3a432268e5831";

const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const REFETCH_THROTTLE = 3000; // 5 seconds

export function useTransactionHandler({
  smartAccount,
  kernelClient,
  toast,
  refetchBalances,
}: TransactionHandlerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const lastRefetchRef = useRef<number>(0);

  const throttledRefetch = useCallback(() => {
    const now = Date.now();
    if (now - lastRefetchRef.current >= REFETCH_THROTTLE) {
      lastRefetchRef.current = now;
      refetchBalances();
    }
  }, [refetchBalances]);

  const handleApproveAndDeposit = async (amount: string) => {
    if (!smartAccount || !kernelClient) return;

    try {
      setIsApproving(true);
      toast({
        title: "Processing",
        description: "Approving USDC for trading contract...",
      });

      const approveCalldata = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "approve",
        args: [TRADING_CONTRACT, parseUnits(amount, 6)],
      });

      const depositResponse = await fetch(
        "https://unidexv4-api-production.up.railway.app/api/wallet",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "deposit",
            tokenAddress: USDC_TOKEN,
            amount,
            userAddress: smartAccount.address,
          }),
        }
      );

      const depositData = await depositResponse.json();
      if (!depositResponse.ok) {
        throw new Error(depositData.error || "Failed to process deposit operation");
      }

      await kernelClient.sendTransactions({
        transactions: [
          { to: USDC_TOKEN, data: approveCalldata },
          { to: depositData.vaultAddress, data: depositData.calldata },
        ],
      });

      toast({
        title: "Success",
        description: `Successfully deposited ${amount} USDC`,
      });

      throttledRefetch();
    } catch (error: any) {
      if (error?.message?.includes("User rejected") || 
          error?.message?.toLowerCase().includes("rejected") ||
          error?.code === 4001) {  // MetaMask user rejection code
        toast({
          title: "Error",
          description: "User rejected the transaction",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to approve and deposit USDC",
          variant: "destructive",
        });
      }
      throw error;
    } finally {
      setIsApproving(false);
    }
  };

  const handleTradingOperation = async (type: "deposit" | "withdraw", amount: string) => {
    if (!smartAccount || !kernelClient) return;

    try {
      setIsLoading(true);

      const response = await fetch(
        "https://unidexv4-api-production.up.railway.app/api/wallet",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            tokenAddress: USDC_TOKEN,
            amount,
            userAddress: smartAccount.address,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to process wallet operation");
      }

      await kernelClient.sendTransaction({
        to: data.vaultAddress,
        data: data.calldata,
      });

      toast({
        title: "Success",
        description: `Successfully ${type}ed ${amount} USDC`,
      });

      throttledRefetch();
    } catch (error: any) {
      if (error?.message?.includes("User rejected") || 
          error?.message?.toLowerCase().includes("rejected") ||
          error?.code === 4001) {  // MetaMask user rejection code
        toast({
          title: "Error",
          description: "User rejected the transaction",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to ${type}`,
          variant: "destructive",
        });
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    isApproving,
    handleApproveAndDeposit,
    handleTradingOperation,
  };
}
