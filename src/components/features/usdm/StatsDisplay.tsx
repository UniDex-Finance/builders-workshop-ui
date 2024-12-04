import { useUsdm } from "@/hooks/use-usdm"
import { formatLargeNumber } from "@/utils/format"
import { useDuneData } from "@/hooks/use-dune-data"

export function StatsDisplay() {
  const { usdmData } = useUsdm()
  const { cumulativeReturn } = useDuneData(usdmData?.formattedVaultBalance || '0')

  return (
    <div className="flex flex-wrap gap-8">
      <div className="space-y-1">
        <div className="text-sm text-[#A0AEC0]">USD.m TVL</div>
        <div className="text-xl text-white">
          ${formatLargeNumber(usdmData?.formattedVaultBalance || '0')} <span className="text-[#A0AEC0] text-sm">USD</span>
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-sm text-[#A0AEC0]">Total Vault Return</div>
        <div className="text-xl text-white">
          ${formatLargeNumber(cumulativeReturn.toFixed(2))} <span className="text-[#A0AEC0] text-sm">USD</span>
        </div>
      </div>
    </div>
  )
}