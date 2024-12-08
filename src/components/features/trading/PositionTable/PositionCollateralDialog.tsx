"use client"

import { useState } from "react"
import { Button } from "../../../ui/button"
import { Card, CardContent, CardHeader } from "../../../ui/card"
import { Tabs, TabsList, TabsTrigger } from "../../../ui/tabs"
import { Input } from "../../../ui/input"
import { Dialog, DialogContent } from "../../../ui/dialog"
import { Position } from "../../../../hooks/use-positions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { usePositionActions } from "@/hooks/unidex-hooks/use-position-actions"

interface PositionCollateralDialogProps {
  position: Position | null
  isOpen: boolean
  onClose: () => void
}

export function PositionCollateralDialog({
  position,
  isOpen,
  onClose,
}: PositionCollateralDialogProps) {
  const [collateralAmount, setCollateralAmount] = useState<string>("")
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("withdraw")
  const { modifyCollateral, modifyingCollateral } = usePositionActions()
  
  if (!position) return null
  
  // Helper functions
  const getNumericValue = (value: string) => {
    return parseFloat(value.replace(/[^0-9.-]/g, ""))
  }

  const calculateLeverage = (size: string, margin: string) => {
    const sizeValue = getNumericValue(size)
    const marginValue = getNumericValue(margin)
    return (sizeValue / marginValue).toFixed(1)
  }

  // Current position values
  const currentMargin = getNumericValue(position.margin)
  const currentLeverage = calculateLeverage(position.size, position.margin)
  
  // Calculate new values based on input
  const collateralChange = collateralAmount ? parseFloat(collateralAmount) : 0
  const newMargin = activeTab === "deposit" 
    ? currentMargin + collateralChange 
    : currentMargin - collateralChange
  
  const positionSize = getNumericValue(position.size)
  const newLeverage = (positionSize / newMargin).toFixed(1)
  
  // Calculate new liquidation price
  const currentLiqPrice = parseFloat(position.liquidationPrice)
  const entryPrice = parseFloat(position.entryPrice)
  const liquidationThreshold = position.isLong ? 0.9 : 1.1
  
  const calculateNewLiquidationPrice = () => {
    if (!collateralAmount) return currentLiqPrice
    
    const leverageRatio = positionSize / newMargin
    if (position.isLong) {
      return entryPrice * (1 - (1 / leverageRatio) * liquidationThreshold)
    } else {
      return entryPrice * (1 + (1 / leverageRatio) * liquidationThreshold)
    }
  }

  const newLiquidationPrice = calculateNewLiquidationPrice()

  // Validation functions
  const isLeverageWithinLimits = (): boolean => {
    if (!collateralAmount) return true
    const leverageValue = parseFloat(newLeverage)
    
    if (activeTab === "withdraw") {
      return leverageValue <= 100
    } else {
      return leverageValue >= 1.1
    }
  }

  const getValidationMessage = (): string | null => {
    if (!collateralAmount) return null
    const leverageValue = parseFloat(newLeverage)
    
    if (activeTab === "withdraw") {
      if (collateralChange >= currentMargin) {
        return "Cannot withdraw entire collateral"
      }
      if (leverageValue > 100) {
        return "Cannot increase leverage above 100x"
      }
    } else {
      if (leverageValue < 1.1) {
        return "Cannot decrease leverage below 1.1x"
      }
    }
    return null
  }

  const handleMaxClick = () => {
    if (activeTab === "withdraw") {
      // Calculate max withdrawal while maintaining leverage <= 100x
      const minMarginFor100x = positionSize / 100
      const maxWithdrawable = currentMargin - minMarginFor100x
      const safeMaxWithdraw = Math.min(maxWithdrawable, currentMargin * 0.95)
      setCollateralAmount(Math.max(0, safeMaxWithdraw).toFixed(2))
    } else {
      // Calculate max deposit to maintain leverage >= 1.1x
      const maxMarginFor1_1x = positionSize / 1.1
      const maxDeposit = maxMarginFor1_1x - currentMargin
      setCollateralAmount(Math.max(0, maxDeposit).toFixed(2))
    }
  }

  const handleSubmit = async () => {
    if (!position || !collateralAmount || parseFloat(collateralAmount) <= 0) return;
    
    const positionId = parseInt(position.positionId);
    const amount = parseFloat(collateralAmount);
    const isAdd = activeTab === "deposit";

    try {
      await modifyCollateral(positionId, amount, isAdd);
      onClose();
      setCollateralAmount("");
    } catch (error) {
      console.error("Failed to modify collateral:", error);
    }
  };

  const validationMessage = getValidationMessage()
  const isValid = isLeverageWithinLimits() && !validationMessage
  const isLoading = modifyingCollateral[parseInt(position.positionId)]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 border-0 sm:max-w-md bg-[#17161d]">
        <Card className="w-full border-0 shadow-lg bg-[#17161d]">
          <CardHeader className="flex flex-row items-center p-4 space-x-0 border-b border-zinc-800">
            <div className="flex-1 font-medium text-center text-white">Edit Margin</div>
          </CardHeader>
          <Tabs value={activeTab} onValueChange={(v) => {
            setActiveTab(v as "deposit" | "withdraw")
            setCollateralAmount("") // Reset amount when switching tabs
          }} className="w-full">
            <TabsList className="w-full h-12 bg-transparent border-b rounded-none border-zinc-800">
              <TabsTrigger
                value="deposit"
                className="w-full rounded-none data-[state=active]:bg-transparent data-[state=active]:text-white"
              >
                Deposit
              </TabsTrigger>
              <TabsTrigger
                value="withdraw"
                className="w-full rounded-none data-[state=active]:bg-transparent data-[state=active]:text-white"
              >
                Withdraw
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <CardContent className="p-4 space-y-4">
            {validationMessage && (
              <Alert variant="destructive" className="py-2 border-red-900/20 bg-red-900/10">
                <AlertDescription className="text-sm text-red-400">
                  {validationMessage}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-3">
              <div className="relative">
                <div className="flex items-center h-12 px-4 border rounded-lg border-zinc-800 focus-within:border-zinc-700 bg-zinc-900/50">
                  <span className="text-zinc-400">Collateral</span>
                  <input
                    type="number"
                    value={collateralAmount}
                    onChange={(e) => setCollateralAmount(e.target.value)}
                    className="flex-1 text-right bg-transparent outline-none text-zinc-100"
                    placeholder="0.00"
                  />
                  <button
                    onClick={handleMaxClick}
                    className="px-2 ml-2 text-xs text-zinc-500 hover:text-white"
                  >
                    MAX
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-zinc-400">Leverage</div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <span>{currentLeverage}x</span>
                  {collateralAmount && (
                    <>
                      <span className="text-zinc-600">→</span>
                      <span className={`${
                        parseFloat(newLeverage) > parseFloat(currentLeverage) 
                          ? "text-red-400" 
                          : "text-emerald-400"
                      } ${!isValid ? "opacity-50" : ""}`}>
                        {newLeverage}x
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-zinc-400">Collateral</div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <span>{currentMargin.toFixed(2)}</span>
                  {collateralAmount && (
                    <>
                      <span className="text-zinc-600">→</span>
                      <span className={`${
                        newMargin > currentMargin 
                          ? "text-emerald-400" 
                          : "text-red-400"
                      } ${!isValid ? "opacity-50" : ""}`}>
                        {newMargin.toFixed(2)} USD
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-zinc-400">Fee</div>
                <div className="text-zinc-300">
                  {collateralAmount ? (parseFloat(collateralAmount) * 0.001).toFixed(4) : "0.00"} USD
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-zinc-400">Current Price</div>
                <div className="text-zinc-300">{position.entryPrice}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-zinc-400">Liq. Price</div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <span className="text-red-400">{currentLiqPrice}</span>
                  {collateralAmount && (
                    <>
                      <span className="text-zinc-600">→</span>
                      <span className={`${
                        newLiquidationPrice > currentLiqPrice 
                          ? "text-red-400" 
                          : "text-emerald-400"
                      } ${!isValid ? "opacity-50" : ""}`}>
                        {newLiquidationPrice.toFixed(2)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-zinc-400">{activeTab === "withdraw" ? "Receive" : "Pay"}</div>
                <div className="text-zinc-300">
                  {collateralAmount ? `${collateralAmount} USD` : "0.00 USD"}
                </div>
              </div>
            </div>
            <Button 
              className="w-full text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              disabled={!collateralAmount || parseFloat(collateralAmount) <= 0 || !isValid || isLoading}
              onClick={handleSubmit}
            >
              {isLoading ? (
                "Processing..."
              ) : (
                activeTab === "withdraw" 
                  ? `Withdraw ${collateralAmount || "0"} USD`
                  : `Deposit ${collateralAmount || "0"} USD`
              )}
            </Button>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}