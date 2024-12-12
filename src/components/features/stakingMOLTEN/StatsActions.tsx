import { useMoltenStats } from "@/hooks/use-molten-stats"
import { Button } from "@/components/ui/button"

export function StatsActions() {
  const { stats } = useMoltenStats()
  
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 md:flex-nowrap">
      <div className="flex gap-4 flex-nowrap">
        <div className="space-y-1">
          <div className="text-[#A0AEC0] text-sm">Staking APR</div>
          <div className="text-white text-[#00FF00] text-base md:text-xl">{stats?.apy.toFixed(2)}%</div>
        </div>
        <div className="space-y-1">
          <div className="text-[#A0AEC0] text-sm">Current Price</div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 md:w-5 md:h-5 bg-[#7B3FE4] rounded-full" />
            <span className="text-base text-white md:text-xl">${stats?.price.toFixed(4) || '0.00'}</span>
          </div>
        </div>
      </div>
      <Button 
        className="hidden md:block bg-[#272734] text-white hover:bg-[#373745] text-base"
        onClick={() => window.open('https://app.unidex.exchange/?chain=arbitrum&from=0x0000000000000000000000000000000000000000&to=0x66e535e8d2ebf13f49f3d49e5c50395a97c137b1', '_blank')}
      >
        Buy MOLTEN
      </Button>
    </div>
  )
}