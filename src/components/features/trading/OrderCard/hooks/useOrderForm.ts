import { useState, useMemo, useEffect } from 'react';
import { useBalances } from '../../../../../hooks/use-balances';
import { OrderFormState } from '../types';

interface UseOrderFormProps {
  leverage: string;
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

export function useOrderForm({ leverage }: UseOrderFormProps): UseOrderFormReturn {
  const { balances } = useBalances();
  const [formState, setFormState] = useState<OrderFormState>({
    // Initialize with amount that corresponds to 1 USD margin
    amount: (1 * parseFloat(leverage)).toString(),
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

  // Calculate max leveraged amount
  const maxLeveragedAmount = useMemo(() => {
    const balance = parseFloat(balances?.formattedMusdBalance || "0");
    return balance * parseFloat(leverage);
  }, [balances?.formattedMusdBalance, leverage]);

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

  // Update handleSliderChange to handle percentages more directly
  const handleSliderChange = (value: number[]) => {
    const percentage = value[0];
    const newAmount = (maxLeveragedAmount * percentage / 100).toFixed(2);
    const calculatedMargin = parseFloat(newAmount) / parseFloat(leverage);
    
    if (calculatedMargin >= MIN_MARGIN) {
      setFormState(prev => ({
        ...prev,
        sliderValue: value,
        amount: newAmount
      }));
    }
  };

  // Handle amount input change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    
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

  // Handle margin input change
  const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMargin = e.target.value;
    const leverageNum = parseFloat(leverage);
    const newAmount = newMargin ? (parseFloat(newMargin) * leverageNum).toFixed(2) : "";

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