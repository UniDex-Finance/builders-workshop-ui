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

export function useDuneData(tvl: string | number) {
  const [data, setData] = useState<DuneData>({
    cumulativeReturn: 0,
    vaultApr: 0,
    isLoading: true,
    error: null
  })

  useEffect(() => {
    const fetchDuneData = async () => {
      console.log('Fetching Dune data with TVL:', tvl)
      try {
        const apiKey = process.env.NEXT_PUBLIC_DUNE_API_KEY
        console.log('Using API key:', apiKey ? 'Present' : 'Missing')

        const response = await fetch('https://api.dune.com/api/v1/query/4086143/results?limit=7', {
          headers: { 'X-Dune-API-Key': apiKey || '' }
        })

        if (!response.ok) {
          console.error('Dune API response not OK:', response.status, response.statusText)
          throw new Error('Failed to fetch vault return data')
        }

        const duneData: DuneResponse = await response.json()
        console.log('Received Dune data:', duneData)
        
        // Calculate cumulative return
        const latestReturn = duneData.result.rows[0]?.cumulative_vaultReturn || 0
        
        // Calculate vault APR
        const totalDailyReturns = duneData.result.rows.reduce((sum, row) => {
          return sum + (row.vaultDailyReturn || 0)
        }, 0)
        const yearlyReturn = totalDailyReturns * 52
        const parsedTvl = typeof tvl === 'string' ? parseFloat(tvl) : tvl
        const calculatedVaultApr = parsedTvl > 0 ? (yearlyReturn / parsedTvl) * 100 : 0

        console.log('Calculated values:', {
          latestReturn,
          calculatedVaultApr
        })

        setData({
          cumulativeReturn: latestReturn,
          vaultApr: calculatedVaultApr,
          isLoading: false,
          error: null
        })
      } catch (error) {
        console.error('Error in useDuneData:', error)
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: error as Error
        }))
      }
    }

    fetchDuneData()
  }, [tvl])

  return data
} 