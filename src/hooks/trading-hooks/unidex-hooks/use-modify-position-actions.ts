import { useState } from 'react';
import { usePublicClient } from 'wagmi';
import { useToast } from '../../use-toast';
import { useSmartAccount } from '../../use-smart-account';
import { useBalances } from '../../use-balances';
import { encodeFunctionData } from 'viem';
import { useMarketData } from '../../use-market-data';

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

interface IncreasePositionResponse {
  calldata: string;
  vaultAddress: string;
  insufficientBalance: boolean;
}

export function useModifyPositionActions() {
  const [increasingPositions, setIncreasingPositions] = useState<{ [key: number]: boolean }>({});
  const publicClient = usePublicClient();
  const { toast } = useToast();
  const { smartAccount, kernelClient } = useSmartAccount();
  const { balances } = useBalances("arbitrum");
  const { allMarkets } = useMarketData();

  // Helper to check if we need to do a deposit first
  const checkBalancesAndGetDepositAmount = (collateralDelta: number, sizeDelta: number, pair: string, isLong: boolean) => {
    if (!balances) return { needsDeposit: false, depositAmount: 0 };

    const marginBalance = parseFloat(balances.formattedMusdBalance);
    const onectBalance = parseFloat(balances.formattedUsdcBalance);

    // Get trading fee rate for this pair and side
    const market = allMarkets.find(m => m.pair === pair);
    const tradingFeeRate = market 
      ? (isLong ? market.longTradingFee / 100 : market.shortTradingFee / 100)
      : 0.001; // fallback to 0.1%

    // Calculate trading fee
    const tradingFee = sizeDelta * tradingFeeRate;
    
    // Total amount needed is collateral plus trading fee
    const totalRequired = collateralDelta + tradingFee;

    // Calculate how much more we need including trading fee
    const neededAmount = totalRequired - marginBalance;

    const result = {
      needsDeposit: marginBalance < totalRequired && onectBalance >= neededAmount,
      depositAmount: marginBalance < totalRequired ? neededAmount : 0
    };

    console.log('Balance Check Details:', {
      marginBalance,
      onectBalance,
      collateralDelta,
      sizeDelta,
      tradingFeeRate,
      tradingFee,
      totalRequired,
      neededAmount,
      ...result
    });

    return result;
  };

  const increasePosition = async (
    positionId: number,
    collateralDelta: number,
    sizeDelta: number,
    isLong: boolean,
    currentPrice: number,
    pair: string
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
      setIncreasingPositions(prev => ({ ...prev, [positionId]: true }));

      // Check if we need to deposit first
      const depositCheck = checkBalancesAndGetDepositAmount(
        collateralDelta,
        sizeDelta,
        pair,
        isLong
      );

      console.log('Deposit Check:', depositCheck);

      // Calculate max acceptable price with 1% slippage
      const maxAcceptablePrice = isLong 
        ? currentPrice * 1.01
        : currentPrice * 0.99;

      toast({
        title: "Modifying Position",
        description: depositCheck.needsDeposit 
          ? "Preparing deposit and position transactions..." 
          : "Preparing transaction...",
      });

      // Get position modification calldata
      const positionResponse = await fetch('https://unidexv4-api-production.up.railway.app/api/position/increase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          positionId,
          collateralDelta,
          sizeDelta,
          maxAcceptablePrice,
          userAddress: smartAccount.address,
          skipBalanceCheck: depositCheck.needsDeposit
        }),
      });

      console.log('API Request:', {
        positionId,
        collateralDelta,
        sizeDelta,
        maxAcceptablePrice,
        userAddress: smartAccount.address,
        skipBalanceCheck: depositCheck.needsDeposit
      });

      if (!positionResponse.ok) {
        throw new Error('Failed to get increase position data');
      }

      const positionData: IncreasePositionResponse = await positionResponse.json();

      if (depositCheck.needsDeposit) {
        // Get deposit calldata
        const depositResponse = await fetch(
          "https://unidexv4-api-production.up.railway.app/api/wallet",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "deposit",
              tokenAddress: USDC_TOKEN,
              amount: depositCheck.depositAmount.toString(),
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
          args: [TRADING_CONTRACT, BigInt(Math.floor(depositCheck.depositAmount * 1e6))],
        });

        toast({
          title: "Confirm Transaction",
          description: "Please confirm the batched deposit and position transaction",
        });

        // Send batch transaction
        await kernelClient.sendTransaction({
          calls: [
            {
              to: USDC_TOKEN,
              data: approveCalldata,
            },
            {
              to: depositData.vaultAddress,
              data: depositData.calldata,
            },
            {
              to: positionData.vaultAddress,
              data: positionData.calldata,
            },
          ],
        });
      } else {
        toast({
          title: "Confirm Transaction",
          description: "Please confirm the transaction in your wallet",
        });

        await kernelClient.sendTransaction({
          to: positionData.vaultAddress,
          data: positionData.calldata,
        });
      }

      toast({
        title: "Success",
        description: "Position modified successfully",
      });

    } catch (err) {
      console.error('Error modifying position:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to modify position",
        variant: "destructive",
      });
    } finally {
      setIncreasingPositions(prev => ({ ...prev, [positionId]: false }));
    }
  };

  return {
    increasePosition,
    increasingPositions,
    checkBalancesAndGetDepositAmount
  };
}
