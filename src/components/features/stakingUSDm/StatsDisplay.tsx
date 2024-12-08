import { useUsdmStaking } from "@/hooks/usdmHooks/use-usdm-staking"
import { useUsdm } from "@/hooks/use-usdm"
import { formatLargeNumber } from "@/utils/format"

export function StatsDisplay() {
  const { stakingData } = useUsdmStaking()
  const { usdmData } = useUsdm()
  
  return (
    <div className="flex flex-wrap gap-8">
      <div className="space-y-1">
        <div className="text-sm text-[#A0AEC0]">Total USD.m Staked</div>
        <div className="text-xl text-white">
          {formatLargeNumber(stakingData?.formattedTotalStaked || '0')} <span className="text-[#A0AEC0] text-sm">USD.m</span>
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-sm text-[#A0AEC0]">USD.m Price</div>
        <div className="text-xl text-white">${usdmData?.formattedUsdmPrice || '0.00'}</div>
      </div>
    </div>
  )
}