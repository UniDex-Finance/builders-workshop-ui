export interface Market {
  assetId: string;
  pair: string;
  fundingRate: number;
  borrowRateForLong: number;
  borrowRateForShort: number;
  longOpenInterest: number;
  shortOpenInterest: number;
  maxLongOpenInterest: number;
  maxShortOpenInterest: number;
  longTradingFee: number;
  shortTradingFee: number;
  utilization: number;
  longShortRatio: {
    longPercentage: number;
    shortPercentage: number;
  };
  availableLiquidity: {
    long: number;
    short: number;
  };
}

// Basic order params
export interface OrderParams {
  pair: number;
  isLong: boolean;
  price: number;
  slippagePercent: number;
  margin: number;
  size: number;
  orderType: 'market' | 'limit';
  takeProfit?: string;
  stopLoss?: string;
  referrer?: string;
}

// Route related types
export type RouteId = 'unidexv4' | 'gtrade';

export interface RouteInfo {
  id: RouteId;
  name: string;
  tradingFee: number;
  available: boolean;
  minMargin: number;
  reason?: string;
}

export interface RoutingResult {
  bestRoute: RouteId;
  routes: Record<
    RouteId,
    {
      tradingFee: number;
      available: boolean;
      reason?: string;
    }
  >;
}

// Component Props and State types
export interface OrderCardProps {
  leverage: string;
  onLeverageChange: (value: string) => void;
  assetId: string;
  initialReferralCode?: string;
}

export interface TradeDetails {
  entryPrice: number | undefined;
  notionalSize: number;
  liquidationPrice: number | null;
  fees: {
    tradingFee: number;
    hourlyInterest: number;
    tradingFeePercent: number;
    hourlyInterestPercent: number;
  };
}

export interface OrderFormState {
  amount: string;
  limitPrice: string;
  sliderValue: number[];
  isLong: boolean;
  tpslEnabled: boolean;
  takeProfit: string;
  takeProfitPercentage: string;
  stopLoss: string;
  stopLossPercentage: string;
  entryPrice?: number;
}

export interface TradeDetailsProps {
  details: TradeDetails;
  pair?: string;
  tradingFee: number;
  totalRequired: number;
  referrerSection: React.ReactNode;
  routingInfo: RoutingInfo;
}

export interface RoutingInfo {
  selectedRoute: RouteId;
  routes: Record<
    RouteId,
    {
      minMargin: number;
      tradingFee: number;
      available: boolean;
      reason?: string;
    }
  >;
  routeNames: Record<RouteId, string>;
}
