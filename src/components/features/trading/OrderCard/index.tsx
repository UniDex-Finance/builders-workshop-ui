import React, { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "../../../ui/button";
import { Card, CardContent } from "../../../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../ui/tabs";
import { useSmartAccount } from "../../../../hooks/use-smart-account";
import { useMarketData } from "../../../../hooks/use-market-data";
import { usePrices } from "../../../../lib/websocket-price-context";
import { MarketOrderForm } from "./components/MarketOrderForm";
import { LimitOrderForm } from "./components/LimitOrderForm";
import { TradeDetails } from "./components/TradeDetails";
import { WalletBox } from "../WalletEquity";
import { useOrderForm } from "./hooks/useOrderForm";
import { useTradeCalculations } from "./hooks/useTradeCalculations";
import { OrderCardProps, RoutingInfo } from "./types";
import { useBalances } from "../../../../hooks/use-balances";
import { useReferralContract } from "../../../../hooks/use-referral-contract";
import { useRouting, RouteId } from '../../../../hooks/trading-hooks/use-routing';
import { toast } from "@/hooks/use-toast";
import { useLimitRouting } from '../../../../hooks/trading-hooks/use-limit-routing';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import CustomSlider from "@/components/ui/custom-slider";
import Image from "next/image";
import CustomLeverageSlider from "@/components/ui/custom-leverage-slider";

const DEFAULT_REFERRER = "0x0000000000000000000000000000000000000000";
const STORAGE_KEY_CODE = 'unidex-referral-code';
const STORAGE_KEY_ADDRESS = 'unidex-referral-address';

const SliderWithGlowStyles = () => (
  <style jsx global>{`
    .slider-with-glow .data-[state=active]:bg-primary {
      box-shadow: 0 0 10px 2px var(--color-primary-glow, rgba(124, 226, 172, 0.5));
    }
    
    .slider-with-glow[data-orientation=horizontal] .data-[state=active]:bg-primary {
      background: var(--color-primary, #7de2ac);
    }
    
    .slider-with-glow[data-orientation=horizontal] .data-[state=active]:bg-primary:active {
      box-shadow: 0 0 15px 3px var(--color-primary-glow, rgba(124, 226, 172, 0.7));
    }
  `}</style>
);

export function OrderCard({
  leverage,
  onLeverageChange,
  assetId,
  initialReferralCode,
}: OrderCardProps) {
  const { isConnected } = useAccount();
  const { smartAccount, setupSessionKey, error, isNetworkSwitching } = useSmartAccount();
  const [activeTab, setActiveTab] = useState("market");
  const { allMarkets } = useMarketData();
  const { prices } = usePrices();
  const { balances } = useBalances("arbitrum");
  const [referrerCode, setReferrerCode] = useState("");
  const { getReferralAddress } = useReferralContract();
  const [resolvedReferrer, setResolvedReferrer] = useState(DEFAULT_REFERRER);
  const [isEditingReferrer, setIsEditingReferrer] = useState(false);
  const referrerInputRef = useRef<HTMLInputElement>(null);
  const [tempReferrerCode, setTempReferrerCode] = useState("");
  const [placingOrders, setPlacingOrders] = useState(false);
  const [initialIsLong] = useState(true);
  const [leverageDialogOpen, setLeverageDialogOpen] = useState(false);
  const [tempLeverageValue, setTempLeverageValue] = useState(leverage);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const {
    formState,
    handleAmountChange,
    handleMarginChange,
    handleLimitPriceChange,
    handleSliderChange,
    toggleDirection,
    toggleTPSL,
    handleTakeProfitChange,
    handleStopLossChange,
    setFormState,
    isValid,
  } = useOrderForm({ 
    leverage,
    assetId,
    isLong: initialIsLong 
  });

  const { bestRoute, routes, executeOrder, splitOrderInfo } = useRouting(
    assetId,
    formState.amount,
    leverage,
    formState.isLong
  );

  const { executeLimitOrder } = useLimitRouting();

  const isValidRoutes = (routes: any): routes is Record<RouteId, { tradingFee: number; available: boolean; reason?: string; }> => {
    return routes !== undefined && routes !== null;
  };
  const routingInfo: RoutingInfo = {
    selectedRoute: bestRoute || 'unidexv4',
    routes: isValidRoutes(routes) ? routes : {
      unidexv4: {
        tradingFee: 0,
        available: true,
        minMargin: 1
      },
      gtrade: {
        tradingFee: 0,
        available: false,
        minMargin: 6,
        reason: "Route not available"
      }
    },
    routeNames: {
      unidexv4: 'UniDex',
      gtrade: 'gTrade'
    }
  };

  useEffect(() => {
    const initializeReferralCode = async () => {
      // First check URL parameter
      if (initialReferralCode) {
        const address = await getReferralAddress(initialReferralCode);
        if (address !== DEFAULT_REFERRER) {
          setReferrerCode(initialReferralCode);
          setTempReferrerCode(initialReferralCode);
          setResolvedReferrer(address);
          localStorage.setItem(STORAGE_KEY_CODE, initialReferralCode);
          localStorage.setItem(STORAGE_KEY_ADDRESS, address);
          return;
        }
      }

      // Fall back to stored code if no valid URL parameter
      const storedCode = localStorage.getItem(STORAGE_KEY_CODE);
      const storedAddress = localStorage.getItem(STORAGE_KEY_ADDRESS);
      
      if (storedCode) {
        setReferrerCode(storedCode);
        setTempReferrerCode(storedCode);
      }
      if (storedAddress) {
        setResolvedReferrer(storedAddress);
      }
    };

    initializeReferralCode();
  }, [initialReferralCode]);

  const calculatedMargin = formState.amount
    ? parseFloat(formState.amount) / parseFloat(leverage)
    : 0;

  const marginWalletBalance = parseFloat(balances?.formattedMusdBalance || "0");
  const onectWalletBalance = parseFloat(balances?.formattedUsdcBalance || "0");
  const combinedBalance = marginWalletBalance + onectWalletBalance;
  
  const calculatedSize = formState.amount ? parseFloat(formState.amount) : 0;
  const tradingFee = calculatedSize * (isValidRoutes(routes) && bestRoute ? routes[bestRoute].tradingFee : 0);
  const totalRequired = calculatedMargin + tradingFee;
  
  const hasInsufficientBalance = totalRequired > combinedBalance;
  
  const needsDeposit = activeTab === "market" && 
    routingInfo.selectedRoute === 'unidexv4' && 
    totalRequired > marginWalletBalance && 
    totalRequired <= combinedBalance;
  
  const needsWithdrawal = activeTab === "market" && 
    routingInfo.selectedRoute === 'gtrade' && 
    calculatedMargin > onectWalletBalance && 
    totalRequired <= combinedBalance;

  const tradeDetails = useTradeCalculations({
    amount: formState.amount,
    leverage,
    isLong: formState.isLong,
    activeTab,
    limitPrice: formState.limitPrice,
    assetId,
  });

  const market = allMarkets.find((m) => m.assetId === assetId);

  useEffect(() => {
    const pair = market?.pair;
    const basePair = pair?.split("/")[0].toLowerCase();
    const currentPrice = basePair ? prices[basePair]?.price : undefined;

    if (currentPrice) {
      setFormState((prev: any) => ({
        ...prev,
        entryPrice:
          activeTab === "market"
            ? currentPrice
            : activeTab === "limit" && formState.limitPrice
            ? Number(formState.limitPrice)
            : currentPrice,
      }));
    }
  }, [
    prices,
    assetId,
    allMarkets,
    activeTab,
    formState.limitPrice,
    setFormState,
  ]);

  const handleReferrerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempReferrerCode(e.target.value); // Only update the temporary value while typing
  };

  const handleReferrerClick = () => {
    setIsEditingReferrer(true);
    setTempReferrerCode(referrerCode); // Initialize temp code with current value
    setTimeout(() => referrerInputRef.current?.focus(), 0);
  };

  const handleReferrerBlur = async () => {
    setIsEditingReferrer(false);
    // Only validate and update when user is done editing
    if (tempReferrerCode) {
      const address = await getReferralAddress(tempReferrerCode);
      if (address === DEFAULT_REFERRER) {
        // Revert to previous valid code if it exists
        if (referrerCode) {
          setTempReferrerCode(referrerCode);
        } else {
          setTempReferrerCode("");
          setReferrerCode("");
          localStorage.removeItem(STORAGE_KEY_CODE);
          localStorage.removeItem(STORAGE_KEY_ADDRESS);
        }
      } else {
        setReferrerCode(tempReferrerCode);
        setResolvedReferrer(address);
        localStorage.setItem(STORAGE_KEY_CODE, tempReferrerCode);
        localStorage.setItem(STORAGE_KEY_ADDRESS, address);
      }
    } else {
      setReferrerCode("");
      setResolvedReferrer(DEFAULT_REFERRER);
      localStorage.removeItem(STORAGE_KEY_CODE);
      localStorage.removeItem(STORAGE_KEY_ADDRESS);
    }
  };

  const handleReferrerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur(); // Trigger blur event to validate
    }
  };

  useEffect(() => {
    if (referrerCode && resolvedReferrer === DEFAULT_REFERRER) {
      getReferralAddress(referrerCode).then(address => {
        if (address !== DEFAULT_REFERRER) {
          setResolvedReferrer(address);
          localStorage.setItem(STORAGE_KEY_ADDRESS, address);
        } else {
          // Clear invalid cached code
          setReferrerCode("");
          localStorage.removeItem(STORAGE_KEY_CODE);
          localStorage.removeItem(STORAGE_KEY_ADDRESS);
        }
      });
    }
  }, [referrerCode]);

  const shortenAddress = (address: string) => {
    if (address === DEFAULT_REFERRER) {
      return "Set Code";
    }
    // Always show the referral code if it exists
    return referrerCode || `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handlePlaceOrder = async () => {
    if (!isConnected || !smartAccount?.address) return;
  
    try {
      setPlacingOrders(true);
      
      // Round down the size to 2 decimal places
      const roundedSize = Math.floor(calculatedSize * 100) / 100;
      
      if (activeTab === "limit") {
        // Handle limit order
        const limitOrderParams = {
          pair: parseInt(assetId, 10),
          isLong: formState.isLong,
          price: Number(formState.limitPrice),
          margin: calculatedMargin,
          size: roundedSize,
          takeProfit: formState.tpslEnabled ? formState.takeProfit : "",
          stopLoss: formState.tpslEnabled ? formState.stopLoss : "",
          referrer: resolvedReferrer
        };

        await executeLimitOrder(limitOrderParams);
      } else {
        // Handle market order using existing routing logic
        const orderParams = {
          pair: parseInt(assetId, 10),
          isLong: formState.isLong,
          price: tradeDetails.entryPrice!,
          slippagePercent: 100,
          margin: calculatedMargin,
          size: roundedSize,
          orderType: activeTab as "market" | "limit",
          takeProfit: formState.tpslEnabled ? formState.takeProfit : undefined,
          stopLoss: formState.tpslEnabled ? formState.stopLoss : undefined,
          referrer: resolvedReferrer
        };
    
        await executeOrder(orderParams);
      }
  
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to place order",
        variant: "destructive",
      });
    } finally {
      setPlacingOrders(false);
    }
  };

  const getButtonText = () => {
    if (isNetworkSwitching) return "Switching to Arbitrum...";
    if (!smartAccount?.address) return "Establish Connection";
    if (activeTab === "market" && !tradeDetails.entryPrice)
      return "Waiting for price...";
    if (activeTab === "limit" && !formState.limitPrice)
      return "Enter Limit Price";
    if (placingOrders) return "Placing Order...";
    if (hasInsufficientBalance) return "Insufficient Balance";
    
    // Add specific validation for limit orders
    if (activeTab === "limit") {
      const market = allMarkets.find((m) => m.assetId === assetId);
      const availableLiquidity = formState.isLong
        ? market?.availableLiquidity?.long
        : market?.availableLiquidity?.short;

      if (calculatedMargin < 1) {
        return "Minimum Margin: 1 USD";
      }
      
      if (availableLiquidity !== undefined && calculatedSize > availableLiquidity) {
        return "Not Enough Liquidity";
      }

      return `Place Limit ${formState.isLong ? "Long" : "Short"}`;
    }

    // Market order validation - check based on available routes
    const minMargin = routingInfo.routes[routingInfo.selectedRoute].minMargin;
    if (calculatedMargin < minMargin) {
      return `Minimum Margin: ${minMargin} USD`;
    }

    // Check if we have any available route
    if (!routingInfo.routes.unidexv4.available && !routingInfo.routes.gtrade.available) {
      // Get reason for the selected route
      const reason = routingInfo.routes[routingInfo.selectedRoute].reason;
      if (reason && reason.includes("liquidity")) {
        return "Not Enough Liquidity";
      }
      return "No Available Route";
    }

    return `Place ${activeTab === "market" ? "Market" : "Limit"} ${
      formState.isLong ? "Long" : "Short"
    }`;
  };

  const handleButtonClick = () => {
    if (!smartAccount?.address && isConnected) {
      setupSessionKey();
    } else {
      handlePlaceOrder();
    }
  };

  const referrerSection = (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">Referrer</span>
      {isEditingReferrer ? (
        <input
          ref={referrerInputRef}
          type="text"
          value={tempReferrerCode}
          onChange={handleReferrerChange}
          onBlur={handleReferrerBlur}
          onKeyDown={handleReferrerKeyDown}
          placeholder="Enter code"
          className="text-right bg-transparent border-b border-dashed outline-none text-xs w-auto"
        />
      ) : (
        <span
          onClick={handleReferrerClick}
          className="cursor-pointer hover:text-primary"
        >
          {shortenAddress(resolvedReferrer)}
        </span>
      )}
    </div>
  );

  useEffect(() => {
    setTempLeverageValue(leverage);
  }, [leverage]);

  return (
    <Card className="w-full md:h-full md:rounded-none md:border-0 md:shadow-none">
      <SliderWithGlowStyles />
      <CardContent className="p-1 md:p-1 h-full overflow-y-auto border-t border-border">
        {error && (
          <div className="mb-1 p-1 text-xs text-short bg-red-500/10 rounded">Error: {error.message}</div>
        )}

        <div className="space-y-1">
          {/* Buy/Leverage/Sell buttons in one row */}
          <div className="grid grid-cols-3 gap-1 mb-1">
            <Button
              variant={formState.isLong ? "default" : "outline"}
              className={`w-full h-16 text-sm font-medium ${
                formState.isLong 
                  ? "bg-[var(--color-long)] hover:bg-[var(--color-long-dark)] text-black" 
                  : "bg-muted/50 hover:bg-muted border-0"
              }`}
              onClick={() => !formState.isLong && toggleDirection()}
            >
              Buy <span className="ml-1 text-xs">↗</span>
            </Button>
            
            {/* Leverage button in the middle */}
            <Dialog open={leverageDialogOpen} onOpenChange={setLeverageDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-16 flex flex-col justify-center items-center bg-muted/50 hover:bg-muted border-0"
                >
                  <span className="text-xs text-muted-foreground">Leverage</span>
                  <span className="text-lg font-medium">{leverage}x</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[350px]">
                <DialogHeader className="pb-0">
                  <DialogTitle>Adjust Leverage</DialogTitle>
                </DialogHeader>
                <div className="py-3">
                  <div className="touch-manipulation">
                    <div style={{ touchAction: "none", WebkitTapHighlightColor: "transparent" }}>
                      <CustomLeverageSlider
                        min={1}
                        max={100}
                        step={1}
                        value={Number(tempLeverageValue)}
                        onChange={(value) => setTempLeverageValue(value.toString())}
                        className="mt-0 h-12 touch-manipulation"
                      />
                    </div>
                  </div>
                  
                  {/* Add manual leverage input */}
                  <div className="flex items-center justify-between mt-4 mb-2">
                    <span className="text-sm font-medium">Leverage:</span>
                    <div className="flex items-center bg-muted/70 rounded-md px-2 w-24">
                      <input
                        type="number"
                        value={tempLeverageValue}
                        onChange={(e) => {
                          const value = Math.min(Math.max(1, parseInt(e.target.value) || 1), 100);
                          setTempLeverageValue(value.toString());
                        }}
                        min={1}
                        max={100}
                        inputMode="numeric"
                        readOnly={true}
                        onClick={(e) => {
                          (e.target as HTMLInputElement).readOnly = false;
                        }}
                        onBlur={(e) => {
                          (e.target as HTMLInputElement).readOnly = true;
                        }}
                        className="w-full text-right bg-transparent border-0 focus:outline-none py-1 text-sm"
                      />
                      <span className="ml-1 text-sm">x</span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <Button 
                      className="w-full"
                      onClick={() => {
                        onLeverageChange(tempLeverageValue);
                        setLeverageDialogOpen(false);
                      }}
                    >
                      Confirm Change
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button
              variant={!formState.isLong ? "default" : "outline"}
              className={`w-full h-16 text-sm font-medium ${
                !formState.isLong 
                  ? "bg-[var(--color-short)] hover:bg-[var(--color-short-dark)] text-white" 
                  : "bg-muted/50 hover:bg-muted border-0"
              }`}
              onClick={() => formState.isLong && toggleDirection()}
            >
              Sell <span className="ml-1 text-xs">↘</span>
            </Button>
          </div>
          
          {/* Estimated execution price and order type */}
          <div className="grid grid-cols-2 gap-1 mb-1">
            <div className="flex flex-col justify-between p-3 bg-muted/50 rounded-md h-16">
              <span className="text-xs text-muted-foreground">{activeTab === "market" ? "Execution Price" : "Limit Price"}</span>
              {activeTab === "market" ? (
                // Market mode - non-editable execution price
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {tradeDetails.entryPrice ? Number(tradeDetails.entryPrice.toFixed(2)).toLocaleString() : "0.00"}
                  </span>
                  <span className="text-xs text-muted-foreground">USD</span>
                </div>
              ) : (
                // Limit mode - editable limit price
                <div className="flex justify-between items-center w-full">
                  <input
                    type="text"
                    placeholder="0"
                    value={formState.limitPrice || ''}
                    onChange={handleLimitPriceChange}
                    className="w-3/4 h-7 px-0 border-0 text-sm font-medium bg-transparent focus:outline-none"
                    suppressHydrationWarning
                  />
                  <span className="text-xs text-muted-foreground">USD</span>
                </div>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-16 justify-between font-normal bg-muted/50 hover:bg-muted/70 border-0"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-xs text-muted-foreground w-full text-left">Order Type</span>
                    <span className="text-sm font-medium mt-1">
                      {activeTab === "market" ? "Market Order" : activeTab === "limit" ? "Limit Order" : "Stop Order"}
                    </span>
                  </div>
                  <span className="text-lg">⌄</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setActiveTab("market")}>
                  Market Order
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("limit")}>
                  Limit Order
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("stop")}>
                  Stop Order
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Size and Margin */}
          <div className="grid grid-cols-2 gap-1 mb-1">
            <div className="flex flex-col justify-between p-3 bg-muted/50 rounded-md h-16">
              <span className="text-xs text-muted-foreground">Size</span>
              <div className="flex justify-between items-center w-full">
                <input
                  type="text"
                  placeholder="0"
                  value={formState.amount || ''}
                  onChange={handleAmountChange}
                  className="w-3/4 h-7 px-0 border-0 text-sm font-medium bg-transparent focus:outline-none"
                  suppressHydrationWarning
                />
                <span className="text-xs text-muted-foreground">USD</span>
              </div>
            </div>
            
            <div className="flex flex-col justify-between p-3 bg-muted/50 rounded-md h-16">
              <span className="text-xs text-muted-foreground">Margin</span>
              <div className="flex justify-between items-center w-full">
                <input
                  type="text"
                  placeholder="0"
                  value={calculatedMargin ? Number(calculatedMargin.toFixed(2)).toString() : ''}
                  onChange={handleMarginChange}
                  className="w-3/4 h-7 px-0 border-0 text-sm font-medium bg-transparent focus:outline-none"
                  suppressHydrationWarning
                />
                <span className="text-xs text-muted-foreground">USD</span>
              </div>
            </div>
          </div>

          {/* Replace percentage buttons with slider */}
          <div className="mb-3 mt-2">
            <CustomSlider
              min={0}
              max={100}
              step={1}
              value={formState.sliderValue ? formState.sliderValue[0] || 0 : 0}
              onChange={(value) => handleSliderChange([value])}
              className="mt-2"
            />
          </div>

          {!isConnected ? (
            <div className="w-full mb-3">
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <Button
                    variant="market"
                    className="w-full h-12 text-sm font-medium bg-[#7de2ac] hover:bg-[#7de2ac]/90 text-black"
                    onClick={openConnectModal}
                  >
                    Connect Wallet
                  </Button>
                )}
              </ConnectButton.Custom>
            </div>
          ) : (
            <Button
              variant="market"
              className={`w-full h-12 text-sm font-medium mb-3 ${
                formState.isLong 
                ? "bg-[var(--color-long)] hover:bg-[var(--color-long-dark)] text-black" 
                : "bg-[var(--color-short)] hover:bg-[var(--color-short-dark)] text-white"
              }`}
              disabled={
                // Only check these conditions if we have a smart account
                smartAccount?.address
                  ? (placingOrders ||
                     isNetworkSwitching ||
                     (activeTab === "market" && !tradeDetails.entryPrice) ||
                     (activeTab === "limit" && !formState.limitPrice) ||
                     hasInsufficientBalance ||
                     !isValid(formState.amount) ||
                     (() => {
                       // Check if any route is available
                       const hasAvailableRoute = routingInfo.routes.unidexv4.available || routingInfo.routes.gtrade.available;
                       return !hasAvailableRoute;
                     })())
                  : false // Not disabled when showing "Establish Connection"
              }
              onClick={handleButtonClick}
            >
              {getButtonText()}
            </Button>
          )}

          {/* Trade details box */}
          <div className="bg-muted/50 rounded-md p-3 space-y-1 mb-1">
            {/* Source/Route Information */}
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Source</span>
              <div className="flex items-center gap-1">
                {splitOrderInfo?.unidex && splitOrderInfo?.gtrade ? (
                  <div className="flex items-center gap-1">
                    <Image 
                      src="/static/images/logo-small.png"
                      alt="UniDex"
                      width={14}
                      height={14}
                    />
                    <span>UniDex</span>
                    <span className="text-muted-foreground">+</span>
                    <Image 
                      src="/static/images/gtrade.svg"
                      alt="gTrade"
                      width={14}
                      height={14}
                    />
                    <span>gTrade</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Image 
                      src={routingInfo.selectedRoute === 'unidexv4' ? '/static/images/logo-small.png' : '/static/images/gtrade.svg'}
                      alt={routingInfo.routeNames[routingInfo.selectedRoute]}
                      width={14}
                      height={14}
                    />
                    <span>{routingInfo.routeNames[routingInfo.selectedRoute]}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Liquidation Price */}
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Liquidation Price</span>
              <span className="text-short">${tradeDetails.liquidationPrice ? Number(tradeDetails.liquidationPrice.toFixed(2)).toLocaleString() : "0.00"}</span>
            </div>
            
            {/* Trading Fee */}
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Trading Fee</span>
              <span>{tradingFee.toFixed(2)} USD ({routingInfo.routes[routingInfo.selectedRoute].tradingFee * 100}%)</span>
            </div>

            {/* Conditional rendering based on expanded state */}
            {!detailsExpanded ? (
              // Show execution details toggle when collapsed
              <div 
                className="flex justify-between text-xs items-center cursor-pointer group py-0.5"
                onClick={() => setDetailsExpanded(true)}
              >
                <span className="text-muted-foreground group-hover:text-primary transition-colors">Execution Details</span>
                <span className="group-hover:text-primary transition-colors">↓</span>
              </div>
            ) : (
              // Show expanded details when expanded
              <>
                {/* Entry Price */}
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Entry Price</span>
                  <span>${tradeDetails.entryPrice ? Number(tradeDetails.entryPrice.toFixed(2)).toLocaleString() : "0.00"}</span>
                </div>
                
                {/* Hourly Interest */}
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Hourly Interest</span>
                  <span className={tradeDetails.fees.hourlyInterest >= 0 ? "text-short" : "text-long"}>
                    {tradeDetails.fees.hourlyInterest >= 0 ? "-" : "+"}$
                    {Math.abs(tradeDetails.fees.hourlyInterest).toFixed(2)} ({Math.abs(tradeDetails.fees.hourlyInterestPercent).toFixed(4)}%)
                  </span>
                </div>
                
                {/* Total Required */}
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total Required</span>
                  <span>{totalRequired.toFixed(2)} USD</span>
                </div>
                
                {/* Gas Price */}
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Gas Price</span>
                  <span>~$0.10</span>
                </div>
                
                {/* Referrer */}
                {referrerSection}
                
                {/* Close button at bottom */}
                <div 
                  className="flex justify-between text-xs items-center cursor-pointer group py-0.5"
                  onClick={() => setDetailsExpanded(false)}
                >
                  <span className="text-muted-foreground group-hover:text-primary transition-colors">Execution Details</span>
                  <span className="group-hover:text-primary transition-colors">↑</span>
                </div>
              </>
            )}
          </div>

          <div className="mt-2">
            <WalletBox />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default OrderCard;
