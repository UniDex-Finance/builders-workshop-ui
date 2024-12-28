import { useUsdm } from "@/hooks/usdmHooks/use-usdm"
import { useUsdmStaking } from "@/hooks/usdmHooks/use-usdm-staking"
import { useEffect, useState } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useDuneData } from "@/hooks/use-dune-data"

interface MoltenPriceResponse {
  coins: {
    "arbitrum:0x66E535e8D2ebf13F49F3D49e5c50395a97C137b1": {
      decimals: number
      symbol: string
      price: number
      timestamp: number
      confidence: number
    }
  }
}

export function StatsActions() {
  const { usdmData } = useUsdm()
  const { stakingData } = useUsdmStaking()
  const [totalApr, setTotalApr] = useState<number>(0)
  const [esMoltenApr, setEsMoltenApr] = useState<number>(0)
  const [rehypothecationApr, setRehypothecationApr] = useState<number>(0)
  const { vaultApr } = useDuneData(usdmData?.formattedVaultBalance || '0')
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)

  useEffect(() => {
    const fetchRehypothecationApr = async () => {
      try {
        const response = await fetch('https://yields.llama.fi/chart/d9fa8e14-0447-4207-9ae8-7810199dfa1f')
        if (!response.ok) {
          throw new Error('Failed to fetch rehypothecation APR')
        }
        const data = await response.json()
        if (data.status === 'success' && data.data.length > 0) {
          const latestData = data.data.sort((a: any, b: any) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )[0]
          setRehypothecationApr(latestData.apy)
        }
      } catch (error) {
        console.error('Error fetching rehypothecation APR:', error)
        setRehypothecationApr(0)
      }
    }

    fetchRehypothecationApr()
  }, [])

  useEffect(() => {
    const fetchMoltenPrice = async () => {
      try {
        const moltenResponse = await fetch('https://coins.llama.fi/prices/current/arbitrum:0x66E535e8D2ebf13F49F3D49e5c50395a97C137b1')
        
        if (!moltenResponse.ok) {
          throw new Error('Failed to fetch MOLTEN price')
        }

        const moltenData: MoltenPriceResponse = await moltenResponse.json()
        const moltenPrice = moltenData.coins["arbitrum:0x66E535e8D2ebf13F49F3D49e5c50395a97C137b1"].price

        // Calculate esMOLTEN APR
        const monthlyEsMoltenUsd = moltenPrice * 20000
        const yearlyEsMoltenUsd = monthlyEsMoltenUsd * 12
        const tvl = parseFloat(usdmData?.formattedVaultBalance || '0')
        const calculatedEsMoltenApr = tvl > 0 ? (yearlyEsMoltenUsd / tvl) * 100 : 0
        setEsMoltenApr(calculatedEsMoltenApr)

        // Calculate total APR including rehypothecation
        setTotalApr(vaultApr + calculatedEsMoltenApr + rehypothecationApr)
      } catch (error) {
        console.error('Error fetching MOLTEN price:', error)
        setEsMoltenApr(0)
        setTotalApr(vaultApr + rehypothecationApr)
      }
    }

    fetchMoltenPrice()
  }, [vaultApr, usdmData?.formattedVaultBalance, rehypothecationApr])

  const aprContent = (
    <div className="space-y-2">
      {/* Vault APR Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-white">Vault APR</span>
          <span className="font-medium text-white">{vaultApr.toFixed(2)}%</span>
        </div>
        <p className="text-sm text-[#A0AEC0]">
          Yield earned from market making preformance and 50% of trading fees collected by the protocol in the past 7 days annualized.
        </p>
      </div>

      {/* Divider */}
      <div className="my-3 border-t border-[#404040]" />

      {/* Rehypothecation APR Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-white">Rehypothecation (Aave V3)</span>
          <span className="font-medium text-white">{rehypothecationApr.toFixed(2)}%</span>
        </div>
        <p className="text-sm text-[#A0AEC0]">
          Idle funds in the vault earn yield from the Aave V3 lending vault on Arbitrum.
        </p>
      </div>

      {/* Divider */}
      <div className="my-3 border-t border-[#404040]" />

      {/* esMOLTEN APR Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-white">Staking APR (esMOLTEN)</span>
          <span className="font-medium text-white">{esMoltenApr.toFixed(2)}%</span>
        </div>
        <p className="text-sm text-[#A0AEC0]">
          Stake your USD.m to earn a share of 20,000 esMOLTEN tokens distributed monthly.
        </p>
      </div>

      {/* Total Section */}
      <div className="mt-3 pt-3 border-t border-[#404040]">
        <div className="flex items-center justify-between">
          <span className="font-medium text-white">Total APR</span>
          <span className="font-medium text-white">{totalApr.toFixed(2)}%</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-wrap gap-8">
        <div className="space-y-1">
          <div className="text-sm text-[#A0AEC0]">Total APR</div>
          <TooltipProvider>
            <Tooltip open={isTooltipOpen} onOpenChange={setIsTooltipOpen}>
              <TooltipTrigger asChild>
                <div 
                  className="inline-block text-xl border-b border-dashed cursor-pointer text-foreground border-white/50"
                  onClick={() => setIsTooltipOpen(!isTooltipOpen)}
                >
                  {totalApr === 0 ? "Loading..." : `${totalApr.toFixed(2)}%`}
                </div>
              </TooltipTrigger>
              <TooltipContent className="w-80 p-4 bg-[#2b2b36] border-none">
                {aprContent}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="space-y-1">
          <div className="text-sm text-[#A0AEC0]">Current Price</div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-primary hover:bg-primary/80 rounded-full" />
            <span className="text-xl text-foreground">${usdmData?.formattedUsdmPrice || '0.00'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
