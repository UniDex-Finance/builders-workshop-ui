import React from "react";
import { usePositions } from "../../../hooks/use-positions";
import { useBalances } from "../../../hooks/use-balances";
import { useAccount } from "wagmi";

export const WalletBox = React.memo(function WalletBox() {
  const { positions, loading: positionsLoading } = usePositions();
  const { balances, isLoading: balancesLoading } = useBalances("arbitrum");
  const { address: eoaAddress } = useAccount();

  // Memoize calculations
  const totalUnrealizedPnl = React.useMemo(() => 
    positions?.reduce((total, position) => {
      if (!position?.pnl) return total;
      const pnlWithoutFees = parseFloat(position.pnl.replace(/[^0-9.-]/g, ""));
      const totalFees =
        parseFloat(position.fees.positionFee || "0") +
        parseFloat(position.fees.borrowFee || "0") +
        parseFloat(position.fees.fundingFee || "0");
      return total + (pnlWithoutFees - totalFees);
    }, 0),
    [positions]
  );

  const formatPnL = (value: number | undefined) => {
    if (value === undefined) return "$0.00";
    return value >= 0
      ? `+$${value.toFixed(2)}`
      : `-$${Math.abs(value).toFixed(2)}`;
  };

  const formatBalance = (value: string | undefined) => {
    if (!value) return "0.00";
    const numValue = parseFloat(value);
    return isNaN(numValue) ? "0.00" : numValue.toFixed(2);
  };

  // Calculate total balance across all accounts
  const calculateTotalBalance = () => {
    if (balancesLoading) return "Loading...";

    const musdBalance = parseFloat(balances?.formattedMusdBalance || "0");
    const usdcBalance = parseFloat(balances?.formattedUsdcBalance || "0");
    const unrealizedPnl = totalUnrealizedPnl || 0;

    const total = musdBalance + usdcBalance + unrealizedPnl;
    return `$${total.toFixed(2)}`;
  };

  // Show connect wallet message if no wallet is connected
  if (!eoaAddress) {
    return (
      <div className="text-sm text-center text-muted-foreground">
        Connect wallet to view balances
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm font-semibold text-muted-foreground">
          Account Equity
        </span>
        <span className="text-base">{calculateTotalBalance()}</span>
      </div>

      <div className="h-px my-4 bg-border" />

      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex justify-between">
          <span>Unrealized PnL</span>
          <span
            className={
              (totalUnrealizedPnl || 0) >= 0 ? "text-green-400" : "text-red-400"
            }
          >
            {positionsLoading ? "Loading..." : formatPnL(totalUnrealizedPnl)} USD
          </span>
        </div>

        <div className="flex justify-between">
          <span>Margin Wallet Balance</span>
          <span>
            {balancesLoading
              ? "Loading..."
              : `$${formatBalance(balances?.formattedMusdBalance)} USD`}
          </span>
        </div>

        <div className="flex justify-between">
          <span>1CT Wallet Balance</span>
          <span>
            {balancesLoading
              ? "Loading..."
              : `${formatBalance(balances?.formattedUsdcBalance)} USDC`}
          </span>
        </div>
      </div>
    </div>
  );
});

export default WalletBox;
