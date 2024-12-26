'use client'

import { useState } from "react"
import { Header } from "../../shared/Header"
import { PositionCard } from "./PositionCard"
import { ActionsCard } from "./ActionsCard"
import { StatsBar } from "./StatsBar"
import { StatsActions } from "./StatsActions"
import { StatsDisplay } from "./StatsDisplay"

export function StakingMOLTEN() {
  const [isStaking, setIsStaking] = useState(false)
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground ">
      <Header />
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2" />
            <h1 className="text-2xl font-semibold text-white">MOLTEN Staking</h1>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <StatsDisplay />
              <PositionCard />
            </div>

            <div className="space-y-6">
              <StatsActions />
              <ActionsCard isStaking={isStaking} setIsStaking={setIsStaking} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}