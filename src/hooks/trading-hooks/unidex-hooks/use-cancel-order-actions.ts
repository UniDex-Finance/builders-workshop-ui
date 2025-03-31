import { useState } from 'react';
import { useSmartAccount } from '../../use-smart-account';
import { useToast } from '@/components/ui/use-toast';
import type { ToastProps } from '@/components/ui/use-toast';
import type { Order, TriggerOrder, DetailedTriggerInfo } from '../../use-orders';
import { encodeFunctionData } from 'viem';
import { orderVaultAbi } from '@/lib/abi/orderVault';

interface CancelOrderResponse {
  calldata: string;
  vaultAddress: string;
}

const ORDER_VAULT_ADDRESS = '0xDCBA99d435E31A1AAb08b0271a60AEf9A845B379' as `0x${string}`;

export function useCancelOrderActions() {
  const [cancellingOrders, setCancellingOrders] = useState<{ [key: string]: boolean }>({});
  const { smartAccount, kernelClient } = useSmartAccount();
  const { toast } = useToast();

  const formatOrderDetails = (order: Order | TriggerOrder) => {
    if ('type' in order) {
      // Regular Order
      return `${order.isLong ? '+' : '-'}$${order.size} ${order.market} ${order.type}${
        order.limitPrice !== "0.00" ? ` @ $${order.limitPrice}` : ''
      }${order.stopPrice !== "0.00" ? ` (Stop: $${order.stopPrice})` : ''}`;
    } else {
      // Trigger Order
      const details = [];
      if (order.stopLoss) {
        details.push(`SL: $${order.stopLoss.price} (${order.stopLoss.size}%)`);
      }
      if (order.takeProfit) {
        details.push(`TP: $${order.takeProfit.price} (${order.takeProfit.size}%)`);
      }
      return `${order.market} Trigger [${details.join(', ')}]`;
    }
  };

  // Cancel regular pending orders via API
  const cancelPendingOrder = async (positionId: string, order: Order) => {
    if (!kernelClient || !smartAccount?.address) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    try {
      setCancellingOrders(prev => ({ ...prev, [positionId]: true }));

      const orderDetails = formatOrderDetails(order);

      // Initial toast for request submission
      toast({
        title: `Broadcasting Cancel`,
        description: `Cancelling ${orderDetails}`,
        variant: "default",
      });

      const response = await fetch('https://unidexv4-api-production.up.railway.app/api/position/cancel-pending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          positionId,
          userAddress: smartAccount.address,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get cancel order data');
      }

      const data: CancelOrderResponse = await response.json();

      await kernelClient.sendTransaction({
        to: data.vaultAddress,
        data: data.calldata,
      });

      // Dismiss previous toast and show success
      toast({
        title: "Order Cancelled",
        description: orderDetails,
        variant: "default",
      });

    } catch (err) {
      console.error('Error cancelling order:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to cancel order",
        variant: "destructive",
      });
    } finally {
      setCancellingOrders(prev => ({ ...prev, [positionId]: false }));
    }
  };

  // Cancel trigger order directly via contract
  const cancelTriggerOrder = async (positionId: string, orderId: number, description: string) => {
    if (!kernelClient || !smartAccount?.address) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    const uniqueId = `${positionId}-${orderId}`;
    
    try {
      setCancellingOrders(prev => ({ ...prev, [uniqueId]: true }));

      toast({
        title: `Broadcasting Cancel`,
        description: `Cancelling ${description}`,
        variant: "default",
      });

      // Generate the calldata directly
      const calldata = encodeFunctionData({
        abi: orderVaultAbi,
        functionName: 'cancelTriggerOrder',
        args: [BigInt(positionId), BigInt(orderId)],
      });

      // Send transaction directly through kernelClient
      await kernelClient.sendTransaction({
        to: ORDER_VAULT_ADDRESS,
        data: calldata,
      });

      toast({
        title: "Trigger Cancelled",
        description: description,
        variant: "default",
      });

    } catch (err) {
      console.error('Error cancelling trigger order:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to cancel trigger order",
        variant: "destructive",
      });
    } finally {
      setCancellingOrders(prev => ({ ...prev, [uniqueId]: false }));
    }
  };

  // Cancel all triggers for a position directly via contract
  const cancelAllTriggers = async (positionId: string, description: string) => {
    if (!kernelClient || !smartAccount?.address) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    try {
      setCancellingOrders(prev => ({ ...prev, [positionId]: true }));

      toast({
        title: `Broadcasting Cancel`,
        description: `Cancelling all triggers for ${description}`,
        variant: "default",
      });

      // Generate the calldata directly
      const calldata = encodeFunctionData({
        abi: orderVaultAbi,
        functionName: 'cancelAllTriggerOrders',
        args: [BigInt(positionId)],
      });

      // Send transaction directly through kernelClient
      await kernelClient.sendTransaction({
        to: ORDER_VAULT_ADDRESS,
        data: calldata,
      });

      toast({
        title: "All Triggers Cancelled",
        description: description,
        variant: "default",
      });

    } catch (err) {
      console.error('Error cancelling all triggers:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to cancel all triggers",
        variant: "destructive",
      });
    } finally {
      setCancellingOrders(prev => ({ ...prev, [positionId]: false }));
    }
  };

  // Legacy function to maintain compatibility
  const cancelOrder = async (positionId: string, order: Order | TriggerOrder) => {
    if ('type' in order) {
      // Regular order
      await cancelPendingOrder(positionId, order);
    } else {
      // Trigger order - cancel all triggers
      const description = formatOrderDetails(order);
      await cancelAllTriggers(positionId, description);
    }
  };

  return {
    cancelOrder,
    cancelPendingOrder,
    cancelTriggerOrder,
    cancelAllTriggers,
    cancellingOrders,
  };
}
