import { useEffect, useState } from 'react'

interface DuneResponse {
  result: {
    rows: Array<{
      cumulative_vaultReturn: number
      vaultDailyReturn: number
    }>
  }
}

export interface DuneData {
  cumulativeReturn: number
  vaultApr: number
  isLoading: boolean
  error: Error | null
}

// Cache storage outside the hook to persist between renders
interface CacheEntry {
  data: DuneData
  timestamp: number
  promise?: Promise<DuneData>
  tvl: number // Add TVL to cache entry
}

let cache: CacheEntry | null = null
const CACHE_DURATION = 5000 // 5 seconds in milliseconds

export function useDuneData(tvl: string | number) {
  const parsedTvl = typeof tvl === 'string' ? parseFloat(tvl) : tvl

  const [data, setData] = useState<DuneData>({
    cumulativeReturn: 0,
    vaultApr: 0,
    isLoading: true,
    error: null
  })

  useEffect(() => {
    // Skip the effect if TVL is 0 (initial state)
    if (parsedTvl === 0) {
      return
    }

    let isSubscribed = true
    console.log(`[${new Date().toISOString()}] Dune API hook triggered with TVL:`, parsedTvl)

    const fetchDuneData = async () => {
      const now = Date.now()

      // If there's an ongoing request with the same TVL, wait for it
      if (cache?.promise && cache.tvl === parsedTvl) {
        console.log(`[${new Date().toISOString()}] Waiting for ongoing request...`)
        try {
          const result = await cache.promise
          if (isSubscribed) setData(result)
          return
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Error waiting for ongoing request:`, error)
        }
      }

      // Check if we have fresh cached data for this TVL
      if (cache && cache.tvl === parsedTvl && now - cache.timestamp < CACHE_DURATION) {
        console.log(`[${new Date().toISOString()}] Using cached data, ${((now - cache.timestamp) / 1000).toFixed(1)}s old`)
        setData(cache.data)
        return
      }

      console.log(`[${new Date().toISOString()}] Cache expired or not found, starting new Dune API request...`)

      // Create promise for this request
      const fetchPromise = (async () => {
        try {
          const apiKey = process.env.NEXT_PUBLIC_DUNE_API_KEY
          console.log(`[${new Date().toISOString()}] API Key status:`, apiKey ? 'Present' : 'Missing')

          const response = await fetch('https://api.dune.com/api/v1/query/4086143/results?limit=7', {
            headers: { 'X-Dune-API-Key': apiKey || '' }
          })

          if (!response.ok) {
            console.error(`[${new Date().toISOString()}] Dune API response not OK:`, response.status, response.statusText)
            throw new Error('Failed to fetch vault return data')
          }

          const duneData: DuneResponse = await response.json()
          console.log(`[${new Date().toISOString()}] Received Dune API response`)

          // Calculate cumulative return
          const latestReturn = duneData.result.rows[0]?.cumulative_vaultReturn || 0
          
          // Calculate vault APR
          const totalDailyReturns = duneData.result.rows.reduce((sum, row) => {
            return sum + (row.vaultDailyReturn || 0)
          }, 0)
          const yearlyReturn = totalDailyReturns * 52
          const calculatedVaultApr = parsedTvl > 0 ? (yearlyReturn / parsedTvl) * 100 : 0

          console.log(`[${new Date().toISOString()}] Calculated values:`, {
            latestReturn,
            calculatedVaultApr,
            tvl: parsedTvl
          })

          const newData: DuneData = {
            cumulativeReturn: latestReturn,
            vaultApr: calculatedVaultApr,
            isLoading: false,
            error: null
          }

          return newData
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Error in useDuneData:`, error)
          const errorData: DuneData = {
            cumulativeReturn: 0,
            vaultApr: 0,
            isLoading: false,
            error: error as Error
          }
          return errorData
        }
      })()

      // Store the promise in cache
      cache = {
        data: data,
        timestamp: now,
        promise: fetchPromise,
        tvl: parsedTvl
      }

      try {
        const result = await fetchPromise
        if (!isSubscribed) {
          console.log(`[${new Date().toISOString()}] Component unmounted, skipping state update`)
          return
        }

        // Update cache with the result
        cache = {
          data: result,
          timestamp: Date.now(),
          promise: undefined,
          tvl: parsedTvl
        }

        setData(result)
      } finally {
        // Clear the promise from cache when done
        if (cache?.promise === fetchPromise) {
          cache.promise = undefined
        }
      }
    }

    fetchDuneData()

    return () => {
      isSubscribed = false
      console.log(`[${new Date().toISOString()}] Cleaning up Dune API hook`)
    }
  }, [parsedTvl]) // Changed dependency to parsedTvl

  return data
} 