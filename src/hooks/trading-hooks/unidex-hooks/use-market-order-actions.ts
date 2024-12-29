import { useState } from 'react';
import { usePublicClient } from 'wagmi';
import { useToast } from '../../use-toast';
import { useSmartAccount } from '../../use-smart-account';
import { useBalances } from '../../use-balances';
import { encodeFunctionData } from 'viem';

const TRADING_CONTRACT = "0x5f19704F393F983d5932b4453C6C87E85D22095E";
const USDC_TOKEN = "0xaf88d065e77c8cc2239327c5edb3a432268e5831";
const TRADING_FEE_RATE = 0.001; // 0.1% fee, adjust this value based on actual fee rate

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

interface OrderResponse {
  calldata: string;
  vaultAddress: string;
  insufficientBalance: boolean;
  requiredGasFee: string;
  error?: string;
}

export function useMarketOrderActions() {
  const [placingOrders, setPlacingOrders] = useState<boolean>(false);
  const publicClient = usePublicClient();
  const { toast } = useToast();
  const { smartAccount, kernelClient } = useSmartAccount();
  const { balances } = useBalances("arbitrum");

  // Helper to calculate total required amount including fees
  const calculateTotalRequired = (margin: number, size: number) => {
    const tradingFee = size * TRADING_FEE_RATE;
    return margin + tradingFee;
  };

  // Helper to check if we need to do a deposit first
  const checkBalancesAndGetDepositAmount = (margin: number, size: number) => {
    if (!balances) return { needsDeposit: false, depositAmount: 0 };

    const totalRequired = calculateTotalRequired(margin, size);
    const marginBalance = parseFloat(balances.formattedMusdBalance);
    const onectBalance = parseFloat(balances.formattedUsdcBalance);

    // If margin balance is sufficient, no deposit needed
    if (marginBalance >= totalRequired) {
      return { needsDeposit: false, depositAmount: 0 };
    }

    // Calculate how much more margin we need
    const neededAmount = totalRequired - marginBalance;

    // Check if 1CT balance can cover the needed amount
    if (onectBalance >= neededAmount) {
      return { needsDeposit: true, depositAmount: neededAmount };
    }

    // If combined balances can't cover margin + fees, return false
    return { needsDeposit: false, depositAmount: 0 };
  };

  const placeOrder = async (
    pair: number,
    isLong: boolean,
    price: number,
    slippagePercent: number,
    margin: number,
    size: number,
    orderType: "market" | "limit",
    takeProfit?: string,
    stopLoss?: string,
    referrer: string = "0x0000000000000000000000000000000000000000",
    nonceKey?: bigint
  ) => {
    if (!kernelClient || !smartAccount?.address || !publicClient) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    try {
      setPlacingOrders(true);

      // Check if we need to deposit first
      const { needsDeposit, depositAmount } = checkBalancesAndGetDepositAmount(margin, size);

      toast({
        title: "Placing Order",
        description: needsDeposit 
          ? "Preparing deposit and order transactions..." 
          : "Preparing transaction...",
      });

      // For market orders, calculate maxAcceptablePrice with slippage
      // For limit orders, use the exact limit price
      const maxAcceptablePrice = orderType === "market"
        ? Number((price * (isLong ? 1.05 : 0.95)).toFixed(6))
        : Number(price.toFixed(6));

      // Get order calldata
      const orderResponse = await fetch('https://unidexv4-api-production.up.railway.app/api/newposition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pair,
          isLong,
          orderType,
          maxAcceptablePrice,
          slippagePercent,
          margin,
          size,
          userAddress: smartAccount.address,
          skipBalanceCheck: true, // Add skipBalanceCheck flag
          referrer,  // Add referrer here
          ...(orderType === "limit" && { limitPrice: price }),
          ...(takeProfit && {
            takeProfit: parseFloat(takeProfit),
            takeProfitClosePercent: 100
          }),
          ...(stopLoss && {
            stopLoss: parseFloat(stopLoss),
            stopLossClosePercent: 100
          }),
        }),
      });

      if (!orderResponse.ok) {
        throw new Error(`Failed to place ${orderType} order`);
      }

      const orderData: OrderResponse = await orderResponse.json();

      const totalRequired = calculateTotalRequired(margin, size);
      const marginBalance = parseFloat(balances?.formattedMusdBalance || "0");
      const onectBalance = parseFloat(balances?.formattedUsdcBalance || "0");

      if (totalRequired > (marginBalance + onectBalance)) {
        toast({
          title: "Error",
          description: "Insufficient balance to cover margin and fees",
          variant: "destructive",
        });
        return;
      }

      // If we need to deposit first
      if (needsDeposit) {
        // Get deposit calldata
        const depositResponse = await fetch(
          "https://unidexv4-api-production.up.railway.app/api/wallet",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "deposit",
              tokenAddress: USDC_TOKEN,
              amount: depositAmount.toString(),
              userAddress: smartAccount.address,
            }),
          }
        );

        if (!depositResponse.ok) {
          throw new Error("Failed to prepare deposit transaction");
        }

        const depositData = await depositResponse.json();

        // First approve USDC spending
        const approveCalldata = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "approve",
          args: [TRADING_CONTRACT, BigInt(Math.floor(depositAmount * 1e6))],
        });

        // Send batch transaction
        toast({
          title: "Confirm Transaction",
          description: "Please confirm the batched deposit and order transaction",
        });

        await kernelClient.sendTransactions({
          transactions: [
            {
              to: USDC_TOKEN,
              data: approveCalldata,
            },
            {
              to: depositData.vaultAddress,
              data: depositData.calldata,
            },
            {
              to: orderData.vaultAddress,
              data: orderData.calldata,
            },
          ],
        });

      } else {
        // Just place the order
        toast({
          title: "Confirm Transaction",
          description: "Please confirm the transaction in your wallet",
        });

        await kernelClient.sendTransaction({
          to: orderData.vaultAddress,
          data: orderData.calldata,
        });
      }

      toast({
        title: "Success",
        description: `${orderType.charAt(0).toUpperCase() + orderType.slice(1)} order placed successfully`,
      });

    } catch (err) {
      console.error(`Error placing ${orderType} order:`, err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : `Failed to place ${orderType} order`,
        variant: "destructive",
      });
    } finally {
      setPlacingOrders(false);
    }
  };

  const placeMarketOrder = (
    pair: number,
    isLong: boolean,
    currentPrice: number,
    slippagePercent: number,
    margin: number,
    size: number,
    takeProfit?: string,
    stopLoss?: string,
    referrer?: string,
    nonceKey?: bigint
  ) => {
    return placeOrder(pair, isLong, currentPrice, slippagePercent, margin, size, "market", takeProfit, stopLoss, referrer, nonceKey);
  };

  const placeLimitOrder = (
    pair: number,
    isLong: boolean,
    limitPrice: number,
    slippagePercent: number,
    margin: number,
    size: number,
    takeProfit?: string,
    stopLoss?: string,
    referrer?: string
  ) => {
    return placeOrder(pair, isLong, limitPrice, slippagePercent, margin, size, "limit", takeProfit, stopLoss, referrer);
  };

  const prepare = async (
    pair: number,
    isLong: boolean,
    price: number,
    slippagePercent: number,
    margin: number,
    size: number,
    takeProfit?: string,
    stopLoss?: string,
    referrer?: string,
  ) => {
    if (!smartAccount?.address) {
      throw new Error("Wallet not connected");
    }

    const maxAcceptablePrice = Number((price * (isLong ? 1.05 : 0.95)).toFixed(6));

    const orderResponse = await fetch('https://unidexv4-api-production.up.railway.app/api/newposition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pair,
        isLong,
        orderType: "market",
        maxAcceptablePrice,
        slippagePercent,
        margin,
        size,
        userAddress: smartAccount.address,
        skipBalanceCheck: true,
        referrer: referrer || "0x0000000000000000000000000000000000000000",
        ...(takeProfit && {
          takeProfit: parseFloat(takeProfit),
          takeProfitClosePercent: 100
        }),
        ...(stopLoss && {
          stopLoss: parseFloat(stopLoss),
          stopLossClosePercent: 100
        }),
      }),
    });

    if (!orderResponse.ok) {
      throw new Error('Failed to prepare order');
    }

    const orderData = await orderResponse.json();

    // Check if we need deposit
    const { needsDeposit, depositAmount } = checkBalancesAndGetDepositAmount(margin, size);

    if (needsDeposit) {
      const depositResponse = await fetch(
        "https://unidexv4-api-production.up.railway.app/api/wallet",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "deposit",
            tokenAddress: USDC_TOKEN,
            amount: depositAmount.toString(),
            smartAccountAddress: smartAccount.address,
          }),
        }
      );

      if (!depositResponse.ok) {
        throw new Error("Failed to prepare deposit");
      }

      const depositData = await depositResponse.json();
      const approveCalldata = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "approve",
        args: [TRADING_CONTRACT, BigInt(Math.floor(depositAmount * 1e6))],
      });

      return {
        calls: [
          {
            to: USDC_TOKEN,
            data: approveCalldata,
            value: 0n
          },
          {
            to: depositData.vaultAddress,
            data: depositData.calldata,
            value: 0n
          },
          {
            to: orderData.vaultAddress,
            data: orderData.calldata,
            value: 0n
          }
        ]
      };
    }

    return {
      calls: [{
        to: orderData.vaultAddress,
        data: orderData.calldata,
        value: 0n
      }]
    };
  };

  return {
    placeMarketOrder,
    placeLimitOrder,
    prepare,
    placingOrders,
    checkBalancesAndGetDepositAmount
  };
}
