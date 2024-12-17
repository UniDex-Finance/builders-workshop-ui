import { useState } from 'react';
import { useSmartAccount } from '../../use-smart-account';
import { useToast } from '@/components/ui/use-toast';
import type { ToastProps } from '@/components/ui/use-toast';
import type { Order, TriggerOrder } from '../../use-orders';

interface CancelOrderResponse {
  calldata: string;
  vaultAddress: string;
}

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

  const cancelOrder = async (positionId: string, order: Order | TriggerOrder) => {
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

  return {
    cancelOrder,
    cancellingOrders,
  };
}
