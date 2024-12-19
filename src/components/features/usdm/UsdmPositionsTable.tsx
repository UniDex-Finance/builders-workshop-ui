import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePlatformPositions } from "@/hooks/use-platform-positions"
import { ArrowUpDown } from "lucide-react"
import { useState } from "react"
import { usePairPrecision } from "@/hooks/use-pair-precision"
import { calculateLiquidationPrice } from "@/lib/position-utils"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

type SortField = 'size' | 'margin' | 'pnl' | 'funding'
type SortDirection = 'asc' | 'desc'

export function UsdmPositionsTable() {
  const { data: positions, isLoading } = usePlatformPositions()
  const { formatPairPrice } = usePairPrecision()
  const [sortField, setSortField] = useState<SortField>('size')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const cleanNumberString = (str: string) => parseFloat(str.replace(/[$,]/g, ''))

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedPositions = positions?.slice().sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1

    switch (sortField) {
      case 'size':
        return (cleanNumberString(a.positionValue) - cleanNumberString(b.positionValue)) * multiplier
      case 'margin':
        return (cleanNumberString(a.margin) - cleanNumberString(b.margin)) * multiplier
      case 'pnl':
        return (cleanNumberString(a.pnl.value) - cleanNumberString(b.pnl.value)) * multiplier
      case 'funding':
        return (cleanNumberString(a.funding.value) - cleanNumberString(b.funding.value)) * multiplier
      default:
        return 0
    }
  })

  const SortableHeader = ({ field, children, align = 'right' }: { 
    field: SortField, 
    children: React.ReactNode,
    align?: 'left' | 'right'
  }) => (
    <th 
      className={`px-3 py-2 font-medium cursor-pointer group ${
        align === 'left' ? 'text-left' : 'text-right'
      }`} 
      onClick={() => handleSort(field)}
    >
      <div className={`flex items-center gap-1 ${
        align === 'left' ? 'justify-start' : 'justify-end'
      }`}>
        {children}
        <ArrowUpDown className={`h-3 w-3 transition-opacity ${
          sortField === field ? 'text-white opacity-50' : 'opacity-0 group-hover:opacity-25'
        }`} />
      </div>
    </th>
  )

  const getLiquidationColor = (pnlPercentage: number) => {
    if (pnlPercentage >= 0) return 'text-white'
    const loss = Math.abs(pnlPercentage)
    if (loss <= 50) return 'text-white'
    if (loss <= 66) return 'text-yellow-400'
    if (loss <= 75) return 'text-orange-400'
    return 'text-short'
  }

  return (
    <TooltipProvider>
      <Card className="bg-[#16161D] border-[#1b1b22]">
        <CardHeader className="py-3">
          <CardTitle className="text-base">Active Positions</CardTitle>
        </CardHeader>
        <CardContent className="py-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[#A0AEC0] border-b border-[#272734]">
                  <th className="px-3 py-2 font-medium text-left">Coin</th>
                  <SortableHeader field="size" align="left">Size</SortableHeader>
                  <SortableHeader field="margin" align="left">Margin</SortableHeader>
                  <th className="px-3 py-2 font-medium text-right">Entry Price</th>
                  <th className="px-3 py-2 font-medium text-right">Mark Price</th>
                  <SortableHeader field="pnl">PNL (ROE %)</SortableHeader>
                  <th className="px-3 py-2 font-medium text-right">Liq. Price</th>
                  <SortableHeader field="funding">Interest</SortableHeader>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-2 text-center text-[#A0AEC0]">
                      Loading positions...
                    </td>
                  </tr>
                ) : sortedPositions?.map((position, index) => {
                  const liqPrice = calculateLiquidationPrice({
                    isLong: position.isLong,
                    entryPrice: parseFloat(position.entryPrice),
                    leverage: cleanNumberString(position.positionValue) / cleanNumberString(position.margin),
                    marginValue: cleanNumberString(position.margin)
                  })

                  const currentPnlPct = parseFloat(position.pnl.percentage.replace('%', ''))
                  
                  const priceMovementNeeded = Math.abs(
                    ((liqPrice - parseFloat(position.markPrice)) / parseFloat(position.markPrice)) * 100
                  ).toFixed(2)

                  return (
                    <tr key={index} className="border-b border-[#272734] hover:bg-[#272734] transition-colors">
                      <td className={`px-3 py-2 ${
                        position.isLong ? 'text-long' : 'text-short'
                      }`}>
                        {position.coin}
                      </td>
                      <td className="px-3 py-2">
                        ${position.positionValue}
                      </td>
                      <td className="px-3 py-2 text-left">{position.margin}</td>
                      <td className="px-3 py-2 text-right">
                        ${formatPairPrice(position.pair, parseFloat(position.entryPrice))}
                      </td>
                      <td className="px-3 py-2 text-right">
                        ${formatPairPrice(position.pair, parseFloat(position.markPrice))}
                      </td>
                      <td className={`px-3 py-2 text-right ${
                        position.pnl.value.startsWith('-') ? 'text-short' : 'text-long'
                      }`}>
                        {position.pnl.value} ({position.pnl.percentage})
                      </td>
                      <td className="px-3 py-2 text-right"> 
                        <Tooltip>
                          <TooltipTrigger className={`${getLiquidationColor(currentPnlPct)}`}>
                            ${formatPairPrice(position.pair, liqPrice)}
                          </TooltipTrigger>
                          <TooltipContent>
                            {priceMovementNeeded}% price movement needed for liquidation
                          </TooltipContent>
                        </Tooltip>
                      </td>
                      <td className={`px-3 py-2 text-right ${
                        position.funding.isNegative ? 'text-short' : 'text-long'
                      }`}>
                        {position.funding.value}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
} 