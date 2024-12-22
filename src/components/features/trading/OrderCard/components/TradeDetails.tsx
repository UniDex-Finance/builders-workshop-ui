import React from "react";
import Image from "next/image";
import { TradeDetails as TradeDetailsType, RouteId, TradeDetailsProps } from "../types";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import * as HoverCard from '@radix-ui/react-hover-card';

export function TradeDetails({ 
  details, 
  pair, 
  tradingFee, 
  totalRequired, 
  referrerSection,
  routingInfo,
  splitOrderInfo,
  isLimitOrder = false 
}: TradeDetailsProps) {
  const { entryPrice, notionalSize, liquidationPrice, fees } = details;

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getRouteLogo = (routeId: RouteId) => {
    switch (routeId) {
      case 'gtrade':
        return '/static/images/gtrade.svg';
      case 'unidexv4':
        return '/static/images/logo-small.png';
      default:
        return '';
    }
  };

  const calculateWeightedTradingFeePercent = () => {
    if (splitOrderInfo?.unidex && splitOrderInfo?.gtrade) {
      const totalSize = splitOrderInfo.unidex.size + splitOrderInfo.gtrade.size;
      
      // Calculate actual fees
      const unidexFee = splitOrderInfo.unidex.size * (fees.tradingFeePercent / 100);
      const gtradeFee = splitOrderInfo.gtrade.size * (0.06 / 100);
      
      // Calculate effective rate
      const totalFee = unidexFee + gtradeFee;
      const effectiveRate = (totalFee / totalSize) * 100;
      
      return effectiveRate.toFixed(3);
    }

    return routingInfo.selectedRoute === 'gtrade' 
      ? '0.06'
      : fees.tradingFeePercent.toString();
  };

  const calculateTradingFee = () => {
    if (splitOrderInfo?.unidex && splitOrderInfo?.gtrade) {
      const unidexFee = splitOrderInfo.unidex.size * (fees.tradingFeePercent / 100);
      const gtradeFee = splitOrderInfo.gtrade.size * (0.06 / 100);
      return unidexFee + gtradeFee;
    }
    return tradingFee;
  };

  return (
    <div className="mt-4 space-y-2 text-[13px] text-muted-foreground">
      <div className="flex items-center justify-between">
        <HoverCard.Root openDelay={0} closeDelay={0}>
          <HoverCard.Trigger asChild>
            <span className="border-b border-dashed border-muted-foreground/50 cursor-help">
              Route
            </span>
          </HoverCard.Trigger>
          <HoverCard.Portal>
            <HoverCard.Content
              side="top"
              align="center"
              sideOffset={5}
              className="z-50 w-64 p-3 rounded-md shadow-lg border border-border/40 bg-[#17161d]/80 backdrop-blur-md text-[13px]"
            >
              <p>We do perp aggregation, so the route shows whos DEX is used to place this trade</p>
              <HoverCard.Arrow className="fill-[#17161d]/80" />
            </HoverCard.Content>
          </HoverCard.Portal>
        </HoverCard.Root>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                {!isLimitOrder && splitOrderInfo?.unidex && splitOrderInfo?.gtrade ? (
                  // Split order - show both logos with names
                  <>
                    <div className="flex items-center gap-1">
                      <Image 
                        src="/static/images/logo-small.png"
                        alt="UniDex"
                        width={16}
                        height={16}
                      />
                      <span className="text-sm text-primary">UniDex</span>
                    </div>
                    <span className="text-[#A0AEC0]">+</span>
                    <div className="flex items-center gap-1">
                      <Image 
                        src="/static/images/gtrade.svg"
                        alt="gTrade"
                        width={16}
                        height={16}
                      />
                      <span className="text-sm text-primary">gTrade</span>
                    </div>
                  </>
                ) : (
                  // Single route - show UniDex for limit orders
                  <div className="flex items-center gap-1">
                    <Image 
                      src="/static/images/logo-small.png"
                      alt="UniDex"
                      width={16}
                      height={16}
                    />
                    <span className="text-sm text-primary">
                      UniDex
                    </span>
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent className="p-2">
              {!isLimitOrder && splitOrderInfo?.unidex && splitOrderInfo?.gtrade ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <span>UniDex:</span>
                    <span>{splitOrderInfo.unidex.size.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>gTrade:</span>
                    <span>{splitOrderInfo.gtrade.size.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <span>UniDex</span>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex justify-between">
        <HoverCard.Root openDelay={0} closeDelay={0}>
          <HoverCard.Trigger asChild>
            <span className="border-b border-dashed border-muted-foreground/50 cursor-help">
              Entry Price
            </span>
          </HoverCard.Trigger>
          <HoverCard.Portal>
            <HoverCard.Content
              side="top"
              align="center"
              sideOffset={5}
              className="z-50 w-64 p-3 rounded-md shadow-lg border border-border/40 bg-[#17161d]/80 backdrop-blur-md text-[13px]"
            >
              <p>The estimated aggregate entry price for the position</p>
              <HoverCard.Arrow className="fill-[#17161d]/80" />
            </HoverCard.Content>
          </HoverCard.Portal>
        </HoverCard.Root>
        <span>${entryPrice ? formatNumber(parseFloat(entryPrice.toFixed(6))) : "0.00"}</span>
      </div>
      
      <div className="flex justify-between">
        <HoverCard.Root openDelay={0} closeDelay={0}>
          <HoverCard.Trigger asChild>
            <span className="border-b border-dashed border-muted-foreground/50 cursor-help">
              Notional Size
            </span>
          </HoverCard.Trigger>
          <HoverCard.Portal>
            <HoverCard.Content
              side="top"
              align="center"
              sideOffset={5}
              className="z-50 w-64 p-3 rounded-md shadow-lg border border-border/40 bg-[#17161d]/80 backdrop-blur-md text-[13px]"
            >
              <p>The estimated size value in traded pairs units</p>
              <HoverCard.Arrow className="fill-[#17161d]/80" />
            </HoverCard.Content>
          </HoverCard.Portal>
        </HoverCard.Root>
        <span>
          {formatNumber(parseFloat(notionalSize.toFixed(4)))} {pair?.split("/")[0]}
        </span>
      </div>
      
      <div className="flex justify-between">
        <span>Liquidation Price</span>
        <span className="text-short">
          ${liquidationPrice ? formatNumber(parseFloat(liquidationPrice.toFixed(6))) : "0.00"}
        </span>
      </div>
      
      <div className="flex justify-between">
        <span>Trading Fee</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">
                {calculateTradingFee().toFixed(2)} USDC ({calculateWeightedTradingFeePercent()}%)
              </span>
            </TooltipTrigger>
            <TooltipContent className="p-2">
              {splitOrderInfo?.unidex && splitOrderInfo?.gtrade ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <span>UniDex ({(splitOrderInfo.unidex.size / (splitOrderInfo.unidex.size + splitOrderInfo.gtrade.size) * 100).toFixed(0)}%):</span>
                    <span>{fees.tradingFeePercent}%</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>gTrade ({(splitOrderInfo.gtrade.size / (splitOrderInfo.unidex.size + splitOrderInfo.gtrade.size) * 100).toFixed(0)}%):</span>
                    <span>0.06%</span>
                  </div>
                  <div className="pt-1 mt-1 border-t border-[#404040]">
                    <div className="flex items-center justify-between gap-4">
                      <span>Combined:</span>
                      <span>{calculateWeightedTradingFeePercent()}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <span>
                  {routingInfo.selectedRoute === 'gtrade' ? 'gTrade' : 'UniDex'} Fee: {calculateWeightedTradingFeePercent()}%
                </span>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="flex justify-between">
        <HoverCard.Root openDelay={0} closeDelay={0}>
          <HoverCard.Trigger asChild>
            <span className="border-b border-dashed border-muted-foreground/50 cursor-help">
              Hourly Interest
            </span>
          </HoverCard.Trigger>
          <HoverCard.Portal>
            <HoverCard.Content
              side="top"
              align="center"
              sideOffset={5}
              className="z-50 w-64 p-3 rounded-md shadow-lg border border-border/40 bg-[#17161d]/80 backdrop-blur-md text-[13px]"
            >
              <p>The estimated hourly payment for this position by combining the borrow fee and funding rate in USD</p>
              <HoverCard.Arrow className="fill-[#17161d]/80" />
            </HoverCard.Content>
          </HoverCard.Portal>
        </HoverCard.Root>
        <span className={fees.hourlyInterest >= 0 ? "text-short" : "text-long"}>
          {fees.hourlyInterest >= 0 ? "-" : "+"}$
          {formatNumber(Math.abs(parseFloat(fees.hourlyInterest.toFixed(2))))} (
          {Math.abs(fees.hourlyInterestPercent).toFixed(4)}%)
        </span>
      </div>
      
      <div className="flex justify-between">
        <HoverCard.Root openDelay={0} closeDelay={0}>
          <HoverCard.Trigger asChild>
            <span className="border-b border-dashed border-muted-foreground/50 cursor-help">
              Total Required
            </span>
          </HoverCard.Trigger>
          <HoverCard.Portal>
            <HoverCard.Content
              side="top"
              align="center"
              sideOffset={5}
              className="z-50 w-64 p-3 rounded-md shadow-lg border border-border/40 bg-[#17161d]/80 backdrop-blur-md text-[13px]"
            >
              <p>The amount of balance needed to open this trade</p>
              <HoverCard.Arrow className="fill-[#17161d]/80" />
            </HoverCard.Content>
          </HoverCard.Portal>
        </HoverCard.Root>
        <span>{totalRequired.toFixed(2)} USDC</span>
      </div>
      
      {referrerSection}
    </div>
  );
}