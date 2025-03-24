import { useState, useEffect } from "react";

export interface TradeItem {
  user: string;
  tokenAddress: string;
  pnl: string;
  positionFee: string;
  size: string;
  isLong: boolean;
  isLiquidated: boolean;
  id: string;
  closedAt: string;
  entryFundingRate: string;
  collateral: string;
  maxCollateral: string;
  averagePrice: string;
  closePrice: string;
  createdAt: string;
}

export const useLeaderboardData = () => {
  const [data, setData] = useState<TradeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchAllPages() {
      try {
        setLoading(true);
        let allItems: TradeItem[] = [];
        let hasNextPage = true;
        let afterCursor: string | null = null;

        // Competition start: March 24, 2025 (00:00 UTC)
        const competitionStart = Math.floor(new Date(Date.UTC(2025, 2, 24, 0, 0, 0, 0)).getTime() / 1000);
        
        // Competition end: April 20, 2025 (23:59 UTC)
        const competitionEnd = Math.floor(new Date(Date.UTC(2025, 3, 20, 23, 59, 59, 999)).getTime() / 1000);

        while (hasNextPage) {
          const response: Response = await fetch(
            "https://v4-subgraph-production.up.railway.app/",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                query: `
query GetLeaderboardData($after: String) {
  closedTrades(
    where: {createdAt_gte: "${competitionStart}", closedAt_lte: "${competitionEnd}"}
    limit: 50
    after: $after
  ) {
    items {
      user
      tokenAddress
      pnl
      positionFee
      size
      isLong
      isLiquidated
      id
      closedAt
      entryFundingRate
      collateral
      maxCollateral
      averagePrice
      closePrice
      createdAt
    }
    pageInfo {
      endCursor
      hasNextPage
      hasPreviousPage
      startCursor
    }
  }
}`,
                variables: {
                  after: afterCursor
                }
              }),
            }
          );

          const result: {
            data?: {
              closedTrades?: {
                items: TradeItem[];
                pageInfo: {
                  endCursor: string;
                  hasNextPage: boolean;
                  hasPreviousPage: boolean;
                  startCursor: string;
                };
              };
            };
            errors?: Array<{ message: string }>;
          } = await response.json();
          console.log("Subgraph Response:", result);

          if (result.errors) {
            console.error("Subgraph Errors:", result.errors);
            throw new Error(result.errors[0].message);
          }

          if (!result.data?.closedTrades?.items) {
            console.error("Unexpected data structure:", result);
            throw new Error("Invalid data structure received from API");
          }

          // Add new items to our collection
          allItems = [...allItems, ...result.data.closedTrades.items];

          // Update pagination info for next iteration
          hasNextPage = result.data.closedTrades.pageInfo.hasNextPage;
          afterCursor = result.data.closedTrades.pageInfo.endCursor;

          // If component unmounted during fetch, stop fetching more pages
          if (!isMounted) break;
        }

        if (isMounted) {
          setData(allItems);
        }
      } catch (err) {
        console.error("Leaderboard Error:", err);
        if (isMounted) {
          setError(
            err instanceof Error
              ? err
              : new Error("Failed to fetch leaderboard data")
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchAllPages();
    const interval = setInterval(fetchAllPages, 30000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return {
    data,
    loading: loading && data.length === 0,
    error,
  };
};
