import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useUsdmStaking } from "@/hooks/usdmHooks/use-usdm-staking"
import { useState } from "react"
import { useWalletClient, useAccount, useSwitchChain } from 'wagmi'
import { parseUnits } from 'viem'
import { ArrowUpRight } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ActionsCardProps {
  isStaking: boolean
  setIsStaking: (value: boolean) => void
}

export function ActionsCard({ isStaking, setIsStaking }: ActionsCardProps) {
    const [amount, setAmount] = useState<string>("")
    const { data: walletClient } = useWalletClient()
    const { chain } = useAccount()
    const { switchChain } = useSwitchChain()
    const { stakingData, claim, stake, withdraw, approve, refetch } = useUsdmStaking()

    const handleMax = () => {
        if (stakingData) {
            if (isStaking) {
                setAmount(stakingData.formattedUsdmBalance)
            } else {
                setAmount(stakingData.formattedStakedBalance)
            }
        }
    }

    const isOnArbitrum = () => {
        return chain?.id === 42161
    }

    const handleNetworkSwitch = async () => {
        if (switchChain) {
            await switchChain({ chainId: 42161 })
        }
    }

    const handleClaim = async () => {
        if (!walletClient) return
        if (!isOnArbitrum()) {
            return handleNetworkSwitch()
        }
        try {
            const request = await claim()
            if (request) {
                await walletClient.writeContract(request)
            }
        } catch (error) {
            console.error('Error claiming rewards:', error)
        }
    }

    const handleAction = async () => {
        if (!walletClient || !amount || !stakingData) return
        if (!isOnArbitrum()) {
            return handleNetworkSwitch()
        }
        try {
            const parsedAmount = parseUnits(amount, 18)
            
            if (isStaking) {
                if (parsedAmount > stakingData.allowance) {
                    const request = await approve(parsedAmount)
                    if (request) {
                        await walletClient.writeContract(request)
                        await new Promise(r => setTimeout(r, 2000))
                        await refetch()
                    }
                } else {
                    const request = await stake(parsedAmount)
                    if (request) {
                        await walletClient.writeContract(request)
                        setAmount("")
                    }
                }
            } else {
                const request = await withdraw(parsedAmount)
                if (request) {
                    await walletClient.writeContract(request)
                    setAmount("")
                }
            }
        } catch (error) {
            console.error('Error:', error)
        }
    }

    const canStake = () => {
        if (!amount || !stakingData) return false
        try {
            const parsedAmount = parseUnits(amount, 18)
            return parsedAmount <= stakingData.usdmBalance
        } catch {
            return false
        }
    }

    const canUnstake = () => {
        if (!amount || !stakingData) return false
        try {
            const parsedAmount = parseUnits(amount, 18)
            return parsedAmount <= stakingData.stakedBalance
        } catch {
            return false
        }
    }

    const needsApproval = () => {
        if (!amount || !stakingData || !isStaking) return false
        try {
            const parsedAmount = parseUnits(amount, 18)
            return parsedAmount > stakingData.allowance
        } catch {
            return false
        }
    }

    const canSubmit = () => {
        if (!amount || amount === '0') return false
        return isStaking ? canStake() : canUnstake()
    }

    const getButtonText = () => {
        if (!isOnArbitrum()) {
            return 'Switch to Arbitrum'
        }
        if (!amount) {
            return 'Input Amount'
        }
        if (isStaking) {
            if (!canStake()) {
                return 'Insufficient Balance'
            }
            return needsApproval() ? 'Approve USD.m' : 'Stake USD.m'
        } else {
            if (!canUnstake()) {
                return 'Insufficient Staked Balance'
            }
            return 'Unstake USD.m'
        }
    }

    return (
        <Card className="bg-[#16161D] border-[#1b1b22]">
            <CardHeader className="pt-3 pb-0 sm:pt-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Manage Stake</CardTitle>
                    <div className="flex gap-1 sm:gap-2">
                        <Button 
                            variant="ghost" 
                            className={`text-[#A0AEC0] text-sm px-2 sm:px-4 ${isStaking ? 'bg-[#272734] hover:bg-[#373745]' : ''}`}
                            onClick={() => setIsStaking(true)}
                        >
                            Stake
                        </Button>
                        <Button 
                            variant="ghost" 
                            className={`text-[#A0AEC0] text-sm px-2 sm:px-4 ${!isStaking ? 'bg-[#272734] hover:bg-[#373745]' : ''}`}
                            onClick={() => setIsStaking(false)}
                        >
                            Unstake
                        </Button>
                    </div>
                </div>
            </CardHeader>
            {walletClient?.account ? (
                <CardContent className="pt-4 space-y-6">
                    {/* Desktop layout */}
                    <div className="hidden gap-4 md:flex">
                        <div className="relative flex-1">
                            <Input
                                type="number"
                                placeholder="Enter amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full h-[42px] bg-[#272734] border-[#373745] text-white placeholder:text-[#A0AEC0] rounded-md"
                            />
                            <Button
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 bg-[#373745] hover:bg-[#474755] text-white text-xs px-2"
                                onClick={handleMax}
                            >
                                MAX
                            </Button>
                        </div>
                        <Button 
                            className="w-[180px] h-[42px] bg-[#7C5CFF] hover:bg-[#6B4FE0] text-sm text-white"
                            onClick={handleAction}
                            disabled={!isOnArbitrum() ? false : !canSubmit()}
                        >
                            {getButtonText()}
                        </Button>
                    </div>

                    {/* Mobile layout */}
                    <div className="flex flex-col gap-4 md:hidden">
                        <div className="relative w-full">
                            <Input
                                type="number"
                                placeholder="Enter amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full h-[42px] bg-[#272734] border-[#373745] text-white placeholder:text-[#A0AEC0] pr-16 rounded-md"
                            />
                            <Button
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 bg-[#373745] hover:bg-[#474755] text-white text-xs px-2"
                                onClick={handleMax}
                            >
                                MAX
                            </Button>
                        </div>
                        <Button 
                            className="w-full h-[42px] bg-[#7C5CFF] hover:bg-[#6B4FE0] text-sm text-white"
                            onClick={handleAction}
                            disabled={!isOnArbitrum() ? false : !canSubmit()}
                        >
                            {getButtonText()}
                        </Button>
                    </div>

                    <div className="border-t border-[#272734]" />
                    
                    {/* Desktop rewards layout */}
                    <div className="hidden md:flex items-center justify-between p-4 bg-[#272734] rounded-lg">
                        <div className="space-y-1">
                            <div className="text-sm text-white">Claim Earned Staking Rewards</div>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger className="text-[#A0AEC0] hover:text-[#B0BED0] text-xs">
                                        What is Sablier?
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">Every month, you can claim your staking rewards through our partner Sablier and vest your esMOLTEN into MOLTEN.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <Button 
                            variant="market"
                            className="flex items-center gap-2"
                            onClick={() => window.open('https://app.sablier.com/airdrops/?t=eligible', '_blank')}
                        >
                            Claim Rewards
                            <ArrowUpRight className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Mobile rewards layout */}
                    <div className="flex md:hidden flex-col gap-4 p-4 bg-[#272734] rounded-lg">
                        <div className="space-y-1">
                            <div className="text-sm text-white">Claim Earned Staking Rewards</div>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger className="text-[#A0AEC0] hover:text-[#B0BED0] text-xs">
                                        What is Sablier?
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">Every month, you can claim your staking rewards through our partner Sablier and vest your esMOLTEN into MOLTEN.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <Button 
                            variant="market"
                            className="flex items-center justify-center w-full gap-2"
                            onClick={() => window.open('https://app.sablier.com/airdrops/?t=eligible', '_blank')}
                        >
                            Claim Rewards
                            <ArrowUpRight className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            ) : (
                <CardContent>
                    <CardTitle className="text-white">Wallet not connected</CardTitle>
                </CardContent>
            )}
        </Card>
    )
}