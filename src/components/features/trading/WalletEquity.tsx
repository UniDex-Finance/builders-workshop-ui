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

    const pnlWithoutFees = parseFloat(position.pnl.replace(/[^0-9.-]/g, ""));
    const totalFees =
      parseFloat(position.fees.positionFee || "0") +
      parseFloat(position.fees.borrowFee || "0") +
      parseFloat(position.fees.fundingFee || "0");

    return total + (pnlWithoutFees - totalFees);
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
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="font-medium">Your Account</span>
        <span className="text-sm">
          <button 
            onClick={() => setShowDeposit(true)}
            className="text-primary hover:opacity-80"
          >
            Deposit
          </button>
          <span className="mx-1 text-border">|</span>
          <button 
            onClick={() => setShowWithdraw(true)}
            className="text-primary hover:opacity-80"
          >
            Withdraw
          </button>
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Account Equity
          </span>
          <span className="text-sm text-white">
            {calculateTotalBalance()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Trading Account
          </span>
          <span className="text-sm text-muted-foreground">
            {calculateTradingAccountBalance()}
          </span>
        </div>
      </div>

      <div className="h-px my-4 bg-border" />

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Unrealized PnL</span>
          <span
            className={`text-sm ${
              (totalUnrealizedPnl || 0) >= 0 ? "text-long" : "text-short"
            }`}
          >
            {positionsLoading ? "Loading..." : !eoaAddress ? "0.00" : formatPnL(totalUnrealizedPnl)} USD
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Open Exposure</span>
          <span className="text-sm text-muted-foreground">{calculateTotalExposure()}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Used Margin</span>
          <span className="text-sm text-muted-foreground">{calculateUsedMargin()}</span>
        </div>
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
