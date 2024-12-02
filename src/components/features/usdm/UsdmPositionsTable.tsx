import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePlatformPositions } from "@/hooks/use-platform-positions"
import { ArrowUpDown } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

type SortField = 'size' | 'margin' | 'pnl' | 'funding'
type SortDirection = 'asc' | 'desc'

export function UsdmPositionsTable() {
  const { data: positions, isLoading } = usePlatformPositions()
  const [sortField, setSortField] = useState<SortField>('size')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

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
        return (parseFloat(a.positionValue) - parseFloat(b.positionValue)) * multiplier
      case 'margin':
        return (parseFloat(a.margin.replace('$', '')) - parseFloat(b.margin.replace('$', ''))) * multiplier
      case 'pnl':
        return (parseFloat(a.pnl.value.replace(/[+$-]/g, '')) - parseFloat(b.pnl.value.replace(/[+$-]/g, ''))) * multiplier
      case 'funding':
        return (parseFloat(a.funding.value.replace('$', '')) - parseFloat(b.funding.value.replace('$', ''))) * multiplier
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

  return (
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
                <SortableHeader field="funding">Funding</SortableHeader>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-3 py-2 text-center text-[#A0AEC0]">
                    Loading positions...
                  </td>
                </tr>
              ) : sortedPositions?.map((position, index) => (
                <tr 
                  key={index}
                  className="border-b border-[#272734] hover:bg-[#272734] transition-colors"
                >
                  <td className={`px-3 py-2 ${
                    position.isLong ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {position.coin}
                  </td>
                  <td className="px-3 py-2">
                    ${position.positionValue}
                  </td>
                  <td className="px-3 py-2 text-left">{position.margin}</td>
                  <td className="px-3 py-2 text-right">
                    ${position.entryPrice}
                  </td>
                  <td className="px-3 py-2 text-right">
                    ${position.markPrice}
                  </td>
                  <td className={`px-3 py-2 text-right ${
                    position.pnl.value.startsWith('-') ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {position.pnl.value} ({position.pnl.percentage})
                  </td>
                  <td className="px-3 py-2 text-right">
                    ${position.liqPrice}
                  </td>
                  <td className={`px-3 py-2 text-right ${
                    position.funding.isNegative ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {position.funding.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
} 