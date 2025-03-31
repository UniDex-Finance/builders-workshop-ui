import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../ui/table";
import { Order, TriggerOrder, DetailedTriggerInfo } from "../../../../hooks/use-orders";
import { X } from "lucide-react";
import { Button } from "../../../ui/button";
import { useCancelOrderActions } from "../../../../hooks/trading-hooks/unidex-hooks/use-cancel-order-actions";
import { usePairPrecision } from "../../../../hooks/use-pair-precision";

interface OrdersContentProps {
  orders: Order[];
  triggerOrders: TriggerOrder[] | undefined;
  detailedTriggers: DetailedTriggerInfo[] | undefined;
  loading: boolean;
  loadingTriggers: boolean;
  error: Error | null;
}

// Trigger status enum definition
enum TriggerStatus {
  NONE = 0,
  PENDING = 1,
  OPEN = 2,
  TRIGGERED = 3,
  CANCELLED = 4
}

export function OrdersContent({
  orders,
  triggerOrders,
  detailedTriggers,
  loading,
  loadingTriggers,
  error,
}: OrdersContentProps) {
  const { cancelOrder, cancelTriggerOrder, cancellingOrders } = useCancelOrderActions();
  const { formatPairPrice } = usePairPrecision();

  const isLoading = loading || loadingTriggers;

  // Filter detailed triggers to only show those with status === OPEN (2)
  const openDetailedTriggers = detailedTriggers?.map(position => ({
    ...position,
    triggers: position.triggers.filter(trigger => trigger.status === TriggerStatus.OPEN)
  })).filter(position => position.triggers.length > 0);

  // Only use fallback if detailedTriggers is undefined, not when it's empty
  const useDetailedTriggers = !!detailedTriggers;
  
  const hasOpenOrders = 
    orders.length > 0 ||
    (useDetailedTriggers && openDetailedTriggers && openDetailedTriggers.length > 0) ||
    (!useDetailedTriggers && triggerOrders && triggerOrders.length > 0);

  return (
    <>
      <TableHeader>
        <TableRow>
          <TableHead>Market</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Margin</TableHead>
          <TableHead>Limit Price</TableHead>
          <TableHead>Stop Price</TableHead>
          <TableHead>Stop Loss</TableHead>
          <TableHead>Take Profit</TableHead>
          <TableHead>Created</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center">
              Loading orders...
            </TableCell>
          </TableRow>
        ) : error ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center text-short">
              {error.message}
            </TableCell>
          </TableRow>
        ) : !hasOpenOrders ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center">
              No open orders
            </TableCell>
          </TableRow>
        ) : (
          <>
            {/* Regular Orders */}
            {orders.map((order) => (
              <TableRow key={order.orderId}>
                <TableCell>{order.market}</TableCell>
                <TableCell>{order.type}</TableCell>
                <TableCell
                  className={order.isLong ? "text-long" : "text-short"}
                >
                  {order.isLong ? "+" : "-"}
                  {order.size}
                </TableCell>
                <TableCell>{order.margin}</TableCell>
                <TableCell>
                  {order.limitPrice !== "0.00" ? order.limitPrice : "-"}
                </TableCell>
                <TableCell>
                  {order.stopPrice !== "0.00" ? order.stopPrice : "-"}
                </TableCell>
                <TableCell className="text-short">-</TableCell>
                <TableCell className="text-long">-</TableCell>
                <TableCell>{order.timestamp}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={cancellingOrders[order.orderId]}
                    onClick={() => cancelOrder(order.orderId, order)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {/* Detailed Trigger Orders */}
            {openDetailedTriggers?.flatMap((position) => 
              position.triggers.map((trigger) => (
                <TableRow key={`detailed-trigger-${position.positionId}-${trigger.orderId}`}>
                  <TableCell>{position.market}</TableCell>
                  <TableCell>{trigger.isTP ? "Take Profit" : "Stop Loss"}</TableCell>
                  <TableCell className={position.isLong ? "text-long" : "text-short"}>
                    {trigger.amountPercent}%
                  </TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell className="text-short">
                    {!trigger.isTP ? formatPairPrice(position.market, trigger.price) : "-"}
                  </TableCell>
                  <TableCell className="text-long">
                    {trigger.isTP ? formatPairPrice(position.market, trigger.price) : "-"}
                  </TableCell>
                  <TableCell>{trigger.createdAt}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={cancellingOrders[`${position.positionId}-${trigger.orderId}`]}
                      onClick={() => 
                        cancelTriggerOrder(
                          position.positionId, 
                          trigger.orderId, 
                          `${trigger.isTP ? "Take Profit" : "Stop Loss"} at ${formatPairPrice(position.market, trigger.price)} (${trigger.amountPercent}%)`
                        )
                      }
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}

            {/* Fallback to old trigger orders ONLY if detailed ones are not available (undefined) */}
            {!useDetailedTriggers && triggerOrders?.map((order) => (
              <TableRow key={`trigger-${order.positionId}`}>
                <TableCell>{order.market}</TableCell>
                <TableCell>Trigger</TableCell>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
                <TableCell className="text-short">
                  {order.stopLoss
                    ? `${formatPairPrice(order.market, parseFloat(order.stopLoss.price))} (${order.stopLoss.size}%)`
                    : "-"}
                </TableCell>
                <TableCell className="text-long">
                  {order.takeProfit
                    ? `${formatPairPrice(order.market, parseFloat(order.takeProfit.price))} (${order.takeProfit.size}%)`
                    : "-"}
                </TableCell>
                <TableCell>{order.timestamp}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={cancellingOrders[order.positionId]}
                    onClick={() => cancelOrder(order.positionId, order)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </>
        )}
      </TableBody>
    </>
  );
}
