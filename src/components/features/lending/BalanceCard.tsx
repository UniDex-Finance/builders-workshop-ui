import { Card, CardContent, CardHeader } from "../../ui/card";
import { ArrowUpRight, Wallet, PiggyBank } from "lucide-react";

interface BalanceCardProps {
  totalBalance: string;
  yieldBalance: string;
  walletBalance: string;
  apy: string;
  lifetimeEarned?: string;
  lifetimeEarnedPercentage?: string;
}

export function BalanceCard({
  totalBalance = "0.00",
  yieldBalance = "0.00",
  walletBalance = "0.00",
  apy = "0.00%",
  lifetimeEarned,
  lifetimeEarnedPercentage,
}: BalanceCardProps) {

  return (
    <Card
      className="w-full h-full bg-card border border-border overflow-hidden rounded-lg shadow-sm flex flex-col"
    >
      <CardHeader className="p-0">
        {/* Modified header: Text to left, new content */}
        <div className="flex items-center justify-start bg-muted/50 p-3 border-b border-border">
          <div className="text-sm font-medium text-foreground">Your Positions</div>
        </div>
      </CardHeader>
      {/* Make content area grow */}
      <CardContent className="p-4 md:p-6 flex flex-col flex-grow justify-between space-y-6">
        {/* Balance Section */} 
        <div className="space-y-4">
          {/* Total Balance - Hero element */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
            <p className="text-3xl md:text-4xl font-bold text-foreground">${totalBalance}</p>
          </div>

          {/* Sub-balances */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-start gap-2">
              <PiggyBank className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="text-xs md:text-sm text-muted-foreground mb-0.5">Earning Yield</p>
                <p className="text-base md:text-lg font-medium text-foreground">${yieldBalance}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
               <Wallet className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
               <div>
                <p className="text-xs md:text-sm text-muted-foreground mb-0.5">In Wallet</p>
                <p className="text-base md:text-lg font-medium text-foreground">${walletBalance}</p>
              </div>
            </div>
          </div>
        </div>

        {/* APY/Earnings Section - Simplified */}
        <div className="bg-muted/50 p-3 md:p-4 rounded-md mt-auto">
          <div className="flex justify-between items-center">
            <p className="text-xs md:text-sm text-muted-foreground">Current Yield APY</p>
            <div className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-md">
              {apy}
            </div>
          </div>
          {/* Removed Lifetime Earned Section */}
        </div>
      </CardContent>
    </Card>
  );
} 