'use client'

import { useState } from "react"
import { Header } from "../../shared/Header"
import { PositionCard } from "./PositionCard"
import { ActionsCard } from "./ActionsCard"
import { StatsActions } from "./StatsActions"
import { StatsDisplay } from "./StatsDisplay"
import { UsdmPositionsTable } from "./UsdmPositionsTable"
import { useBalances } from "@/hooks/use-balances"
import { type Balances } from "@/hooks/use-balances"

interface Props {
  balances: Balances | null
  isLoading: boolean
}

export function Usdm() {
  const [isStaking, setIsStaking] = useState(false)
  const { balances, isLoading, isError, refetchBalances } = useBalances('arbitrum')
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2" />
            <h1 className="text-2xl font-semibold text-foreground">USD.m Dashboard</h1>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <StatsDisplay balances={balances} isLoading={isLoading} />
              <PositionCard balances={balances} isLoading={isLoading} />
            </div>

            <div className="space-y-6">
              <StatsActions balances={balances} isLoading={isLoading} />
              <ActionsCard 
                isStaking={isStaking} 
                setIsStaking={setIsStaking}
                balances={balances}
                isLoading={isLoading}
                refetchBalances={refetchBalances}
              />
            </div>
          </div>

          <UsdmPositionsTable />
        </div>
      </div>
    </div>
  )
}