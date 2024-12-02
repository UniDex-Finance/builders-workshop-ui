import { useQuery } from '@tanstack/react-query'

interface PlatformPosition {
  id: string
  user: string
  pair: string
  assetId: string
  size: string
  collateral: string
  averagePrice: string
  lastIncreasedTime: string
  isLong: boolean
  pnl: string
  fundingFee: string
  borrowFee: string
  markPrice: string
}

interface FormattedPosition {
  coin: string
  positionValue: string
  entryPrice: string
  isLong: boolean
  markPrice: string
  pnl: {
    value: string
    percentage: string
  }
  liqPrice: string
  margin: string
  funding: {
    value: string
    isNegative: boolean
  }
}

const calculateLiquidationPrice = (
  isLong: boolean,
  averagePrice: number,
  collateral: number,
  size: number,
) => {
  // Liquidation occurs at -90% PNL
  const maxLoss = collateral * 0.9
  const priceImpact = maxLoss / size

  if (isLong) {
    return (averagePrice - priceImpact).toFixed(4)
  } else {
    return (averagePrice + priceImpact).toFixed(4)
  }
}

const formatPosition = (position: PlatformPosition): FormattedPosition => {
  const sizeNum = parseFloat(position.size)
  const markPriceNum = parseFloat(position.markPrice)
  const collateralNum = parseFloat(position.collateral)
  const pnlNum = parseFloat(position.pnl)
  const fundingFeeNum = parseFloat(position.fundingFee)
  const borrowFeeNum = parseFloat(position.borrowFee)
  const averagePriceNum = parseFloat(position.averagePrice)

  const dollarSize = (sizeNum * markPriceNum).toFixed(2)
  const pnlPercentage = ((pnlNum / collateralNum) * 100).toFixed(2)
  
  // Calculate leverage as size/margin
  const leverage = Math.round(sizeNum / collateralNum)
  
  // Calculate total fees
  const totalFees = fundingFeeNum + borrowFeeNum

  return {
    coin: `${position.pair} ${leverage}×`,
    positionValue: position.size,
    entryPrice: position.averagePrice,
    markPrice: position.markPrice,
    isLong: position.isLong,
    pnl: {
      value: pnlNum >= 0 ? `+$${pnlNum.toFixed(2)}` : `-$${Math.abs(pnlNum).toFixed(2)}`,
      percentage: pnlNum >= 0 ? `+${pnlPercentage}%` : `-${Math.abs(parseFloat(pnlPercentage))}%`
    },
    liqPrice: calculateLiquidationPrice(
      position.isLong,
      averagePriceNum,
      collateralNum,
      sizeNum
    ),
    margin: `$${collateralNum.toFixed(2)}`,
    funding: {
      value: `$${Math.abs(totalFees).toFixed(2)}`,
      isNegative: totalFees < 0
    }
  }
}

export function usePlatformPositions() {
  return useQuery({
    queryKey: ['platform-positions'],
    queryFn: async () => {
      const response = await fetch('https://unidexv4-api-production.up.railway.app/api/platform-positions')
      const data: PlatformPosition[] = await response.json()
      return data.map(formatPosition)
    },
    refetchInterval: 15000, // Refetch every 15 seconds
  })
} 