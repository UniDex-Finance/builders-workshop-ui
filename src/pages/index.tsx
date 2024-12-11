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
import { usePositions } from "../hooks/use-positions";
import { loadSpace } from '@usersnap/browser';
import { setUsersnapApi } from "../lib/usersnap";

export default function TradingInterface() {
  const { selectedPair, setPair } = usePairFromUrl();
  const [leverage, setLeverage] = useState("20");
  const router = useRouter();
  const { ref } = router.query;
  const { address } = useAccount();
  const { allMarkets } = useMarketData();
  const { prices } = usePrices();
  const { positions, loading: positionsLoading } = usePositions();

  const selectedMarket = allMarkets.find(
    (market) => market.pair === selectedPair
  );
  const assetId = selectedMarket ? selectedMarket.assetId : "";

  const [chartHeight, setChartHeight] = useState<number>(500);

  useEffect(() => {
    // Initialize Usersnap
    const spaceApiKey = process.env.NEXT_PUBLIC_USERSNAP_API_KEY;
    if (spaceApiKey) {
      loadSpace(spaceApiKey).then((api) => {
        api.init();
        setUsersnapApi(api);
      });
    }
  }, []); // Empty dependency array means this runs once on mount

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

      <main className="flex flex-col flex-1 md:flex-row md:gap-12">
        {/* PairHeader for mobile - shown above OrderCard */}
        <div className="w-full px-2 md:hidden">
          <PairHeader selectedPair={selectedPair} onPairChange={setPair} />
        </div>

        {/* Left Side - Trading Panel */}
        <aside className="w-full md:w-[320px] md:min-w-[320px] md:max-w-[320px] px-2 md:mt-[8px]">
          <div className="mb-2">
            <OrderCard
              leverage={leverage}
              onLeverageChange={setLeverage}
              assetId={assetId}
              initialReferralCode={typeof ref === 'string' ? ref : undefined}
            />
          </div>
        </aside>

        {/* Right Side - Chart and Positions Container */}
        <div className="flex flex-col flex-1 min-w-0 px-2 overflow-x-auto md:pl-0">
          <div className="hidden md:block">
            <PairHeader selectedPair={selectedPair} onPairChange={setPair} />
          </div>
          
          <div className="flex flex-col flex-1">
            <Chart 
              selectedPair={selectedPair} 
              height={chartHeight}
              onHeightChange={setChartHeight}
              positions={positionsLoading ? [] : positions}
            />
            <div className="flex-1 mt-3 overflow-x-auto">
              <PositionsTable address={address} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
