import React from "react";
import Image from "next/image";
import { TradeDetails as TradeDetailsType, RouteId, TradeDetailsProps } from "../types";

export const TradeDetails = React.memo(function TradeDetails({ 
  details, 
  pair, 
  tradingFee, 
  totalRequired, 
  referrerSection,
  routingInfo 
}: TradeDetailsProps) {
  const { entryPrice, notionalSize, liquidationPrice, fees } = details;

  const formatNumber = React.useCallback((value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  }, []);

  const getRouteLogo = React.useCallback((routeId: RouteId) => {
    switch (routeId) {
      case 'gtrade':
        return '/static/images/gtrade.svg';
      case 'unidexv4':
        return '/static/images/logo-small.png';
      default:
        return '';
    }
  }, []);

  const formattedValues = React.useMemo(() => ({
    entryPrice: entryPrice ? formatNumber(parseFloat(entryPrice.toFixed(6))) : "0.00",
    notionalSize: formatNumber(parseFloat(notionalSize.toFixed(4))),
    liquidationPrice: liquidationPrice ? formatNumber(parseFloat(liquidationPrice.toFixed(6))) : "0.00",
    tradingFee: tradingFee.toFixed(2),
    hourlyInterest: formatNumber(Math.abs(parseFloat(fees.hourlyInterest.toFixed(2)))),
    totalRequired: totalRequired.toFixed(2)
  }), [details, tradingFee, totalRequired, formatNumber]);

  return (
    <div className="mt-4 space-y-2 text-[13px] text-muted-foreground">
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
        <span>${formattedValues.entryPrice}</span>
      </div>
      
      <div className="flex justify-between">
        <span>Notional Size</span>
        <span>
          {formattedValues.notionalSize} {pair?.split("/")[0]}
        </span>
      </div>
      
      <div className="flex justify-between">
        <span>Liquidation Price</span>
        <span className="text-red-500">
          ${formattedValues.liquidationPrice}
        </span>
      </div>
      
      <div className="flex justify-between">
        <span>Trading Fee</span>
        <span>
          {formattedValues.tradingFee} USDC ({
            routingInfo.selectedRoute === 'gtrade' 
              ? '0.06' 
              : (fees.tradingFeePercent)
          }%)
        </span>
      </div>
      
      <div className="flex justify-between">
        <span>Hourly Interest</span>
        <span className={fees.hourlyInterest >= 0 ? "text-red-400" : "text-green-400"}>
          {fees.hourlyInterest >= 0 ? "-" : "+"}$
          {formattedValues.hourlyInterest} (
          {Math.abs(fees.hourlyInterestPercent).toFixed(4)}%)
        </span>
      </div>
      
      <div className="flex justify-between">
        <span>Total Required</span>
        <span>{formattedValues.totalRequired} USDC</span>
      </div>
      
      {referrerSection}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.details === nextProps.details &&
    prevProps.pair === nextProps.pair &&
    prevProps.tradingFee === nextProps.tradingFee &&
    prevProps.totalRequired === nextProps.totalRequired &&
    prevProps.routingInfo === nextProps.routingInfo
  );
});