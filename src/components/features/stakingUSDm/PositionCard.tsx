import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useUsdmStaking } from "@/hooks/usdmHooks/use-usdm-staking"
import { useUsdm } from "@/hooks/use-usdm"

export function PositionCard() {
  const { stakingData } = useUsdmStaking()
  const { usdmData } = useUsdm()
  
  const formatUsdValue = (amount: string) => {
    if (!usdmData?.formattedUsdmPrice) return '($0.00)'
    const value = parseFloat(amount) * parseFloat(usdmData.formattedUsdmPrice)
    return `($${value.toFixed(2)})`
  }

  const calculateShareOfPool = () => {
    if (!stakingData?.stakedBalance || !stakingData?.totalStaked || stakingData.totalStaked === BigInt(0)) return '0'
    return ((Number(stakingData.stakedBalance) / Number(stakingData.totalStaked)) * 100).toFixed(2)
  }
  
  return (
    <Card className="bg-[#16161D] border-[#1b1b22]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Positions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="text-[#A0AEC0] text-sm">Wallet Balance</div>
          <div className="text-2xl text-white">
            {stakingData?.displayUsdmBalance || '0.00'} <span className="text-[#A0AEC0] text-sm">USD.m</span>{' '}
            <span className="text-[#A0AEC0] text-sm">{formatUsdValue(stakingData?.formattedUsdmBalance || '0')}</span>
          </div>
        </div>
        <div className="border-t border-[#272734]" />
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-[#A0AEC0]">Amount Staked</span>
            <span className="text-white">
              {stakingData?.displayStakedBalance || '0.00'} USD.m {' '}
              <span className="text-[#A0AEC0]">{formatUsdValue(stakingData?.formattedStakedBalance || '0')}</span>
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#A0AEC0]">Unclaimed Rewards</span>
            <span className="text-[#00FF00]">
              {stakingData?.displayEarnedBalance || '0.00'} USD.m {' '}
              <span className="text-[#A0AEC0]">{formatUsdValue(stakingData?.formattedEarnedBalance || '0')}</span>
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