import React from "react";
import Image from "next/image";
import { TradeDetails as TradeDetailsType, RouteId, TradeDetailsProps } from "../types";

export function TradeDetails({ 
  details, 
  pair, 
  tradingFee, 
  totalRequired, 
  referrerSection,
  routingInfo 
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

  return (
    <div className="mt-4 space-y-2 text-sm text-muted-foreground">
      <div className="flex items-center justify-between">
        <span>Route</span>
        <div className="flex items-center gap-1.5">
          <Image 
            src={getRouteLogo(routingInfo.selectedRoute)}
            alt={routingInfo.routeNames[routingInfo.selectedRoute]}
            width={16}
            height={16}
          />
          <span className="text-primary">
            {routingInfo.routeNames[routingInfo.selectedRoute]}
          </span>
        </div>
      </div>

      <div className="flex justify-between">
        <span>Entry Price</span>
        <span>${entryPrice ? formatNumber(parseFloat(entryPrice.toFixed(6))) : "0.00"}</span>
      </div>
      
      <div className="flex justify-between">
        <span>Notional Size</span>
        <span>
          {formatNumber(parseFloat(notionalSize.toFixed(4)))} {pair?.split("/")[0]}
        </span>
      </div>
      
      <div className="flex justify-between">
        <span>Liquidation Price</span>
        <span className="text-red-500">
          ${liquidationPrice ? formatNumber(parseFloat(liquidationPrice.toFixed(6))) : "0.00"}
        </span>
      </div>
      
      <div className="flex justify-between">
        <span>Trading Fee</span>
        <span>
          {tradingFee.toFixed(2)} USDC ({
            routingInfo.selectedRoute === 'gtrade' 
              ? '0.06' // gTrade's fixed fee percentage
              : (fees.tradingFeePercent) // Unidex fee percentage
          }%)
        </span>
      </div>
      
      <div className="flex justify-between">
        <span>Hourly Interest</span>
        <span className={fees.hourlyInterest >= 0 ? "text-red-400" : "text-green-400"}>
          {fees.hourlyInterest >= 0 ? "-" : "+"}$
          {formatNumber(Math.abs(parseFloat(fees.hourlyInterest.toFixed(2))))} (
          {Math.abs(fees.hourlyInterestPercent).toFixed(4)}%)
        </span>
      </div>
      
      <div className="flex justify-between">
        <span>Total Required</span>
        <span>{totalRequired.toFixed(2)} USDC</span>
      </div>
      
      {referrerSection}
    </div>
  );
}