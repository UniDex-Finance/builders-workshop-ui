import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UsdmPositionsTable } from "./UsdmPositionsTable"
import { UsdmAssetBreakdown } from "./UsdmAssetBreakdown"
import { UsdmPerformanceChart } from "./UsdmPerformanceChart"
import { useIsMobile } from "@/hooks/use-mobile"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

const TABS = [
  { id: "assets", label: "Asset Type Breakdown" },
  { id: "performance", label: "USD.m Performance" },
  { id: "positions", label: "Active Positions" }
] as const

type TabId = typeof TABS[number]["id"]

export function UsdmDashboard() {
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState<TabId>("assets")

  const currentTabIndex = TABS.findIndex(tab => tab.id === activeTab)

  const handlePrevTab = () => {
    const prevIndex = currentTabIndex - 1
    if (prevIndex >= 0) {
      setActiveTab(TABS[prevIndex].id)
    }
  }

  const handleNextTab = () => {
    const nextIndex = currentTabIndex + 1
    if (nextIndex < TABS.length) {
      setActiveTab(TABS[nextIndex].id)
    }
  }

  return (
    <Card className="bg-[#16161D] border-[#1b1b22] text-white">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabId)} className="w-full">
        {!isMobile ? (
          <TabsList className="w-full bg-[#272734] rounded-t-xl rounded-b-none border-b border-[#1b1b22] p-0">
            {TABS.map(tab => (
              <TabsTrigger 
                key={tab.id}
                value={tab.id} 
                className="flex-1 data-[state=active]:bg-[#1f1f29] rounded-none"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        ) : (
          <div className="flex items-center justify-between px-4 py-3 bg-[#272734] rounded-t-xl border-b border-[#1b1b22]">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevTab}
              disabled={currentTabIndex === 0}
              className="text-white/70 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="text-sm font-medium">
              {TABS[currentTabIndex].label}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextTab}
              disabled={currentTabIndex === TABS.length - 1}
              className="text-white/70 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}

        <TabsContent value="assets" className="m-0">
          <UsdmAssetBreakdown />
        </TabsContent>

        <TabsContent value="performance" className="m-0">
          <UsdmPerformanceChart />
        </TabsContent>

        <TabsContent value="positions" className="m-0">
          <UsdmPositionsTable />
        </TabsContent>
      </Tabs>
    </Card>
  )
} 