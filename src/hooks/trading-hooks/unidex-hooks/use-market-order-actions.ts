import { useState } from 'react';
import { usePublicClient } from 'wagmi';
import { useToast } from '../../use-toast';
import { useSmartAccount } from '../../use-smart-account';
import { useBalances } from '../../use-balances';
import { encodeFunctionData } from 'viem';
import { getLatestGasPrice } from './use-get-gasprice';

const TRADING_CONTRACT = "0x5f19704F393F983d5932b4453C6C87E85D22095E";
const USDC_TOKEN = "0xaf88d065e77c8cc2239327c5edb3a432268e5831";
const TRADING_FEE_RATE = 0.001; // 0.1% fee, adjust this value based on actual fee rate
const GAS_FEE_RECIPIENT = "0x5870c519Ee1C93573bd8F451fB0715D44f6984A8";

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
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
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
    const gasCost = getLatestGasPrice();
    const gasFeeUsd = gasCost?.usd || 0;
    return margin + tradingFee + gasFeeUsd;
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

      // Get gas fee amount from store
      const gasCost = getLatestGasPrice();
      if (!gasCost) {
        throw new Error("Gas price not available");
      }

      const gasFeeAmount = Math.ceil(Number(gasCost.usd.toFixed(4)) * 1e6);
      const onectBalance = parseFloat(balances?.formattedUsdcBalance || "0") * 1e6;

      // Check if we need to withdraw for gas
      const needsWithdrawForGas = gasFeeAmount > onectBalance && parseFloat(balances?.formattedMusdBalance || "0") > 0;

      if (needsWithdrawForGas) {
        // Get withdraw calldata
        const withdrawResponse = await fetch(
          "https://unidexv4-api-production.up.railway.app/api/wallet",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "withdraw",
              tokenAddress: USDC_TOKEN,
              amount: gasFeeAmount.toString(),
              userAddress: smartAccount.address,
            }),
          }
        );

        if (!withdrawResponse.ok) {
          throw new Error("Failed to prepare withdraw transaction");
        }

        const withdrawData = await withdrawResponse.json();

        // Prepare gas fee transfer calldata
        const transferCalldata = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [GAS_FEE_RECIPIENT, BigInt(gasFeeAmount)],
        });

        // Get order and deposit data
        const orderResponse = await fetch('https://unidexv4-api-production.up.railway.app/api/newposition', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pair,
            isLong,
            orderType: "market",
            maxAcceptablePrice: Number((price * (isLong ? 1.05 : 0.95)).toFixed(6)),
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

        let depositData;
        let approveCalldata;
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
                userAddress: smartAccount.address,
              }),
            }
          );

          if (!depositResponse.ok) {
            throw new Error("Failed to prepare deposit");
          }

          depositData = await depositResponse.json();
          approveCalldata = encodeFunctionData({
            abi: ERC20_ABI,
            functionName: "approve",
            args: [TRADING_CONTRACT, BigInt(Math.floor(depositAmount * 1e6))],
          });
        }

        // Now build transactions with all the prepared data
        const transactions = [
          {
            to: withdrawData.vaultAddress,
            data: withdrawData.calldata,
          }
        ];

        if (needsDeposit) {
          transactions.push(
            {
              to: USDC_TOKEN,
              data: approveCalldata,
            },
            {
              to: USDC_TOKEN,
              data: transferCalldata,
            },
            {
              to: depositData.vaultAddress,
              data: depositData.calldata,
            },
            {
              to: orderData.vaultAddress,
              data: orderData.calldata,
            }
          );
        } else {
          transactions.push(
            {
              to: USDC_TOKEN,
              data: transferCalldata,
            },
            {
              to: orderData.vaultAddress,
              data: orderData.calldata,
            }
          );
        }

        await kernelClient.sendTransactions({ transactions });
      } else {
        // Original transaction logic when no withdraw needed
        if (needsDeposit) {
          await kernelClient.sendTransactions({
            transactions: [
              // ... existing deposit transaction bundle ...
            ],
          });
        } else {
          await kernelClient.sendTransactions({
            transactions: [
              // ... existing non-deposit transaction bundle ...
            ],
          });
        }
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

    // Get gas fee amount from store
    const gasCost = getLatestGasPrice();
    if (!gasCost) {
      throw new Error("Gas price not available");
    }

    const gasFeeAmount = Math.ceil(Number(gasCost.usd.toFixed(4)) * 1e6);

    // Prepare gas fee transfer calldata
    const transferCalldata = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [GAS_FEE_RECIPIENT, BigInt(gasFeeAmount)],
    });

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
            userAddress: smartAccount.address,
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
            to: USDC_TOKEN,
            data: transferCalldata,
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
      calls: [
        {
          to: USDC_TOKEN,
          data: transferCalldata,
          value: 0n
        },
        {
          to: orderData.vaultAddress,
          data: orderData.calldata,
          value: 0n
        }
      ]
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
