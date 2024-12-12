import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useUsdmStaking } from "@/hooks/usdmHooks/use-usdm-staking"
import { useUsdm } from "@/hooks/usdmHooks/use-usdm"
import { useEffect, useState } from "react"
import { useAccount } from 'wagmi'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function PositionCard() {
  const { stakingData } = useUsdmStaking()
  const { usdmData } = useUsdm()
  const { address } = useAccount()
  const [epochRewards, setEpochRewards] = useState<number | null>(null)
  const [vestableRewards, setVestableRewards] = useState<number | null>(null)
  const [moltenPrice, setMoltenPrice] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!address) return
      
      setIsLoading(true)
      try {
        // Fetch rewards data
        const rewardsResponse = await fetch('https://unidexv4-api-production.up.railway.app/api/usdmstaking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: "info", userAddress: address })
        })
        
        // Fetch MOLTEN price
        const moltenResponse = await fetch('https://coins.llama.fi/prices/current/arbitrum:0x66E535e8D2ebf13F49F3D49e5c50395a97C137b1')
        
        if (!rewardsResponse.ok || !moltenResponse.ok) {
          throw new Error('Failed to fetch data')
        }

        const rewardsData = await rewardsResponse.json()
        const moltenData = await moltenResponse.json()
        
        setEpochRewards(rewardsData.earned)
        setVestableRewards(rewardsData.vestableEarned)
        setMoltenPrice(moltenData.coins["arbitrum:0x66E535e8D2ebf13F49F3D49e5c50395a97C137b1"].price)
      } catch (error) {
        console.error('Error fetching data:', error)
        setEpochRewards(0)
        setVestableRewards(0)
        setMoltenPrice(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [address])

  const formatUsdValue = (amount: string) => {
    if (!usdmData?.formattedUsdmPrice) return '($0.00)'
    const value = parseFloat(amount) * parseFloat(usdmData.formattedUsdmPrice)
    return `($${value.toFixed(2)})`
  }

  const formatEsMoltenUsdValue = (amount: number) => {
    const value = amount * moltenPrice
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="text-[#A0AEC0]">Epoch Rewards</TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  <p>Every month, you will earn esMOLTEN which can be vested into MOLTEN. <br/><br/>You can claim your rewards at the end of every month and start vesting through our partner Sablier.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="text-[#00FF00]">
              {isLoading ? (
                "Loading..."
              ) : (
                <>
                  {epochRewards?.toFixed(2) || '0.00'} esMOLTEN {' '}
                  <span className="text-[#A0AEC0]">{formatEsMoltenUsdValue(epochRewards || 0)}</span>
                </>
              )}
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
