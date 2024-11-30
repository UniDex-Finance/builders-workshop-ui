import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAccount } from "wagmi";
import { Header } from "../components/shared/Header";
import { OrderCard } from "../components/features/trading/OrderCard";
import { Chart } from "../components/features/trading/Chart";
import { PositionsTable } from "../components/features/trading/PositionsTable";
import { PairHeader } from "../components/features/trading/PairHeader";
import { useMarketData } from "../hooks/use-market-data";
import { usePrices } from "../lib/websocket-price-context";
import { usePairFromUrl } from "../hooks/use-pair-from-url";

export default function TradingInterface() {
  const { selectedPair, setPair } = usePairFromUrl();
  const [leverage, setLeverage] = useState("20");
  const router = useRouter();
  const { ref } = router.query;
  const { address } = useAccount();
  const { allMarkets } = useMarketData();
  const { prices } = usePrices();

  const selectedMarket = allMarkets.find(
    (market) => market.pair === selectedPair
  );
  const assetId = selectedMarket ? selectedMarket.assetId : "";

  const [chartHeight, setChartHeight] = useState<number>(500);

  useEffect(() => {
    const basePair = selectedPair.split("/")[0].toLowerCase();
    const price = prices[basePair]?.price;
    const formattedPrice = price 
      ? new Intl.NumberFormat("en-US", {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        }).format(price)
      : "...";
    
    document.title = `UniDex | ${selectedPair} $${formattedPrice}`;
  }, [selectedPair, prices]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />

      <main className="flex flex-col flex-1 overflow-y-auto md:flex-row">
        {/* PairHeader for mobile - shown above OrderCard */}
        <div className="w-full px-2 md:hidden">
          <PairHeader selectedPair={selectedPair} onPairChange={setPair} />
        </div>

        {/* Trading Panel */}
        <div className="w-full px-2 md:w-auto md:mt-2">
          <div className="mb-2">
            <OrderCard
              leverage={leverage}
              onLeverageChange={setLeverage}
              assetId={assetId}
              initialReferralCode={typeof ref === 'string' ? ref : undefined}
            />
          </div>
        </div>

        {/* Chart and Positions Container */}
        <div className="flex flex-col w-full px-2">
          <div className="hidden md:block">
            <PairHeader selectedPair={selectedPair} onPairChange={setPair} />
          </div>
          
          <div className="flex flex-col flex-1">
            <Chart 
              selectedPair={selectedPair} 
              height={chartHeight}
              onHeightChange={setChartHeight}
            />
            <div className="flex-1 mt-3">
              <PositionsTable address={address} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
