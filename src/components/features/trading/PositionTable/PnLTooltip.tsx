import { Position } from "../../../../hooks/use-positions";

interface PnLTooltipProps {
  position: Position;
  rect: DOMRect;
}

export function PnLTooltip({ position, rect }: PnLTooltipProps) {
  const formatPnL = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return numValue >= 0
      ? `$${numValue.toFixed(2)}`
      : `-$${Math.abs(numValue).toFixed(2)}`;
  };

  // Safely parse the PnL value
  const finalPnl = parseFloat(position.pnl?.replace(/[^0-9.-]/g, "") || "0");
  
  // Safely parse fee values with fallbacks to 0 if missing
  const positionFee = parseFloat(position.fees?.positionFee || "0");
  const borrowFee = parseFloat(position.fees?.borrowFee || "0");
  const fundingFee = parseFloat(position.fees?.fundingFee || "0");
  
  // Calculate total fees with safeguards against NaN
  const totalFees = (
    (isNaN(positionFee) ? 0 : positionFee) +
    (isNaN(borrowFee) ? 0 : borrowFee) +
    (isNaN(fundingFee) ? 0 : fundingFee)
  );
  
  // Calculate market PnL with safeguard against NaN
  const marketPnl = isNaN(finalPnl) ? 0 : finalPnl + totalFees;

  return (
    <div
      className="p-4 text-white rounded-lg shadow-lg"
      style={{
        position: "fixed",
        left: `${rect.left}px`,
        top: `${rect.top - 8}px`,
        transform: "translateY(-100%)",
        minWidth: "250px",
        pointerEvents: "none",
        backgroundColor: "#16161d",
      }}
    >
      <div className="space-y-2">
        <h4 className="mb-2 font-semibold">PnL Breakdown</h4>
        <div className="flex justify-between">
          <span>Market PnL:</span>
          <span className={marketPnl >= 0 ? "text-long" : "text-short"}>
            {formatPnL(marketPnl)}
          </span>
        </div>
        <div className="pt-2 mt-2 border-t border-gray-700">
          <div className="flex justify-between">
            <span>Position Fee:</span>
            <span className="text-short">-${position.fees?.positionFee || "0.00"}</span>
          </div>
          <div className="flex justify-between">
            <span>Borrow Fee:</span>
            <span className="text-short">-${position.fees?.borrowFee || "0.00"}</span>
          </div>
          <div className="flex justify-between">
            <span>Funding Fee:</span>
            <span
              className={
                (position.fees?.fundingFee || "0").startsWith("-")
                  ? "text-long"
                  : "text-short"
              }
            >
              {(position.fees?.fundingFee || "0").startsWith("-")
                ? `-$${(position.fees?.fundingFee || "0").substring(1)}`
                : `$${position.fees?.fundingFee || "0"}`}
            </span>
          </div>
        </div>
        <div className="pt-2 mt-2 border-t border-gray-700">
          <div className="flex justify-between font-semibold">
            <span>Final PnL:</span>
            <span
              className={
                finalPnl >= 0 ? "text-long" : "text-short"
              }
            >
              {formatPnL(finalPnl)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
