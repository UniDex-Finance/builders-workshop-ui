import { ArrowUpRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useMoltenStaking } from "@/hooks/use-molten-staking"
import { useMoltenStats } from "@/hooks/use-molten-stats"

export function StatsBar() {
  const { stakingData } = useMoltenStaking()
  const { stats } = useMoltenStats()

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="text-sm text-[#A0AEC0]">Staking APR</div>
        <div className="text-xl text-white text-[#00FF00]">
          {stats?.apy.toFixed(2)}%
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-sm text-[#A0AEC0]">Total Staked</div>
        <div className="text-xl text-white">
          {stakingData?.formattedTotalStaked || '0'} <span className="text-[#A0AEC0] text-sm">MOLTEN</span>
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-sm text-[#A0AEC0]">% of Circ. Supply</div>
        <div className="text-xl text-white">{stakingData?.percentageStaked || '0'}%</div>
      </div>
      <div className="space-y-1">
        <div className="text-sm text-[#A0AEC0]">Price</div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-primary hover:bg-primary/80 rounded-full" />
          <span className="text-xl text-white">${stats?.price.toFixed(4) || '0.00'}</span>
        </div>
      </div>
      <Button 
        className="bg-[#252525] text-white hover:bg-[#373745]"
        onClick={() => window.open('https://app.unidex.exchange/?chain=arbitrum&from=0x0000000000000000000000000000000000000000&to=0x66e535e8d2ebf13f49f3d49e5c50395a97c137b1', '_blank')}
      >
        Buy MOLTEN
      </Button>
    </div>
  )
}