# Toast Implementation Guide

This document outlines how to implement informative toast notifications for trading actions in the Builders Workshop UI.

## Components Used

1. **Toast System**
   - Located in `@/components/ui/use-toast`
   - Has a TOAST_LIMIT of 1 (automatically replaces previous toasts)
   - Provides `toast()` function with variants: 'default' and 'destructive'

2. **Hook Structure**
   ```typescript
   import { useToast } from '@/components/ui/use-toast';
   import type { ToastProps } from '@/components/ui/use-toast';

   export function useActionHook() {
     const { toast } = useToast();
     // ... hook implementation
   }
   ```

## Implementation Pattern

### 1. State Management
```typescript
const [processingState, setProcessingState] = useState<{ [key: string]: boolean }>({});
```
- Tracks processing state for UI feedback (e.g., disabling buttons)
- Key is usually an ID (orderId, positionId)
- Value is boolean indicating processing status

### 2. Order Details Formatting
```typescript
const formatOrderDetails = (order: Order | TriggerOrder) => {
  // Format order details into readable string
  return `${order.isLong ? '+' : '-'}$${order.size} ${order.market}...`;
};
```
- Helper function to format order details for toast messages
- Makes messages consistent and informative

### 3. Action Flow with Toasts
```typescript
const performAction = async (id: string, order: Order) => {
  try {
    // 1. Set processing state
    setProcessingState(prev => ({ ...prev, [id]: true }));

    // 2. Initial broadcast toast
    toast({
      title: "Broadcasting Action",
      description: `Details: ${formatOrderDetails(order)}`,
      variant: "default"
    });

    // 3. Perform action
    await performApiCall();
    await kernelClient.sendTransaction(/* ... */);

    // 4. Success toast
    toast({
      title: "Action Complete",
      description: formatOrderDetails(order),
      variant: "default"
    });

  } catch (err) {
    // 5. Error toast
    toast({
      title: "Error",
      description: err instanceof Error ? err.message : "Action failed",
      variant: "destructive"
    });
  } finally {
    // 6. Reset processing state
    setProcessingState(prev => ({ ...prev, [id]: false }));
  }
};
```

## Toast Message Structure

### Broadcasting State
```typescript
toast({
  title: "Broadcasting Action",
  description: `Action details...`,
  variant: "default"
});
```

### Success State
```typescript
toast({
  title: "Action Complete",
  description: `Action details...`,
  variant: "default"
});
```

### Error State
```typescript
toast({
  title: "Error",
  description: `Error message...`,
  variant: "destructive"
});
```

## Example Implementation (Cancel Order)

```typescript
// In use-cancel-order-actions.ts
const cancelOrder = async (positionId: string, order: Order | TriggerOrder) => {
  if (!kernelClient || !smartAccount?.address) {
    toast({
      title: "Error",
      description: "Please connect your wallet first",
      variant: "destructive"
    });
    return;
  }

  try {
    setCancellingOrders(prev => ({ ...prev, [positionId]: true }));
    const orderDetails = formatOrderDetails(order);

    toast({
      title: "Broadcasting Cancel",
      description: `Cancelling ${orderDetails}`,
      variant: "default"
    });

    // API call and transaction
    const response = await fetch('api/position/cancel-pending', ...);
    await kernelClient.sendTransaction(...);

    toast({
      title: "Order Cancelled",
      description: orderDetails,
      variant: "default"
    });

  } catch (err) {
    toast({
      title: "Error",
      description: err instanceof Error ? err.message : "Failed to cancel order",
      variant: "destructive"
    });
  } finally {
    setCancellingOrders(prev => ({ ...prev, [positionId]: false }));
  }
};
```

## Key Points

1. **Toast Limit**
   - System only shows one toast at a time
   - New toasts replace existing ones
   - No need to manually dismiss previous toasts

2. **State Management**
   - Keep track of processing state for UI feedback
   - Reset state in finally block to ensure cleanup

3. **Error Handling**
   - Always use try/catch
   - Show descriptive error messages
   - Use destructive variant for errors

4. **Message Format**
   - Keep messages concise but informative
   - Include relevant details (size, price, market)
   - Use consistent formatting

5. **UI Integration**
   - Disable buttons during processing
   - Show loading state when needed
   - Clear feedback when action completes

This pattern can be applied to other trading actions like placing orders, modifying positions, etc., by adapting the message format and action flow to the specific use case.