import { useState, useMemo, useEffect } from 'react';
import { useBalances } from '../../../../../hooks/use-balances';
import { useMarketData } from '../../../../../hooks/use-market-data';
import { OrderFormState } from '../types';

interface UseOrderFormProps {
  leverage: string;
  assetId: string;
  isLong: boolean;
}

interface UseOrderFormReturn {
  formState: OrderFormState;
  maxLeveragedAmount: number;
  handleAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLimitPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSliderChange: (value: number[]) => void;
  toggleDirection: () => void;
  toggleTPSL: () => void;
  handleTakeProfitChange: (value: string, isPrice?: boolean) => void;
  handleStopLossChange: (value: string, isPrice?: boolean) => void;
  setFormState: React.Dispatch<React.SetStateAction<OrderFormState>>;
  handleMarginChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isValid: (amount: string) => boolean;
}

const MIN_MARGIN = 1; // Add this constant

export function useOrderForm({ leverage, assetId, isLong }: UseOrderFormProps): UseOrderFormReturn {
  const { balances } = useBalances();
  const { allMarkets } = useMarketData();
  const [formState, setFormState] = useState<OrderFormState>({
    // Initialize with amount that corresponds to 1 USD margin
    amount: Math.floor(1 * parseFloat(leverage)).toString(),
    limitPrice: "",
    // Calculate initial slider value based on maxLeveragedAmount
    sliderValue: [0],
    isLong: true,
    tpslEnabled: false,
    takeProfit: "",
    takeProfitPercentage: "",
    stopLoss: "",
    stopLossPercentage: "",
    entryPrice: 0
  });

  // Calculate max leveraged amount, accounting for fees
  const maxLeveragedAmount = useMemo(() => {
    const marginBalance = parseFloat(balances?.formattedMusdBalance || "0");
    const usdcBalance = parseFloat(balances?.formattedUsdcBalance || "0");
    const combinedBalance = marginBalance + usdcBalance;

    // Get the market's trading fee from market data
    const market = allMarkets.find(m => m.assetId === assetId);
    const tradingFeeRate = market 
      ? (isLong ? market.longTradingFee : market.shortTradingFee)
      : 0.001; // fallback to 0.1% if market data not available

    const adjustedBalance = combinedBalance / (1 + tradingFeeRate);
    return adjustedBalance * parseFloat(leverage);
  }, [balances?.formattedMusdBalance, balances?.formattedUsdcBalance, leverage, assetId, isLong, allMarkets]);

  // Update slider value when maxLeveragedAmount changes
  useEffect(() => {
    if (maxLeveragedAmount > 0) {
      const initialAmount = parseFloat(formState.amount);
      const percentage = (initialAmount / maxLeveragedAmount) * 100;
      setFormState(prev => ({
        ...prev,
        sliderValue: [Math.min(100, Math.max(0, percentage))]
      }));
    }
  }, [maxLeveragedAmount]);

  // Handle slider change using combined balance
  const handleSliderChange = (value: number[]) => {
    const percentage = value[0];
    const market = allMarkets.find(m => m.assetId === assetId);
    const newAmount = Math.floor(maxLeveragedAmount * percentage / 100).toString();
    const calculatedMargin = Number((parseFloat(newAmount) / parseFloat(leverage)).toFixed(2));
    
    
    if (calculatedMargin >= MIN_MARGIN) {
      setFormState(prev => ({
        ...prev,
        sliderValue: value,
        amount: newAmount
      }));
    }
  };

  // Update amount input change handler
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    
    let newSliderValue = [0];
    if (maxLeveragedAmount > 0 && newAmount !== "") {
      const percentage = (parseFloat(newAmount) / maxLeveragedAmount) * 100;
      newSliderValue = [Math.min(100, Math.max(0, percentage))];
    }

    setFormState(prev => ({
      ...prev,
      amount: newAmount ? Number(newAmount).toString() : "",
      sliderValue: newSliderValue
    }));
  };

  // Update margin input change handler
  const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMargin = e.target.value;
    const leverageNum = parseFloat(leverage);
    const newAmount = newMargin ? 
      (Number((parseFloat(newMargin) * leverageNum).toFixed(2))).toString() : "";

    let newSliderValue = [0];
    if (maxLeveragedAmount > 0 && newAmount !== "") {
      const percentage = (parseFloat(newAmount) / maxLeveragedAmount) * 100;
      newSliderValue = [Math.min(100, Math.max(0, percentage))];
    }

    setFormState(prev => ({
      ...prev,
      amount: newAmount,
      sliderValue: newSliderValue
    }));
  };

  // Handle limit price input change
  const handleLimitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState(prev => ({
      ...prev,
      limitPrice: e.target.value
    }));
  };

  // Toggle between long and short
  const toggleDirection = () => {
    setFormState(prev => ({
      ...prev,
      isLong: !prev.isLong
    }));
  };

  // Toggle TP/SL
  const toggleTPSL = () => {
    setFormState(prev => ({
      ...prev,
      tpslEnabled: !prev.tpslEnabled,
      // Reset values when disabled
      takeProfit: !prev.tpslEnabled ? prev.takeProfit : "",
      takeProfitPercentage: !prev.tpslEnabled ? prev.takeProfitPercentage : "",
      stopLoss: !prev.tpslEnabled ? prev.stopLoss : "",
      stopLossPercentage: !prev.tpslEnabled ? prev.stopLossPercentage : ""
    }));
  };

  // Calculate price from percentage
  const calculatePrice = (percentage: number, isProfit: boolean) => {
    const entryPrice = parseFloat(formState?.entryPrice?.toString() ?? "0");
    if (!entryPrice || isNaN(entryPrice)) return "";

    const multiplier = isProfit ? (1 + percentage / 100) : (1 - percentage / 100);
    return (entryPrice * multiplier).toFixed(2);
  };

  // Calculate percentage from price
  const calculatePercentage = (price: string, isProfit: boolean) => {
    const entryPrice = parseFloat(formState?.entryPrice?.toString() ?? "0");
    const targetPrice = parseFloat(price);

    if (!entryPrice || !targetPrice || isNaN(entryPrice) || isNaN(targetPrice)) return "";

    const percentage = ((targetPrice - entryPrice) / entryPrice) * 100;
    return isProfit ? percentage.toFixed(2) : (-percentage).toFixed(2);
  };

  // Handle take profit changes
  const handleTakeProfitChange = (value: string, isPrice: boolean = true) => {
    setFormState(prev => {
      if (isPrice) {
        return {
          ...prev,
          takeProfit: value,
          takeProfitPercentage: calculatePercentage(value, true)
        };
      } else {
        return {
          ...prev,
          takeProfitPercentage: value,
          takeProfit: calculatePrice(parseFloat(value), true)
        };
      }
    });
  };

  // Handle stop loss changes
  const handleStopLossChange = (value: string, isPrice: boolean = true) => {
    setFormState(prev => {
      if (isPrice) {
        return {
          ...prev,
          stopLoss: value,
          stopLossPercentage: calculatePercentage(value, false)
        };
      } else {
        return {
          ...prev,
          stopLossPercentage: value,
          stopLoss: calculatePrice(parseFloat(value), false)
        };
      }
    });
  };

  // Add isValid helper function to check if current values are valid
  const isValid = (amount: string) => {
    if (!amount) return false;
    const calculatedMargin = parseFloat(amount) / parseFloat(leverage);
    return calculatedMargin >= MIN_MARGIN;
  };

  return {
    formState,
    maxLeveragedAmount,
    handleAmountChange,
    handleLimitPriceChange,
    handleSliderChange,
    toggleDirection,
    toggleTPSL,
    handleTakeProfitChange,
    handleStopLossChange,
    setFormState,
    handleMarginChange,
    isValid,
  };
}