// hooks/use-gtrade-order-actions.ts
import { useState } from 'react';
import { parseUnits } from 'viem';
import { useGTradeSdk } from './use-gtrade-sdk';
import { useSmartAccount } from '../../use-smart-account';
import { useToast } from '../../use-toast';
import { encodeFunctionData } from 'viem';
import { usePublicClient } from 'wagmi';
import { GTRADE_PAIR_MAPPING } from './use-gtrade-pairs';
import { TRADING_PAIRS } from '../../use-market-data';

const GTRADE_CONTRACT = "0xFF162c694eAA571f685030649814282eA457f169";
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
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export function useGTradeOrderActions() {
  const [placingOrders, setPlacingOrders] = useState<boolean>(false);
  const tradingSdk = useGTradeSdk();
  const { toast } = useToast();
  const { smartAccount, kernelClient } = useSmartAccount();
  const publicClient = usePublicClient();

  const prepare = async (
    unidexPair: number,
    isLong: boolean,
    price: number,
    slippagePercent: number,
    margin: number,
    size: number,
    orderType: "market" | "limit",
    takeProfit?: string,
    stopLoss?: string,
  ) => {
    if (!tradingSdk || !smartAccount?.address || !publicClient) {
      throw new Error("SDK not initialized");
    }

    const marginInWei = parseUnits(margin.toString(), 6);
    const unidexPairName = TRADING_PAIRS[unidexPair.toString()];
    const gTradePairIndex = GTRADE_PAIR_MAPPING[unidexPairName];

    const args = {
      user: smartAccount.address,
      pairIndex: gTradePairIndex,
      collateralAmount: marginInWei,
      openPrice: price,
      long: isLong,
      leverage: size / margin,
      tp: takeProfit ? parseFloat(takeProfit) : 0,
      sl: stopLoss ? parseFloat(stopLoss) : 0,
      collateralIndex: 3,
      tradeType: orderType === "market" ? 0 : 1,
      maxSlippage: 1 + (slippagePercent / 100),
    };

    const tx = await tradingSdk.build.openTrade(args);
    
    // Check if we need approval
    const currentAllowance = await publicClient.readContract({
      address: USDC_TOKEN,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [smartAccount.address, GTRADE_CONTRACT],
    });

    if (currentAllowance < marginInWei) {
      const approveCalldata = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [GTRADE_CONTRACT, marginInWei],
      });

      return {
        calls: [
          {
            to: USDC_TOKEN,
            data: approveCalldata,
            value: 0n
          },
          {
            to: tx.to,
            data: tx.data,
            value: 0n
          }
        ]
      };
    }

    return {
      calls: [{
        to: tx.to,
        data: tx.data,
        value: 0n
      }]
    };
  };

  const placeOrder = async (
    unidexPair: number,
    isLong: boolean,
    price: number,
    slippagePercent: number,
    margin: number,
    size: number,
    orderType: "market" | "limit",
    takeProfit?: string,
    stopLoss?: string,
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
      // Convert UnidexV4 pair to gTrade pair
      const unidexPairName = TRADING_PAIRS[unidexPair.toString()];
      const gTradePairIndex = GTRADE_PAIR_MAPPING[unidexPairName];
      
      if (gTradePairIndex === undefined) {
        throw new Error(`Pair ${unidexPairName} not supported on gTrade`);
      }
      setPlacingOrders(true);
      if (tradingSdk) {
        await tradingSdk.initialize();
      }

      const marginInWei = parseUnits(margin.toString(), 6);

      // Check current allowance
      const currentAllowance = await publicClient.readContract({
        address: USDC_TOKEN,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [smartAccount.address, GTRADE_CONTRACT],
      });

      const args = {
        user: smartAccount.address,
        pairIndex: gTradePairIndex, // Using mapped pair index
        collateralAmount: parseUnits(margin.toString(), 6), // USDC decimals
        openPrice: price,
        long: isLong,
        leverage: size / margin, // Calculate leverage
        tp: takeProfit ? parseFloat(takeProfit) : 0,
        sl: stopLoss ? parseFloat(stopLoss) : 0,
        collateralIndex: 3, // USDC
        tradeType: orderType === "market" ? 0 : 1,
        maxSlippage: 1 + (slippagePercent / 100),
      };
      // Build trade transaction
      const tx = await tradingSdk?.build.openTrade(args);

      // Get nonce once and increment for second transaction
      const baseNonce = nonceKey 
        ? await kernelClient.account.getNonce({ key: nonceKey })
        : await kernelClient.account.getNonce();

      // If allowance is insufficient, bundle approve + trade
      if (currentAllowance < marginInWei) {
        const approveCalldata = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [GTRADE_CONTRACT, marginInWei],
        });

        await kernelClient.sendTransactions({
          transactions: [
            {
              to: USDC_TOKEN,
              data: approveCalldata,
            },
            {
              to: tx?.to as `0x${string}`,
              data: tx?.data as `0x${string}`,
            },
          ],
          nonce: baseNonce,
        });
      } else {
        // Just send the trade transaction
        if (tx) {
          await kernelClient.sendTransaction({
            to: tx.to as `0x${string}`, 
            data: tx.data as `0x${string}`,
            nonce: baseNonce,
          });
        }
      }

      toast({
        title: "Success",
        description: `${orderType.charAt(0).toUpperCase() + orderType.slice(1)} order placed successfully on gTrade`,
      });

    } catch (err) {
      console.error(`Error placing ${orderType} order on gTrade:`, err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : `Failed to place ${orderType} order`,
        variant: "destructive",
      });
    } finally {
      setPlacingOrders(false);
    }
  };

  return {
    placeGTradeOrder: placeOrder,
    prepare,
    placingOrders,
  };
}