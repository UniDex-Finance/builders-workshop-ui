import { Position } from "../../../../hooks/use-positions";
import { TriggerOrder } from "../../../../hooks/use-orders";
import { useState } from "react";
import { ShareDialog } from "./ShareDialog";
import {
  Dialog,
  DialogContent,
} from "../../../ui/dialog";
import { PositionDetails } from "./PositionDetails";
import { PositionSizeDialog } from "./PositionSizeDialog";

// Combined type for trigger orders
type TriggerOrderWithStatus = TriggerOrder | {
  orderId: number;
  isTP: boolean;
  price: number;
  amountPercent: string;
  status: number;
  createdAt: string;
};

interface PositionDialogProps {
  position: Position | null;
  triggerOrders?: Array<TriggerOrderWithStatus>;
  isOpen: boolean;
  onClose: () => void;
  onClosePosition: (position: Position) => void;
  isClosing: boolean;
  onOpenSLTP?: () => void;
  onOpenCollateral?: () => void;
}

export function PositionDialog({
  position,
  triggerOrders = [],
  isOpen,
  onClose,
  onClosePosition,
  isClosing,
  onOpenSLTP,
  onOpenCollateral,
}: PositionDialogProps) {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSizeDialogOpen, setIsSizeDialogOpen] = useState(false);
  
  if (!position) return null;

  const handleOpenSize = () => {
    setIsSizeDialogOpen(true);
  };

  // Find the first stop loss and take profit orders
  const stopLossOrder = triggerOrders.find(order => 
    (order as any).isTP === false || 
    ((order as TriggerOrder).stopLoss && !(order as TriggerOrder).takeProfit)
  );
  
  const takeProfitOrder = triggerOrders.find(order => 
    (order as any).isTP === true || 
    (!(order as TriggerOrder).stopLoss && (order as TriggerOrder).takeProfit)
  );

  // Count additional orders
  const additionalOrders = triggerOrders.length - 
    (stopLossOrder ? 1 : 0) - 
    (takeProfitOrder ? 1 : 0);

  return (
    <>
      <Dialog open={isOpen} modal={true}>
        <DialogContent 
          className="sm:max-w-[425px] p-4 bg-[var(--position-cards-background)] border-zinc-800" 
          onPointerDownOutside={() => onClose()}
          hideClose={true}
        >
          <PositionDetails
            position={position}
            stopLossOrder={stopLossOrder}
            takeProfitOrder={takeProfitOrder}
            additionalOrders={additionalOrders}
            allTriggerOrders={triggerOrders}
            onClose={onClose}
            onClosePosition={onClosePosition}
            isClosing={isClosing}
            onOpenSLTP={onOpenSLTP}
            onOpenCollateral={onOpenCollateral}
            onShare={() => setIsShareOpen(true)}
            onOpenSize={handleOpenSize}
          />
        </DialogContent>
      </Dialog>

      <ShareDialog 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        position={position}
      />

      <PositionSizeDialog
        position={position}
        isOpen={isSizeDialogOpen}
        onClose={() => setIsSizeDialogOpen(false)}
      />
    </>
  );
}
