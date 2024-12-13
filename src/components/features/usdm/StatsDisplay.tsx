import { useMoltenStaking } from "@/hooks/use-molten-staking"
import { formatLargeNumber } from "@/utils/format"

export function StatsDisplay() {
  const { stakingData } = useMoltenStaking()
  
  return (
    <div className="flex flex-wrap gap-4">
      <div className="space-y-1">
        <div className="text-[#A0AEC0] text-sm">Total Staked</div>
        <div className="text-base text-white md:text-xl">
          {formatLargeNumber(stakingData?.formattedTotalStaked || '0')} <span className="hidden md:inline text-[#A0AEC0] text-sm">MOLTEN</span>
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-[#A0AEC0] text-sm">% of Circ. Supply</div>
        <div className="text-base text-white md:text-xl">{stakingData?.percentageStaked || '0'}%</div>
      </div>
    </div>
  )
}