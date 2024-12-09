import { useUsdm } from "@/hooks/usdmHooks/use-usdm"
import { useUsdmStaking } from "@/hooks/usdmHooks/use-usdm-staking"

export function StatsActions() {
  const { usdmData } = useUsdm()
  const { stakingData } = useUsdmStaking()
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-wrap gap-8">
        <div className="space-y-1">
          <div className="text-sm text-[#A0AEC0]">Staking APR</div>
          <div className="text-xl text-white text-[#00FF00]">
            {/* Calculate APR based on your staking rewards */}
            {stakingData ? '10.00' : '0.00'}%
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-sm text-[#A0AEC0]">Current Price</div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[#7B3FE4] rounded-full" />
            <span className="text-xl text-white">${usdmData?.formattedUsdmPrice || '0.00'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
