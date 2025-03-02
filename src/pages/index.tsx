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
import { SideBar } from "../components/features/trading/SideBar/SideBar";
import { TradeStreamProvider } from "../lib/trade-stream-context";
import { Orderbook } from "../components/features/trading/Orderbook/Orderbook";

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
  }, []);

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

      <main className="flex flex-col flex-1 md:flex-row">
        {/* Left Side - Trading Panel */}
        <aside className="w-full md:w-[320px] md:min-w-[320px] md:max-w-[320px] md:h-full md:border-r border-border">
          {/* PairHeader for mobile - shown above OrderCard */}
          <div className="w-full md:hidden">
            <PairHeader selectedPair={selectedPair} onPairChange={setPair} />
          </div>
          <OrderCard
            leverage={leverage}
            onLeverageChange={setLeverage}
            assetId={assetId}
            initialReferralCode={typeof ref === 'string' ? ref : undefined}
          />
        </aside>

        {/* Right Side - Chart and Positions Container */}
        <TradeStreamProvider pair={selectedPair}>
          <div className="flex flex-col flex-1 min-w-0 md:overflow-hidden">
            <div className="w-full">
              <PairHeader selectedPair={selectedPair} onPairChange={setPair} />
            </div>
            
            <div className="flex flex-col flex-1">
              <div className="flex flex-1">
                <div className="hidden md:block" style={{ height: `${chartHeight}px` }}>
                  <Orderbook pair={selectedPair} height={chartHeight} />
                </div>
                <div className="flex-1">
                  <Chart 
                    selectedPair={selectedPair} 
                    height={chartHeight}
                    onHeightChange={setChartHeight}
                    positions={positionsLoading ? [] : positions}
                  />
                </div>
                <SideBar />
              </div>
              <div className="flex-1 overflow-x-auto">
                <PositionsTable address={address} />
              </div>
            </div>
          </div>
        </TradeStreamProvider>
      </main>
    </div>
  );
}
