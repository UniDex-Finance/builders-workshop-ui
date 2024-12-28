import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UsdmPositionsTable } from "./UsdmPositionsTable"
import { UsdmAssetBreakdown } from "./UsdmAssetBreakdown"

export function UsdmDashboard() {
  return (
    <Card className="bg-[#16161D] border-[#1b1b22] text-white">
      <Tabs defaultValue="assets" className="w-full">
        <TabsList className="w-full bg-[#272734] rounded-t-xl rounded-b-none border-b border-[#1b1b22] p-0">
          <TabsTrigger 
            value="assets" 
            className="flex-1 data-[state=active]:bg-[#1f1f29] rounded-none"
          >
            Asset Type Breakdown
          </TabsTrigger>
          <TabsTrigger 
            value="positions" 
            className="flex-1 data-[state=active]:bg-[#1f1f29] rounded-none"
          >
            Active Positions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="m-0">
          <UsdmAssetBreakdown />
        </TabsContent>

        <TabsContent value="positions" className="m-0">
          <UsdmPositionsTable />
        </TabsContent>
      </Tabs>
    </Card>
  )
} 