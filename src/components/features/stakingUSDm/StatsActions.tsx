import { useUsdm } from "@/hooks/usdmHooks/use-usdm"
import { useUsdmStaking } from "@/hooks/usdmHooks/use-usdm-staking"
import { useEffect, useState } from "react"

export function StatsActions() {
  const { usdmData } = useUsdm()
  const { stakingData } = useUsdmStaking()
  const [stakingApr, setStakingApr] = useState<number>(0)

  useEffect(() => {
    const fetchMoltenPrice = async () => {
      try {
        const moltenResponse = await fetch('https://coins.llama.fi/prices/current/arbitrum:0x66E535e8D2ebf13F49F3D49e5c50395a97C137b1')
        
        if (!moltenResponse.ok) {
          throw new Error('Failed to fetch MOLTEN price')
        }

        const moltenData = await moltenResponse.json()
        const moltenPrice = moltenData.coins["arbitrum:0x66E535e8D2ebf13F49F3D49e5c50395a97C137b1"].price

        // Calculate esMOLTEN APR
        const monthlyEsMoltenUsd = moltenPrice * 20000
        const yearlyEsMoltenUsd = monthlyEsMoltenUsd * 12
        const tvl = parseFloat(usdmData?.formattedVaultBalance || '0')
        const calculatedEsMoltenApr = tvl > 0 ? (yearlyEsMoltenUsd / tvl) * 100 : 0
        setStakingApr(calculatedEsMoltenApr)
      } catch (error) {
        console.error('Error fetching MOLTEN price:', error)
        setStakingApr(0)
      }
    }

    fetchMoltenPrice()
  }, [usdmData?.formattedVaultBalance])

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-wrap gap-8">
        <div className="space-y-1">
          <div className="text-sm text-[#A0AEC0]">Staking APR</div>
          <div className="text-xl text-white">
            {stakingApr ? `${stakingApr.toFixed(2)}` : '0.00'}%
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-sm text-[#A0AEC0]">Current Price</div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-primary hover:bg-primary/80 rounded-full" />
            <span className="text-xl text-white">${usdmData?.formattedUsdmPrice || '0.00'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
