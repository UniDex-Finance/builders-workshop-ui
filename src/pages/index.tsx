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

  const [chartHeight, setChartHeight] = useState<number>(580);

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
      {/* Header has highest z-index since it contains the settings modal */}
      <div className="relative z-40">
        <Header />
      </div>

      <main className="flex flex-col flex-1 relative z-10">
        {/* PairHeader - Now full width */}
        <div className="w-full">
          <PairHeader selectedPair={selectedPair} onPairChange={setPair} />
        </div>

        <div className="flex flex-col flex-1 md:flex-row">
          <TradeStreamProvider pair={selectedPair}>
            {/* Middle section containing Chart, SideBar, Orderbook, and PositionsTable */}
            <div className="flex flex-col flex-1 min-w-0 md:overflow-hidden">
              <div className="flex flex-1">
                {/* SideBar - On the left of the chart section only */}
                <SideBar />
                
                {/* Chart - Middle */}
                <div className="flex-1">
                  <Chart 
                    selectedPair={selectedPair} 
                    height={chartHeight}
                    onHeightChange={setChartHeight}
                    positions={positionsLoading ? [] : positions}
                  />
                </div>
                
                {/* Orderbook - Right of the chart */}
                <div className="hidden md:block relative z-20" style={{ height: `${chartHeight}px` }}>
                  <Orderbook pair={selectedPair} height={chartHeight} />
                </div>
              </div>
              
              {/* PositionsTable - Bottom section (spans the full width except OrderCard) */}
              <div className="flex-1 overflow-x-auto">
                <PositionsTable address={address} />
              </div>
            </div>
            
            {/* OrderCard - Now on the rightmost side */}
            <aside className="w-full md:w-[352px] md:min-w-[352px] md:max-w-[352px] md:border-l border-border">
              <OrderCard
                leverage={leverage}
                onLeverageChange={setLeverage}
                assetId={assetId}
                initialReferralCode={typeof ref === 'string' ? ref : undefined}
              />
            </aside>
          </TradeStreamProvider>
        </div>
      </main>
    </div>
  );
}
