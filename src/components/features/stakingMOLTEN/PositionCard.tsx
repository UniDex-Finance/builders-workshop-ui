import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useMoltenStaking } from "@/hooks/use-molten-staking"
import { useMoltenStats } from "@/hooks/use-molten-stats"

export function PositionCard() {
  const { stakingData, isLoading } = useMoltenStaking()
  const { stats } = useMoltenStats()
  
  const formatUsdValue = (moltenAmount: string) => {
    if (!stats?.price) return '($0.00)'
    const value = parseFloat(moltenAmount) * stats.price
    return `($${value.toFixed(2)})`
  }

  const calculateShareOfPool = () => {
    if (!stakingData?.stakedBalance || !stakingData?.totalStaked || stakingData.totalStaked === BigInt(0)) return '0'
    return ((Number(stakingData.stakedBalance) / Number(stakingData.totalStaked)) * 100).toFixed(2)
  }
  
  return (
    <Card className="bg-[#1e1e20] border-[#1b1b22]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Positions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="text-[#A0AEC0] text-sm">Wallet Balance</div>
          <div className="text-2xl text-white">
            {stakingData?.displayWalletBalance || '0.00'} <span className="text-[#A0AEC0] text-sm">MOLTEN</span>{' '}
            <span className="text-[#A0AEC0] text-sm">{formatUsdValue(stakingData?.displayWalletBalance || '0')}</span>
          </div>
        </div>
        <div className="border-t border-[#272734]" />
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-[#A0AEC0]">Amount Staked</span>
            <span className="text-white">
              {stakingData?.displayStakedBalance || '0.00'} MOLTEN {' '}
              <span className="text-[#A0AEC0]">{formatUsdValue(stakingData?.displayStakedBalance || '0')}</span>
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#A0AEC0]">Unclaimed Rewards</span>
            <span className="text-[#00FF00]">
              {stakingData?.displayEarnedBalance || '0.00'} MOLTEN {' '}
              <span className="text-[#A0AEC0]">{formatUsdValue(stakingData?.displayEarnedBalance || '0')}</span>
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#A0AEC0]">Share of Pool</span>
            <span className="text-white">{calculateShareOfPool()}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}