import { useState } from 'react';
import { usePublicClient } from 'wagmi';
import { useToast } from '../../use-toast';
import { useSmartAccount } from '../../use-smart-account';

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

interface GTradeCloseResponse {
  success: boolean;
  transaction: {
    to: string;
    data: string;
    value: string;
  };
}

const GTRADE_API_URL = "https://unidexv4-api-production.up.railway.app/api/gtrade";

export function usePositionActions() {
  const [closingPositions, setClosingPositions] = useState<{ [key: number]: boolean }>({});
  const [settingTPSL, setSettingTPSL] = useState<{ [key: number]: boolean }>({});
  const [modifyingCollateral, setModifyingCollateral] = useState<{ [key: number]: boolean }>({});
  const publicClient = usePublicClient();
  const { toast } = useToast();
  const { smartAccount, kernelClient } = useSmartAccount();

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
        // Handle gTrade positions (both 'g-' and 'gns-' prefixes)
        if (positionId.startsWith('g-') || positionId.startsWith('gns-')) {
          let index: number;
          
          if (positionId.startsWith('g-')) {
            index = parseInt(positionId.split('-')[1]);
          } else {
            // For gns- format, we need the index from the last part
            const [_, __, indexStr] = positionId.split('-');
            index = parseInt(indexStr);
          }
          
          // Use gTrade API endpoint
          const response = await fetch(`${GTRADE_API_URL}/position/close`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              index,
              expectedPrice: currentPrice,
              userAddress: smartAccount.address,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to get close position data from gTrade API');
          }

          const data: GTradeCloseResponse = await response.json();
          
          if (!data.success) {
            throw new Error('Failed to generate close position transaction');
          }

          await kernelClient.sendTransaction({
            to: data.transaction.to,
            data: data.transaction.data,
            value: data.transaction.value,
          });
          
          return;
        }

        positionId = parseInt(positionId);
      }

      // Handle UniDEX positions
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
        title: "Modifying Collateral",
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
        throw new Error('Failed to get modify collateral data');
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
        description: "Collateral modified successfully",
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
    addTPSL,
    modifyCollateral,
    closingPositions,
    settingTPSL,
    modifyingCollateral,
  };
}
