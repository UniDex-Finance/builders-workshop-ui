import { useEffect, useState } from "react"
import { useUsdm } from "@/hooks/use-usdm"
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
  const [totalApr, setTotalApr] = useState<number>(0)
  const [esMoltenApr, setEsMoltenApr] = useState<number>(0)
  const { vaultApr, isLoading } = useDuneData(usdmData?.formattedVaultBalance || '0')

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

        // Calculate total APR
        setTotalApr(vaultApr + calculatedEsMoltenApr)
      } catch (error) {
        console.error('Error fetching MOLTEN price:', error)
        setEsMoltenApr(0)
        setTotalApr(vaultApr)
      }
    }

    fetchMoltenPrice()
  }, [vaultApr, usdmData?.formattedVaultBalance])
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-wrap gap-8">
        <div className="space-y-1">
          <div className="text-sm text-[#A0AEC0]">Total APR</div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-xl text-white cursor-help">
                  {isLoading ? "Loading..." : `${totalApr.toFixed(2)}%`}
                </div>
              </TooltipTrigger>
              <TooltipContent className="w-80 p-4 bg-[#2b2b36] border-none">
                {/* Vault APR Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#A0AEC0] font-medium">Vault APR</span>
                    <span className="font-medium text-white">{vaultApr.toFixed(2)}%</span>
                  </div>
                  <p className="text-sm text-[#A0AEC0]">
                    Earn yield from trading fees, funding rates, and traders Pnl collected by the protocol. 
                    APR is calculated based on the last 7 days of activity.
                  </p>
                </div>

                {/* Divider */}
                <div className="my-3 border-t border-[#404040]" />

                {/* esMOLTEN APR Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#A0AEC0] font-medium">Staking APR (esMOLTEN)</span>
                    <span className="font-medium text-white">{esMoltenApr.toFixed(2)}%</span>
                  </div>
                  <p className="text-sm text-[#A0AEC0]">
                    Earn 20,000 esMOLTEN tokens monthly when you stake USD.m on the staking page. 
                    esMOLTEN can be vested to MOLTEN tokens over 12 months.
                  </p>
                </div>

                {/* Total Section */}
                <div className="mt-3 pt-3 border-t border-[#404040]">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">Total APR</span>
                    <span className="font-medium text-white">{totalApr.toFixed(2)}%</span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="space-y-1">
          <div className="text-sm text-[#A0AEC0]">Current Price</div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[#7B3FE4] rounded-full" />
            <span className="text-xl text-white">
              ${usdmData?.formattedUsdmPrice || '0.00'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}