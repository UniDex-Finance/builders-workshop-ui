import React, { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "../../../ui/button";
import { Card, CardContent } from "../../../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../ui/tabs";
import { useMarketOrderActions } from "../../../../hooks/use-market-order-actions";
import { useSmartAccount } from "../../../../hooks/use-smart-account";
import { useMarketData } from "../../../../hooks/use-market-data";
import { usePrices } from "../../../../lib/websocket-price-context";
import { MarketOrderForm } from "./components/MarketOrderForm";
import { LimitOrderForm } from "./components/LimitOrderForm";
import { TradeDetails } from "./components/TradeDetails";
import { WalletBox } from "../WalletEquity";
import { useOrderForm } from "./hooks/useOrderForm";
import { useTradeCalculations } from "./hooks/useTradeCalculations";
import { OrderCardProps } from "./types";
import { useBalances } from "../../../../hooks/use-balances";
import { useReferralContract } from "../../../../hooks/use-referral-contract";

const TRADING_FEE_RATE = 0.001; // 0.1% fee
const DEFAULT_REFERRER = "0x0000000000000000000000000000000000000000";
const STORAGE_KEY_CODE = "unidex-referral-code";
const STORAGE_KEY_ADDRESS = "unidex-referral-address";

export function OrderCard({
  leverage,
  onLeverageChange,
  assetId,
  initialReferralCode,
}: OrderCardProps) {
  const { isConnected } = useAccount();
  const { smartAccount, setupSessionKey, error, isNetworkSwitching } =
    useSmartAccount();
  const [activeTab, setActiveTab] = useState("market");
  const { placeMarketOrder, placeLimitOrder, placingOrders } =
    useMarketOrderActions();
  const { allMarkets } = useMarketData();
  const { prices } = usePrices();
  const { balances } = useBalances("arbitrum");
  const [referrerCode, setReferrerCode] = useState("");
  const { getReferralAddress } = useReferralContract();
  const [resolvedReferrer, setResolvedReferrer] = useState(DEFAULT_REFERRER);
  const [isEditingReferrer, setIsEditingReferrer] = useState(false);
  const referrerInputRef = useRef<HTMLInputElement>(null);
  const [tempReferrerCode, setTempReferrerCode] = useState(""); // Add this for temporary input value

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

  const {
    formState,
    handleAmountChange,
    handleMarginChange, // Add this
    handleLimitPriceChange,
    handleSliderChange,
    toggleDirection,
    toggleTPSL,
    handleTakeProfitChange,
    handleStopLossChange,
    setFormState,
    isValid, // Add this
  } = useOrderForm({ leverage });

  const calculatedMargin = formState.amount
    ? parseFloat(formState.amount) / parseFloat(leverage)
    : 0;

  const calculatedSize = formState.amount ? parseFloat(formState.amount) : 0;
  const tradingFee = calculatedSize * TRADING_FEE_RATE;
  const totalRequired = calculatedMargin + tradingFee;

  const marginWalletBalance = parseFloat(balances?.formattedMusdBalance || "0");
  const onectWalletBalance = parseFloat(balances?.formattedUsdcBalance || "0");
  const combinedBalance = marginWalletBalance + onectWalletBalance;
  const hasInsufficientBalance = totalRequired > combinedBalance;
  const needsDeposit =
    totalRequired > marginWalletBalance && totalRequired <= combinedBalance;

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
    if (e.key === "Enter") {
      e.currentTarget.blur(); // Trigger blur event to validate
    }
  };

  useEffect(() => {
    if (referrerCode && resolvedReferrer === DEFAULT_REFERRER) {
      getReferralAddress(referrerCode).then((address) => {
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

  const handlePlaceOrder = () => {
    if (!isConnected || !smartAccount?.address) return;

    const tpsl = formState.tpslEnabled
      ? {
          takeProfit: formState.takeProfit,
          stopLoss: formState.stopLoss,
        }
      : {};

    if (activeTab === "market" && tradeDetails.entryPrice) {
      placeMarketOrder(
        parseInt(assetId, 10),
        formState.isLong,
        tradeDetails.entryPrice,
        100,
        calculatedMargin,
        calculatedSize,
        tpsl.takeProfit,
        tpsl.stopLoss,
        resolvedReferrer
      );
    } else if (activeTab === "limit" && formState.limitPrice) {
      placeLimitOrder(
        parseInt(assetId, 10),
        formState.isLong,
        parseFloat(formState.limitPrice),
        100,
        calculatedMargin,
        calculatedSize,
        tpsl.takeProfit,
        tpsl.stopLoss,
        resolvedReferrer
      );
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
    if (!isValid(formState.amount)) return "Minimum Margin: 1 USD";

    const availableLiquidity = formState.isLong
      ? market?.availableLiquidity?.long
      : market?.availableLiquidity?.short;

    if (
      availableLiquidity !== undefined &&
      calculatedSize > availableLiquidity
    ) {
      return "Not Enough Liquidity";
    }

    if (needsDeposit) {
      return `Deposit & Place ${formState.isLong ? "Long" : "Short"}`;
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
    <div className="flex items-center justify-between">
      <span>Referrer</span>
      {isEditingReferrer ? (
        <input
          ref={referrerInputRef}
          type="text"
          value={tempReferrerCode} // Use temporary value for input
          onChange={handleReferrerChange}
          onBlur={handleReferrerBlur}
          onKeyDown={handleReferrerKeyDown} // Add keyboard handler
          placeholder="Enter code"
          className="text-right bg-transparent border-b border-dashed outline-none border-muted-foreground"
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

  return (
    <Card className="w-full md:w-[350px]">
      <CardContent className="p-4">
        {error && (
          <div className="mb-4 text-red-500">Error: {error.message}</div>
        )}

        <Tabs defaultValue="market" onValueChange={setActiveTab}>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Button
              variant={formState.isLong ? "default" : "outline"}
              className={`w-full ${
                formState.isLong
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : ""
              }`}
              onClick={() => formState.isLong || toggleDirection()}
            >
              Long
            </Button>
            <Button
              variant={!formState.isLong ? "default" : "outline"}
              className={`w-full ${
                !formState.isLong
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : ""
              }`}
              onClick={() => !formState.isLong || toggleDirection()}
            >
              Short
            </Button>
          </div>

          <div className="flex justify-between text-sm text-muted-foreground">
            <TabsList className="flex gap-4 p-0 bg-transparent border-0">
              <TabsTrigger
                value="market"
                className="bg-transparent border-0 p-0 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary"
              >
                Market
              </TabsTrigger>
              <TabsTrigger
                value="limit"
                className="bg-transparent border-0 p-0 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary"
              >
                Limit
              </TabsTrigger>
              <TabsTrigger
                value="stop"
                className="bg-transparent border-0 p-0 data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary"
              >
                Stop
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="market">
            <MarketOrderForm
              formState={formState}
              calculatedMargin={calculatedMargin}
              handleAmountChange={handleAmountChange}
              handleMarginChange={handleMarginChange} // Add this
              handleSliderChange={handleSliderChange}
              toggleTPSL={toggleTPSL}
              handleTakeProfitChange={(value) => handleTakeProfitChange(value)}
              handleStopLossChange={(value) => handleStopLossChange(value)}
              leverage={leverage}
              onLeverageChange={onLeverageChange}
            />
          </TabsContent>

          <TabsContent value="limit">
            <LimitOrderForm
              formState={formState}
              calculatedMargin={calculatedMargin}
              handleAmountChange={handleAmountChange}
              handleMarginChange={handleMarginChange} // Add this
              handleLimitPriceChange={handleLimitPriceChange}
              handleSliderChange={handleSliderChange}
              toggleTPSL={toggleTPSL}
              handleTakeProfitChange={(value) => handleTakeProfitChange(value)}
              handleStopLossChange={(value) => handleStopLossChange(value)}
              leverage={leverage}
              onLeverageChange={onLeverageChange}
            />
          </TabsContent>

          <TradeDetails
            details={tradeDetails}
            pair={market?.pair}
            tradingFee={tradingFee}
            totalRequired={totalRequired}
            referrerSection={referrerSection}
          />

          {!isConnected ? (
            <div className="w-full mt-4">
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <Button
                    variant="market"
                    className="w-full"
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
              className="w-full mt-4"
              disabled={
                // Only check these conditions if we have a smart account
                smartAccount?.address
                  ? placingOrders ||
                    isNetworkSwitching ||
                    (activeTab === "market" && !tradeDetails.entryPrice) ||
                    (activeTab === "limit" && !formState.limitPrice) ||
                    hasInsufficientBalance ||
                    !isValid(formState.amount) ||
                    (() => {
                      const availableLiquidity = formState.isLong
                        ? market?.availableLiquidity?.long
                        : market?.availableLiquidity?.short;
                      return (
                        availableLiquidity !== undefined &&
                        calculatedSize > availableLiquidity
                      );
                    })()
                  : false // Not disabled when showing "Establish Connection"
              }
              onClick={handleButtonClick}
            >
              {getButtonText()}
            </Button>
          )}

          <div className="h-px my-4 bg-border" />
          <div className="mt-4">
            <WalletBox />
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default OrderCard;
