'use client'

import { useState, useEffect } from "react"
import { Header } from "../../shared/Header"
import { Card } from "../../ui/card"
import { Button } from "../../ui/button"
import { Trophy, Target, Gift, TrendingUp, DollarSign, Zap, Sparkles, Flame, Box, Coins, Info } from 'lucide-react'
import { Progress } from "../../ui/progress"
import { Badge } from "../../ui/badge"

interface LootboxReward {
  amount: number
  tier: string
  color: string
  probability: number
}

interface OpenedReward extends LootboxReward {
  roll: number
  timestamp: Date
}

export function XPTrackerDashboard() {
  // Placeholder data - will be replaced with real data later
  const [userXP] = useState(2750)
  const [currentLevel] = useState(5)
  const [nextLevelXP] = useState(3000)
  const [totalXPEarned] = useState(12750)
  const [availableLootboxes, setAvailableLootboxes] = useState(3) // User has 3 unopened lootboxes
  const [recentRewards, setRecentRewards] = useState<OpenedReward[]>([])
  const [totalEarnings, setTotalEarnings] = useState(127) // Total money earned from lootboxes
  const [isOpening, setIsOpening] = useState(false)
  
  const xpProgress = (userXP / nextLevelXP) * 100
  const xpToNextLevel = nextLevelXP - userXP

  // Lootbox reward tiers with cumulative probabilities
  const rewardTiers: LootboxReward[] = [
    { amount: 500, tier: "Gold", color: "from-yellow-400 to-yellow-600", probability: 0.26 },
    { amount: 100, tier: "Red", color: "from-red-400 to-red-600", probability: 0.90 },
    { amount: 15, tier: "Pink", color: "from-pink-400 to-pink-600", probability: 4.10 },
    { amount: 5, tier: "Purple", color: "from-purple-400 to-purple-600", probability: 20.08 },
    { amount: 1, tier: "Blue", color: "from-blue-400 to-blue-600", probability: 100.00 },
  ]

  // XP earning methods
  const xpMethods = [
    { icon: TrendingUp, title: "Trading Volume", description: "Earn 1 XP per $100 traded", color: "text-green-400" },
    { icon: DollarSign, title: "Fees Paid", description: "Earn 2 XP per $1 in fees", color: "text-blue-400" },
    { icon: Flame, title: "Win Streaks", description: "Bonus XP for consecutive wins", color: "text-orange-400" },
    { icon: Sparkles, title: "Pool Deposits", description: "Earn 5 XP per $100 deposited daily", color: "text-purple-400" },
    { icon: Gift, title: "Daily Check In", description: "Earn 50 XP for logging in daily", color: "text-cyan-400" },
    { icon: Zap, title: "XP Boosts", description: "Temporary multipliers for faster progress", color: "text-yellow-400" },
  ]

  const openLootbox = () => {
    if (availableLootboxes <= 0 || isOpening) return
    
    setIsOpening(true)
    
    // Simulate opening animation delay
    setTimeout(() => {
      const roll = Math.random() * 100
      let reward: LootboxReward | null = null
      
      // Determine reward based on roll
      for (const tier of rewardTiers) {
        if (roll <= tier.probability) {
          reward = tier
          break
        }
      }
      
      if (reward) {
        const openedReward: OpenedReward = {
          ...reward,
          roll,
          timestamp: new Date()
        }
        
        setRecentRewards(prev => [openedReward, ...prev.slice(0, 4)]) // Keep last 5 rewards
        setTotalEarnings(prev => prev + reward.amount)
        setAvailableLootboxes(prev => prev - 1)
      }
      
      setIsOpening(false)
    }, 2000)
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">XP Tracker</h1>
            <p className="text-gray-400">
              Level up to earn lootboxes with cash rewards up to <span className="text-yellow-400 font-bold">$500</span>!
            </p>
          </div>

          {/* Main XP Progress Card */}
          <Card className="p-8 bg-[#1e1e20] border border-[#1b1b22] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                    Level {currentLevel}
                    <Trophy className="w-8 h-8 text-yellow-400" />
                  </h2>
                  <p className="text-gray-400 mt-1">Total XP Earned: {totalXPEarned.toLocaleString()}</p>
                  <p className="text-green-400 mt-1 font-semibold text-lg">Total Earnings: ${totalEarnings}</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {userXP.toLocaleString()} XP
                  </div>
                  <p className="text-sm text-gray-400">{xpToNextLevel} XP to next lootbox</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Progress to Level {currentLevel + 1}</span>
                  <span className="text-white font-medium">{xpProgress.toFixed(1)}%</span>
                </div>
                <div className="relative">
                  <Progress value={xpProgress} className="h-4 bg-[#2a2a2d]" />
                  <div className="absolute inset-0 h-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </Card>

          {/* Featured Rewards Showcase */}
          <Card className="p-6 bg-gradient-to-r from-yellow-900/20 via-red-900/20 to-purple-900/20 border border-yellow-500/30">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Potential Rewards & How to Earn</h3>
              <p className="text-gray-300">Every lootbox contains real money rewards</p>
            </div>
            
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Left Side: Potential Rewards */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 text-center">What You Can Win</h4>
                <div className="flex justify-center items-center gap-4 flex-wrap">
                  {/* Gold Tier - Most prominent */}
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 to-yellow-600/30 rounded-xl blur-xl group-hover:blur-2xl transition-all" />
                    <div className="relative bg-gradient-to-br from-yellow-900/40 to-yellow-700/40 rounded-xl p-6 border-2 border-yellow-400/50 transform group-hover:scale-105 transition-all">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-yellow-400 mb-2">$500</div>
                        <div className="text-yellow-300 text-sm font-medium">JACKPOT</div>
                      </div>
                      <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                        RARE
                      </div>
                    </div>
                  </div>

                  {/* Red Tier */}
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-red-600/20 rounded-xl blur-lg group-hover:blur-xl transition-all" />
                    <div className="relative bg-gradient-to-br from-red-900/40 to-red-700/40 rounded-xl p-4 border border-red-400/30 transform group-hover:scale-105 transition-all">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-400 mb-1">$100</div>
                        <div className="text-red-300 text-xs">HIGH</div>
                      </div>
                    </div>
                  </div>

                  {/* Pink Tier */}
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 to-pink-600/20 rounded-xl blur-lg group-hover:blur-xl transition-all" />
                    <div className="relative bg-gradient-to-br from-pink-900/40 to-pink-700/40 rounded-xl p-4 border border-pink-400/30 transform group-hover:scale-105 transition-all">
                      <div className="text-center">
                        <div className="text-xl font-bold text-pink-400 mb-1">$15</div>
                        <div className="text-pink-300 text-xs">MID</div>
                      </div>
                    </div>
                  </div>

                  {/* Lower tiers in smaller format */}
                  <div className="flex gap-3">
                    <div className="bg-gradient-to-br from-purple-900/30 to-purple-700/30 rounded-lg p-3 border border-purple-400/20">
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-400">$5</div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-900/30 to-blue-700/30 rounded-lg p-3 border border-blue-400/20">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-400">$1</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: How to Earn */}
              <div>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <h4 className="font-semibold text-white text-lg">How to Earn Lootboxes</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {xpMethods.map((method, index) => (
                    <div key={index} className="group relative">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1e1e20]/60 hover:bg-[#2a2a2d]/80 transition-all cursor-help border border-gray-700/30 hover:border-purple-500/30">
                        <method.icon className={`w-5 h-5 ${method.color}`} />
                        <div className="flex-1">
                          <span className="text-white text-sm font-medium">{method.title}</span>
                        </div>
                      </div>
                      <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {method.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Lootbox Opening Center */}
            <Card className="p-6 bg-[#1e1e20] border border-[#1b1b22]">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-white">Lootbox Center</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Open now or save for later
                    <span className="group relative inline-block ml-1 cursor-help">
                      <Info className="w-3 h-3 text-gray-500 inline" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        Future: Buy lootboxes with points
                      </div>
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Box className="w-5 h-5 text-purple-400" />
                  <span className="text-white font-semibold text-lg">{availableLootboxes}</span>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Opening Interface */}
                <div className="relative group cursor-pointer" onClick={openLootbox}>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg blur-xl group-hover:blur-2xl transition-all" />
                  <div className={`relative bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-lg p-12 border border-purple-500/20 ${isOpening ? 'animate-pulse' : ''}`}>
                    <div className="flex flex-col items-center text-center space-y-6">
                      <div className="relative">
                        <div className={`w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center ${isOpening ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`}>
                          <Box className="w-16 h-16 text-white" />
                        </div>
                        {availableLootboxes > 0 && (
                          <div className="absolute -top-3 -right-3 bg-green-400 text-black text-sm font-bold px-3 py-1 rounded-full">
                            {availableLootboxes}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-2xl font-semibold text-white mb-2">
                          {isOpening ? 'Opening...' : 'Mystery Lootbox'}
                        </h4>
                        <p className="text-gray-400">
                          {availableLootboxes > 0 ? 'Click to reveal your reward!' : 'Level up to earn more lootboxes'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={openLootbox}
                  disabled={availableLootboxes <= 0 || isOpening}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-lg py-6"
                >
                  {isOpening ? 'Opening...' : availableLootboxes > 0 ? `Open Lootbox (${availableLootboxes} available)` : 'No Lootboxes Available'}
                </Button>
              </div>
            </Card>

            {/* Recent Rewards - Expanded */}
            <Card className="p-6 bg-[#1e1e20] border border-[#1b1b22]">
              <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-400" />
                Recent Rewards
              </h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentRewards.length > 0 ? (
                  recentRewards.map((reward, index) => (
                    <div key={index} className="group relative">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-[#2a2a2d] hover:bg-[#323235] transition-all border border-[#3a3a3d] group-hover:border-purple-500/30">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${reward.color} flex items-center justify-center`}>
                            <Coins className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="text-white font-bold text-xl">${reward.amount}</div>
                            <div className="text-sm text-gray-400">{reward.tier} tier reward</div>
                            <div className="text-xs text-gray-500">
                              {reward.timestamp.toLocaleDateString()} at {reward.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            Roll: {reward.roll.toFixed(2)}
                          </div>
                          {reward.amount >= 100 && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 mt-1">
                              Big Win!
                            </Badge>
                          )}
                          {reward.amount >= 15 && reward.amount < 100 && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/50 mt-1">
                              Nice!
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-12">
                    <Box className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <h5 className="text-lg font-medium text-white mb-2">No rewards yet</h5>
                    <p className="text-sm">Open your first lootbox to see your winnings here!</p>
                    <div className="mt-6 p-4 bg-[#2a2a2d] rounded-lg border border-[#3a3a3d]">
                      <p className="text-xs text-gray-400">
                        💡 Tip: Start trading to earn XP and unlock lootboxes with cash rewards up to $500!
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {recentRewards.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Total from {recentRewards.length} recent rewards:</span>
                    <span className="text-green-400 font-bold text-lg">
                      ${recentRewards.reduce((sum, reward) => sum + reward.amount, 0)}
                    </span>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Call to Action */}
          <Card className="p-6 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-white">Start earning lootboxes today!</h3>
                <p className="text-gray-300 mt-1">Trade more, level up faster, win bigger rewards up to $500!</p>
              </div>
              <Button 
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg px-8 py-3"
                onClick={() => window.location.href = '/'}
              >
                Start Trading
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
} 