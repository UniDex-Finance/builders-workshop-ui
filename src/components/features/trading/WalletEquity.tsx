import { useEffect } from "react";
import { usePositions } from "../../../hooks/use-positions";
import { useBalances } from "../../../hooks/use-balances";
import { useAccount } from "wagmi";
import { DepositCard } from "./account/DepositCard";
import { WithdrawCard } from "./account/WithdrawCard";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function WalletBox() {
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const { positions, loading: positionsLoading } = usePositions();
  const { balances, isLoading: balancesLoading } = useBalances("arbitrum");
  const { address: eoaAddress } = useAccount();

  // Calculate total unrealized PnL including fees
  const totalUnrealizedPnl = positions?.reduce((total, position) => {
    if (!position?.pnl) {
      return total;
    }

    // position.pnl already has fees deducted, so we just need to parse it
    return total + parseFloat(position.pnl.replace(/[^0-9.-]/g, ""));
  }, 0);

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
    if(!eoaAddress) return "0.00";
    if (balancesLoading) return "Loading...";

    const musdBalance = parseFloat(balances?.formattedMusdBalance || "0");
    const usdcBalance = parseFloat(balances?.formattedUsdcBalance || "0");
    const unrealizedPnl = totalUnrealizedPnl || 0;

    const total = musdBalance + usdcBalance + unrealizedPnl;
    return `$${total.toFixed(2)}`;
  };

  const calculateTradingAccountBalance = () => {
    if(!eoaAddress) return "0.00";
    if (balancesLoading) return "Loading...";
    const musdBalance = parseFloat(balances?.formattedMusdBalance || "0");
    const usdcBalance = parseFloat(balances?.formattedUsdcBalance || "0");
    return `$${(musdBalance + usdcBalance).toFixed(2)} USD`;
  };

  const calculateTotalExposure = () => {
    if(!eoaAddress) return "0.00";
    if (positionsLoading) return "Loading...";
    const totalSize = positions?.reduce((total, position) => {
      const size = parseFloat(position.size.replace(/[^0-9.-]/g, ""));
      return total + Math.abs(size);
    }, 0);
    return totalSize ? `$${totalSize.toFixed(2)} USD` : "$0.00 USD";
  };

  const calculateUsedMargin = () => {
    if(!eoaAddress) return "0.00";
    if (positionsLoading) return "Loading...";
    const totalMargin = positions?.reduce((total, position) => {
      const margin = parseFloat(position.margin.replace(/[^0-9.-]/g, ""));
      return total + Math.abs(margin);
    }, 0);
    return totalMargin ? `$${totalMargin.toFixed(2)} USD` : "$0.00 USD";
  };

  useEffect(() => {
    calculateTotalBalance();
    calculateTradingAccountBalance();
    calculateTotalExposure();
    calculateUsedMargin();
  }, [eoaAddress]);

  return (
    <div className="mt-8 border-t border-border pt-3">
      {/* Account Info Headers */}
      <div className="grid grid-cols-2 gap-8 mb-1 px-1">
        <div>
          <span className="text-xs text-muted-foreground">Trading Account</span>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground">Unrealized PnL</span>
        </div>
      </div>

      {/* Account Values */}
      <div className="grid grid-cols-2 gap-8 mb-4 px-1">
        <div>
          <span className="text-sm font-medium">{calculateTradingAccountBalance()}</span>
        </div>
        <div className="text-right">
          <span
            className={`text-sm font-medium ${
              (totalUnrealizedPnl || 0) >= 0 ? "text-long" : "text-short"
            }`}
          >
            {positionsLoading ? "Loading..." : !eoaAddress ? "$0.00" : formatPnL(totalUnrealizedPnl)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button
          onClick={() => setShowDeposit(true)}
          className="w-full h-10 text-sm bg-background hover:bg-background/90 border border-border"
        >
          Deposit
        </Button>
        <Button
          onClick={() => setShowWithdraw(true)}
          className="w-full h-10 text-sm bg-background hover:bg-background/90 border border-border"
        >
          Withdraw
        </Button>
      </div>

      {/* Modals */}
      {showDeposit && (
        <DepositCard 
          onClose={() => setShowDeposit(false)} 
          balances={balances} 
        />
      )}
      
      {showWithdraw && (
        <WithdrawCard 
          onClose={() => setShowWithdraw(false)} 
          balances={balances} 
        />
      )}
    </div>
  );
}

export default WalletBox;
