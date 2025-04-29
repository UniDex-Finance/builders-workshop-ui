import { useEffect, useState } from 'react'

export interface DuneData {
  cumulativeReturn: number
  vaultApr: number
  isLoading: boolean
  error: Error | null
  cacheAge?: number
  nextRefresh?: number
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

    const fetchDuneData = async () => {
      const now = Date.now()

      // If there's an ongoing request with the same TVL, wait for it
      if (cache?.promise && cache.tvl === parsedTvl) {
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
        setData(cache.data)
        return
      }


      // Create promise for this request
      const fetchPromise = (async () => {
        try {
          const apiUrl = `https://dune-api-production-b08f.up.railway.app/api/dune-data?tvl=${parsedTvl}`

          const response = await fetch(apiUrl)

          if (!response.ok) {
            console.error(`[${new Date().toISOString()}] Dune API response not OK:`, response.status, response.statusText)
            throw new Error('Failed to fetch vault return data')
          }

          const duneData = await response.json()

          const newData: DuneData = {
            cumulativeReturn: duneData.cumulativeReturn || 0,
            vaultApr: duneData.vaultApr || 0,
            cacheAge: duneData.cacheAge,
            nextRefresh: duneData.nextRefresh,
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
    }
  }, [parsedTvl]) // Changed dependency to parsedTvl

  return data
} 