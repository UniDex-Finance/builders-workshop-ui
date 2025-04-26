import { Card, CardContent } from "../../ui/card";

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
}: BalanceCardProps) {
  return (
    <Card
      className="w-full h-full bg-card border border-border overflow-hidden rounded-xl"
    >
      <CardContent className="p-4 md:p-6 text-foreground">
        <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">
          Wallet Balance
        </h2>

        <div className="text-center mb-6 md:mb-8">
          <p className="text-3xl md:text-4xl font-bold">${totalBalance}</p>
        </div>

        <div className="flex justify-between mb-6 md:mb-8 px-1 md:px-2">
          <div className="text-center md:text-left">
            <p className="text-sm md:text-base text-muted-foreground mb-0.5">Deposited</p>
            <p className="text-xl md:text-2xl font-medium">${yieldBalance}</p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-sm md:text-base text-muted-foreground mb-0.5">Idle USDC</p>
            <p className="text-xl md:text-2xl font-medium">${walletBalance}</p>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg md:rounded-xl p-3 md:p-4 flex justify-between items-center">
          <p className="text-base md:text-lg font-medium text-muted-foreground">Your Deposit APY</p>
          <div className="bg-primary/10 text-primary px-2 py-1 md:px-3 rounded-md">
            <p className="text-sm md:text-base font-semibold">
              {(() => {
                const apyValue = parseFloat(apy.replace('%', ''));
                return !isNaN(apyValue) ? `${apyValue.toFixed(2)}%` : apy;
              })()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 