import { useState, useEffect } from 'react'

export interface TradeItem {
  user: string
  tokenAddress: string
  pnl: string
  positionFee: string
  size: string
  isLong: boolean
  isLiquidated: boolean
  id: string
  closedAt: string
  entryFundingRate: string
  collateral: string
  averagePrice: string
  closePrice: string
}

export const useLeaderboardData = () => {
  const [data, setData] = useState<TradeItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchLeaderboardData() {
      try {
        setLoading(true)
        const response = await fetch('https://v4-subgraph-production.up.railway.app/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              query GetLeaderboardData {
                closedTrades(where: {closedAt_gt: "1739114000"}) {
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
                    averagePrice
                    closePrice
                  }
                }
              }
            `
          })
        })

        const result = await response.json()
        console.log('API Response:', result)
        
        if (result.errors) {
          console.error('Subgraph Errors:', result.errors)
          throw new Error(result.errors[0].message)
        }

        if (!result.data?.closedTrades?.items) {
          console.error('Unexpected data structure:', result)
          throw new Error('Invalid data structure received from API')
        }

        setData(result.data.closedTrades.items)
      } catch (err) {
        console.error('Leaderboard Error:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch leaderboard data'))
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboardData()
    const interval = setInterval(fetchLeaderboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  return {
    data,
    loading: loading && data.length === 0,
    error
  }
} 