import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../ui/table";
import { Order, TriggerOrder } from "../../../../hooks/use-orders";
import { X } from "lucide-react";
import { Button } from "../../../ui/button";
import { useCancelOrderActions } from "../../../../hooks/trading-hooks/unidex-hooks/use-cancel-order-actions";

interface OrdersContentProps {
  orders: Order[];
  triggerOrders: TriggerOrder[] | undefined;
  loading: boolean;
  error: Error | null;
}

export function OrdersContent({
  orders,
  triggerOrders,
  loading,
  error,
}: OrdersContentProps) {
  const { cancelOrder, cancellingOrders } = useCancelOrderActions();

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
        {loading ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center">
              Loading orders...
            </TableCell>
          </TableRow>
        ) : error ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center text-red-500">
              {error.message}
            </TableCell>
          </TableRow>
        ) : orders.length === 0 && (!triggerOrders || triggerOrders.length === 0) ? (
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
                  className={order.isLong ? "text-green-500" : "text-red-500"}
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
                <TableCell className="text-red-500">-</TableCell>
                <TableCell className="text-green-500">-</TableCell>
                <TableCell>{order.timestamp}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={cancellingOrders[order.orderId]}
                    onClick={() => cancelOrder(order.orderId)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {/* Trigger Orders */}
            {triggerOrders?.map((order) => (
              <TableRow key={`trigger-${order.positionId}`}>
                <TableCell>{order.market}</TableCell>
                <TableCell>Trigger</TableCell>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
                <TableCell className="text-red-500">
                  {order.stopLoss
                    ? `${order.stopLoss.price} (${order.stopLoss.size}%)`
                    : "-"}
                </TableCell>
                <TableCell className="text-green-500">
                  {order.takeProfit
                    ? `${order.takeProfit.price} (${order.takeProfit.size}%)`
                    : "-"}
                </TableCell>
                <TableCell>{order.timestamp}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={cancellingOrders[order.positionId]}
                    onClick={() => cancelOrder(order.positionId)}
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
