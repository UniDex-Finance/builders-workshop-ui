import { useState } from 'react';
import { usePublicClient } from 'wagmi';
import { useToast } from './use-toast';
import { useSmartAccount } from './use-smart-account';
import { useGTradeSdk } from './use-gtrade-sdk';
import { encodeFunctionData, parseUnits } from 'viem';
import { useMarketData } from './use-market-data';

interface ClosePositionResponse {
  calldata: string;
  vaultAddress: string;
  requiredGasFee: string;
}

interface AddTPSLResponse {
  calldata: string;
  vaultAddress: string;
  requiredGasFee: string;
}

interface ModifyCollateralResponse {
  calldata: string;
  vaultAddress: string;
  requiredGasFee: string;
}

const GTRADE_CONTRACT = "0xFF162c694eAA571f685030649814282eA457f169";
const GNS_CONTRACT = "0x7A5218439eA0Dd533C506194B25BF0Da8B889C39";

const GTRADE_ABI = [
  {
    inputs: [
      { name: "_index", type: "uint32" },
      { name: "_expectedPrice", type: "uint64" }
    ],
    name: "closeTradeMarket",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const GNS_ABI = [
  {
    inputs: [
      { name: "pairIndex", type: "uint256" },
      { name: "index", type: "uint256" }
    ],
    name: "closePosition",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

export function usePositionActions() {
  const [closingPositions, setClosingPositions] = useState<{ [key: number]: boolean }>({});
  const [settingTPSL, setSettingTPSL] = useState<{ [key: number]: boolean }>({});
  const [modifyingCollateral, setModifyingCollateral] = useState<{ [key: number]: boolean }>({});
  const publicClient = usePublicClient();
  const { toast } = useToast();
  const { smartAccount, kernelClient } = useSmartAccount();
  const tradingSdk = useGTradeSdk();
  const { marketData, allMarkets } = useMarketData();

  const closePosition = async (
    positionId: string | number,
    isLong: boolean,
    currentPrice: number,
    size: number
  ) => {
    if (!kernelClient || !smartAccount?.address) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    try {
      setClosingPositions(prev => ({ ...prev, [positionId]: true }));

      if (typeof positionId === 'string') {
        if (positionId.startsWith('g-')) {
          const index = parseInt(positionId.split('-')[1]);
          const slippagePrice = BigInt(Math.floor(currentPrice * 1e8));

          const calldata = encodeFunctionData({
            abi: GTRADE_ABI,
            functionName: 'closeTradeMarket',
            args: [index, slippagePrice],
          });
          console.log('calldata', calldata);
          console.log('args', index, slippagePrice);

          await kernelClient.sendTransaction({
            to: GTRADE_CONTRACT,
            data: calldata,
          });
          
          return;
        }
        
        if (positionId.startsWith('gns-')) {
          const [_, pairIndex, index] = positionId.split('-');
          
          const calldata = encodeFunctionData({
            abi: GNS_ABI,
            functionName: 'closePosition',
            args: [BigInt(pairIndex), BigInt(index)],
          });

          await kernelClient.sendTransaction({
            to: GNS_CONTRACT,
            data: calldata,
          });
          
          return;
        }

        positionId = parseInt(positionId);
      }

      const allowedPrice = isLong ? currentPrice * 0.95 : currentPrice * 1.05;
      const response = await fetch('https://unidexv4-api-production.up.railway.app/api/closeposition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionId,
          sizeDelta: size,
          allowedPrice,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get close position data');
      }

      const data: ClosePositionResponse = await response.json();
      await kernelClient.sendTransaction({
        to: data.vaultAddress,
        data: data.calldata,
      });

    } catch (err) {
      console.error('Error closing position:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to close position",
        variant: "destructive",
      });
    } finally {
      setClosingPositions(prev => ({ ...prev, [positionId]: false }));
    }
  };

  const addTPSL = async (
    positionId: number,
    takeProfit: number | null,
    stopLoss: number | null,
    takeProfitClosePercent: number,
    stopLossClosePercent: number
  ) => {
    if (!kernelClient || !smartAccount?.address || !publicClient) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!takeProfit && !stopLoss) {
      toast({
        title: "Error",
        description: "Please set either Take Profit or Stop Loss",
        variant: "destructive",
      });
      return;
    }

    try {
      setSettingTPSL(prev => ({ ...prev, [positionId]: true }));

      toast({
        title: "Setting TP/SL",
        description: "Preparing transaction...",
      });

      const response = await fetch('https://unidexv4-api-production.up.railway.app/api/position/add-tpsl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          positionId,
          takeProfit,
          stopLoss,
          takeProfitClosePercent,
          stopLossClosePercent,
          userAddress: smartAccount.address
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get TP/SL data');
      }

      const data: AddTPSLResponse = await response.json();

      toast({
        title: "Confirm Transaction",
        description: "Please confirm the transaction in your wallet",
      });

      await kernelClient.sendTransaction({
        to: data.vaultAddress,
        data: data.calldata,
      });

      toast({
        title: "Success",
        description: "TP/SL set successfully",
      });

    } catch (err) {
      console.error('Error setting TP/SL:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to set TP/SL",
        variant: "destructive",
      });
    } finally {
      setSettingTPSL(prev => ({ ...prev, [positionId]: false }));
    }
  };

  const modifyCollateral = async (
    positionId: number,
    amount: number,
    isAdd: boolean
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
      setModifyingCollateral(prev => ({ ...prev, [positionId]: true }));

      toast({
        title: `${isAdd ? 'Adding' : 'Removing'} Collateral`,
        description: "Preparing transaction...",
      });

      const response = await fetch('https://unidexv4-api-production.up.railway.app/api/position/modify-collateral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          positionId,
          amount,
          isAdd,
          userAddress: smartAccount.address
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to modify collateral');
      }

      const data: ModifyCollateralResponse = await response.json();

      toast({
        title: "Confirm Transaction",
        description: "Please confirm the transaction in your wallet",
      });

      await kernelClient.sendTransaction({
        to: data.vaultAddress,
        data: data.calldata,
      });

      toast({
        title: "Success",
        description: `Successfully ${isAdd ? 'added' : 'removed'} collateral`,
      });

    } catch (err) {
      console.error('Error modifying collateral:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to modify collateral",
        variant: "destructive",
      });
    } finally {
      setModifyingCollateral(prev => ({ ...prev, [positionId]: false }));
    }
  };

  return {
    closePosition,
    closingPositions,
    addTPSL,
    settingTPSL,
    modifyCollateral,
    modifyingCollateral
  };
}
