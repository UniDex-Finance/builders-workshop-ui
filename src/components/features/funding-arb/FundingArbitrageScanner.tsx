"use client";

import { useState, useEffect, useRef, useMemo } from "react";
// Removed Image import as it's not used currently
import {
  Search,
  Info,
  Star,
  Loader2,
  AlertTriangle,
  Minus,
  Plus,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Input } from "../../ui/input";
import { Tabs, TabsList, TabsTrigger } from "../../ui/tabs";
import { Checkbox } from "../../ui/checkbox"; // Import Checkbox
import { Label } from "../../ui/label"; // Import Label
import { Button } from "../../ui/button"; // Import Button
import { cn } from "../../../lib/utils";
import { useFundingRateArb, ProcessedFundingData } from "../../../hooks/use-funding-rate-arb"; // Import the hook and type
import Link from 'next/link'; // Import Link from next/link
import { TokenIcon } from "../../../hooks/use-token-icon"; // Import TokenIcon

// NEW: Helper to format position size display
const formatPositionSize = (valueStr: string): string => {
    // Try parsing the raw string
    const num = parseFloat(valueStr);
    // If parsing fails or results in NaN, return the original string or a default
    if (isNaN(num)) return valueStr || '0'; // Return '0' or original if needed
    // Format the valid number
    return num.toLocaleString('en-US', {
        minimumFractionDigits: 0, // No minimum decimal places unless needed
        maximumFractionDigits: 2  // Allow up to 2 decimal places
    });
};

// Removed placeholder type and data
// type FundingData = ...
// const placeholderData = ...

type TimeRange = "1H" | "8H" | "1D"; // Simplified ranges for now

// Helper function to parse rate string to number
const parseRate = (rateStr: string | undefined): number | null => {
    if (!rateStr || rateStr === 'N/A') return null;
    const num = parseFloat(rateStr.replace('%', ''));
    return isNaN(num) ? null : num;
};

// NEW: Helper function to format the adjusted rate
const formatAdjustedRate = (rate: number | null): string => {
    if (rate === null) return 'N/A';
    // Use slightly higher precision for potentially smaller 1H rates
    const precision = rate !== 0 && Math.abs(rate) < 0.0001 ? 6 : 4;
    let formattedRate = rate.toFixed(precision);
    // Avoid negative zero
    if (formattedRate === `-${'0'.repeat(precision)}` || formattedRate === `-0.${'0'.repeat(precision)}`) {
        formattedRate = `0.${'0'.repeat(precision)}`;
    }
    return `${formattedRate}%`;
};

// NEW: Helper function to format currency
const formatCurrency = (value: number | null, maximumFractionDigits = 2): string => {
  if (value === null || isNaN(value)) return 'N/A';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: maximumFractionDigits,
  });
};

export function FundingArbitrageScanner() {
  const {
    data: fundingData, // Rename to avoid conflict
    isLoading, // This reflects combined loading state
    error,
    exchanges, // Get the list of exchanges dynamically from the hook
    refetch
  } = useFundingRateArb();

  const [selectedRange, setSelectedRange] = useState<TimeRange>("8H");
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteCoins, setFavoriteCoins] = useState<string[]>([]);
  const [filteredData, setFilteredData] = useState<ProcessedFundingData[]>([]); // Use ProcessedFundingData type
  const [isInitialLoading, setIsInitialLoading] = useState(true); // Track initial load state
  const [showUniDexArb, setShowUniDexArb] = useState(true); // State for the checkbox - Changed initial state to true
  const [arbThreshold, setArbThreshold] = useState<number>(0.003); // State for arb threshold
  const [sortColumn, setSortColumn] = useState<string | null>("symbol"); // Default sort by symbol
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc"); // Default ascending
  const [showPeriodPayout, setShowPeriodPayout] = useState(false); // NEW: State for period payout toggle (Renamed from showHourlyPayments)
  const [positionSize, setPositionSize] = useState("10000"); // NEW: State stores RAW numeric string

  // Define the base step and minimum value
  const baseThresholdStep = 0.0001;
  const minThreshold = 0.0001;

  // Refs for interval, timeout, and hold start time
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const holdStartTimeRef = useRef<number | null>(null); // Ref to store hold start time

  // Modified handlers to accept a step argument
  const increaseThreshold = (step = baseThresholdStep) => { // Default step
    setArbThreshold(prev => {
      // Ensure precision with dynamic steps
      const newValue = parseFloat((prev + step).toPrecision(10)); // Use toPrecision for potentially varying step sizes
      // Re-apply toFixed(4) only for final state setting if needed, or trust toPrecision
      return parseFloat(newValue.toFixed(4)); // Format back to 4 decimals
    });
  };

  const decreaseThreshold = (step = baseThresholdStep) => { // Default step
    setArbThreshold(prev => {
      const rawNewValue = parseFloat((prev - step).toPrecision(10));
      const newValue = Math.max(minThreshold, rawNewValue);
      return parseFloat(newValue.toFixed(4)); // Format back to 4 decimals
    });
  };

  // Modified stopHolding to clear start time ref
  const stopHolding = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    holdStartTimeRef.current = null; // Clear start time on stop
  };

  // Modified startHolding to implement acceleration
  const startHolding = (action: 'increase' | 'decrease') => {
    stopHolding(); // Clear any existing timers first
    holdStartTimeRef.current = Date.now(); // Record hold start time

    const baseUpdateFn = action === 'increase' ? increaseThreshold : decreaseThreshold;

    baseUpdateFn(); // Call once immediately with the base step

    // Initial delay before rapid repeat starts
    const initialDelay = 400; // ms
    const repeatInterval = 100; // ms - How often we check and potentially increase the step

    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        // Ensure hold is still active
        if (!holdStartTimeRef.current) {
          stopHolding();
          return;
        }

        const elapsedTime = Date.now() - holdStartTimeRef.current;
        let multiplier = 1;

        // Define acceleration tiers (adjust ms thresholds and multipliers as needed)
        if (elapsedTime > 3000) { // Held for over 3 seconds
          multiplier = 10;
        } else if (elapsedTime > 1500) { // Held for over 1.5 seconds
          multiplier = 5;
        } else if (elapsedTime > 700) { // Held for over 0.7 seconds (after initial delay)
          multiplier = 2;
        }
        // else multiplier remains 1 (base step)

        const dynamicStep = baseThresholdStep * multiplier;
        baseUpdateFn(dynamicStep); // Call update function with the calculated dynamic step

        // Add extra check for decrease action hitting minimum
        if (action === 'decrease' && arbThreshold <= minThreshold) {
             stopHolding(); // Stop repeating if minimum is reached
        }

      }, repeatInterval);
    }, initialDelay);
  };

  // NEW: Sorting handler
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      // Toggle direction if clicking the same column
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      // Set new column and default to descending for rates/arb, ascending for symbol
      setSortColumn(columnKey);
      setSortDirection(columnKey === 'symbol' ? 'asc' : 'desc');
    }
  };

  // Cleanup intervals on component unmount
  useEffect(() => {
    return () => {
      stopHolding();
    };
  }, []);

  // Filter data based on search query and data from hook
  useEffect(() => {
    // Determine if we should update the filtered data
    // We update if:
    // 1. It's the initial load phase OR
    // 2. We receive actual fundingData (not empty/undefined) after the initial load
    const shouldUpdateData = isInitialLoading || (fundingData && fundingData.length > 0);

    if (shouldUpdateData) {
      let dataToFilter = fundingData ?? [];
      if (searchQuery.trim() !== "") {
        dataToFilter = dataToFilter.filter((coin) =>
          coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      setFilteredData(dataToFilter);
    }

    // Set initial loading to false once the first load attempt finishes (regardless of success/error)
    // This ensures we don't get stuck in the initial loading state if the first fetch fails
    if (isInitialLoading && (!isLoading || error)) {
      setIsInitialLoading(false);
    }
    // Add error to dependency array
  }, [searchQuery, fundingData, isLoading, isInitialLoading, error]);

  const getConversionFactor = (range: TimeRange): number => {
    switch (range) {
        case "1H": return 1 / 8;
        case "8H": return 1;
        case "1D": return 3; // 24 hours / 8 hours
        default: return 1;
    }
  };

  // NEW: Helper function to get hours in selected period
  const getHoursInPeriod = (range: TimeRange): number => {
    switch (range) {
        case "1H": return 1;
        case "8H": return 8;
        case "1D": return 24;
        default: return 8; // Default to 8H
    }
  };

  // NEW: Memoized sorted data
  const sortedData = useMemo(() => {
    if (!filteredData) return [];

    const conversionFactor = getConversionFactor(selectedRange);

    // Function to get the sortable value for a given coin and column
    const getSortValue = (coin: ProcessedFundingData, column: string): number | string | null => {
        if (column === 'symbol') {
            return coin.symbol;
        }

        // Calculate the value based on whether we show Arb diff or raw adjusted rate
        const baseUniRate8HStr = coin.rates['Unidex'];
        const baseUniRate8HValue = parseRate(baseUniRate8HStr);
        const adjustedUniRateValue = baseUniRate8HValue !== null ? baseUniRate8HValue * conversionFactor : null;

        const baseRate8HStr = coin.rates[column] ?? "N/A";
        const baseRate8HValue = parseRate(baseRate8HStr);
        const adjustedRateValue = baseRate8HValue !== null ? baseRate8HValue * conversionFactor : null;

        if (showUniDexArb && column !== 'Unidex') {
            if (adjustedUniRateValue !== null && adjustedRateValue !== null) {
                return adjustedRateValue - adjustedUniRateValue; // Return the difference
            } else {
                return null; // Treat as unsortable if calculation fails
            }
        } else {
            return adjustedRateValue; // Return the adjusted rate
        }
    };

    return [...filteredData].sort((a, b) => {
        if (!sortColumn) return 0; // No sort applied

        const valA = getSortValue(a, sortColumn);
        const valB = getSortValue(b, sortColumn);

        // Handle sorting by symbol (string)
        if (sortColumn === 'symbol') {
            const strA = (valA as string || '').toLowerCase();
            const strB = (valB as string || '').toLowerCase();
            const comparison = strA.localeCompare(strB);
            return sortDirection === 'asc' ? comparison : -comparison;
        }

        // Handle sorting by number (rates/arb)
        // Treat null/N/A as very small or very large numbers to push them to the bottom
        const numA = valA === null ? (sortDirection === 'asc' ? Infinity : -Infinity) : valA as number;
        const numB = valB === null ? (sortDirection === 'asc' ? Infinity : -Infinity) : valB as number;

        const comparison = numA - numB;
        return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection, selectedRange, showUniDexArb]);

  const toggleFavorite = (symbol: string) => {
    setFavoriteCoins((prev) =>
      prev.includes(symbol)
        ? prev.filter((coin) => coin !== symbol)
        : [...prev, symbol]
    );
     // TODO: Persist favorites (e.g., localStorage)
  };

  // Helper function to render table body content based on state
  const renderTableContent = (dataToRender: ProcessedFundingData[]) => {
     if (isInitialLoading) { // Show loader ONLY on initial load
       return (
         <tr>
           <td colSpan={exchanges.length + 1} className="text-center py-10">
             <div className="flex justify-center items-center gap-2 text-muted-foreground">
               <Loader2 className="h-5 w-5 animate-spin" />
               <span>Loading funding rates...</span>
             </div>
           </td>
         </tr>
       );
     }

     if (error) { // Show error if it exists (priority over data)
       return (
          <tr>
            <td colSpan={exchanges.length + 1} className="text-center py-10">
              <div className="flex justify-center items-center gap-2 text-destructive">
                 <AlertTriangle className="h-5 w-5" />
                <span>Error loading data: {error.message}</span>
                <button onClick={() => refetch()} className="ml-2 text-xs underline">Retry</button>
              </div>
            </td>
          </tr>
       );
     }

     // If not initial loading and no error, show the current data
     // (even if `isLoading` is true for background fetch)
     if (dataToRender.length === 0) {
        return (
          <tr>
            <td colSpan={exchanges.length + 1} className="text-center py-10 text-muted-foreground">
              {searchQuery ? "No markets found matching your search." : "No funding rate data available."}
            </td>
          </tr>
        );
     }

     // Get the conversion factor based on selectedRange (already calculated in useMemo, but needed here too for display)
     const conversionFactor = getConversionFactor(selectedRange);
     // NEW: Parse position size, default to 0 if invalid
     const parsedPositionSize = parseFloat(positionSize) || 0;

     // Render the actual data rows using the pre-sorted data
     return dataToRender.map((coin) => {
        // Parse the BASE 8H Unidex rate string
        const baseUniRate8HStr = coin.rates['Unidex'];
        const baseUniRate8HValue = parseRate(baseUniRate8HStr);
        // Calculate the ADJUSTED Unidex rate for the selected range
        const adjustedUniRateValue = baseUniRate8HValue !== null ? baseUniRate8HValue * conversionFactor : null;

        return (
         <tr key={coin.symbol} className="hover:bg-muted/50 transition-colors">
           {/* Sticky cell for Market column */}
           <td className="sticky left-0 z-10 bg-background hover:bg-muted/50 px-3 py-2 flex items-center gap-2 text-sm whitespace-nowrap">
             {/* Favorite Button */}
             <button onClick={() => toggleFavorite(coin.symbol)} className="text-muted-foreground hover:text-yellow-400 z-20 relative"> {/* Added z-index */}
               <Star className={cn("h-4 w-4", favoriteCoins.includes(coin.symbol) ? "fill-current text-yellow-400" : "")} />
             </button>
             {/* Link wrapping Icon and Symbol */}
             <Link
                href={`/?pair=${encodeURIComponent(coin.symbol)}`}
                className="flex items-center gap-1.5 hover:underline flex-grow" // Added flex-grow to take available space
             >
                <TokenIcon pair={coin.symbol} size={16} square={true} className="shrink-0" /> {/* Added TokenIcon */}
                <span className="font-medium text-foreground">{coin.symbol}</span>
             </Link>
           </td>
           {/* Map through ALL exchanges */}
           {exchanges
                .map((exchange) => {
                    // Get the BASE 8H rate string for the current exchange
                    const baseRate8HStr = coin.rates[exchange] ?? "N/A";
                    // Parse the BASE 8H rate string
                    const baseRate8HValue = parseRate(baseRate8HStr);
                    // Calculate the ADJUSTED rate for the selected range
                    const adjustedRateValue = baseRate8HValue !== null ? baseRate8HValue * conversionFactor : null;

                    let displayValue: string;
                    let textColor = "text-muted-foreground";
                    let comparisonValue: number | null = null; // Value to compare against threshold
                    let tooltipContent: string | null = null; // Tooltip for hourly payment display
                    let isArbDisplay = false; // Flag to know if we are displaying the arb difference

                    // If showing Arb AND the current exchange is NOT Unidex
                    if (showUniDexArb && exchange !== 'Unidex') {
                        isArbDisplay = true; // Set the flag
                        // Calculate difference based on ADJUSTED rates
                        if (adjustedUniRateValue !== null && adjustedRateValue !== null) {
                            const diffValue = adjustedRateValue - adjustedUniRateValue;
                            displayValue = formatAdjustedRate(diffValue); // Format the difference
                            comparisonValue = diffValue; // Compare the difference
                        } else {
                             displayValue = "N/A"; // If Unidex or Exchange rate is N/A for calculation
                             comparisonValue = null;
                        }
                    } else {
                         // Otherwise (showUniDexArb is false OR exchange is Unidex)
                         // Display ADJUSTED Rate and color based on it
                         isArbDisplay = false; // Reset the flag
                         displayValue = formatAdjustedRate(adjustedRateValue); // Format the adjusted rate
                         comparisonValue = adjustedRateValue; // Compare the adjusted rate
                    }

                    // Apply coloring based on the comparison value and threshold
                    if (comparisonValue !== null) {
                        if (comparisonValue < -arbThreshold) {
                            textColor = "text-red-500";
                        } else if (comparisonValue > arbThreshold) {
                            textColor = "text-green-500";
                        }
                    }

                    // NEW: Calculate and format payout for the selected PERIOD if toggled
                    // MODIFICATION: Add check for Unidex column
                    if (showPeriodPayout && exchange === 'Unidex') {
                        // When showing payout, UniDex column should be N/A
                        displayValue = "N/A";
                        tooltipContent = null; // No tooltip needed
                        // Keep existing text color based on rate for consistency, or reset:
                        // textColor = "text-muted-foreground";
                    } else if (showPeriodPayout && comparisonValue !== null) {
                        // Calculate payout for NON-UNIDEX columns or when not showing Arb difference
                        const periodRatePercent = comparisonValue;
                        let periodPaymentAmount = parsedPositionSize * (periodRatePercent / 100);

                        // Take absolute value if showing arb payout
                        const displayPaymentAmount = isArbDisplay ? Math.abs(periodPaymentAmount) : periodPaymentAmount;

                        tooltipContent = displayValue; // Store original percentage for tooltip
                        displayValue = formatCurrency(displayPaymentAmount); // Show payout for the period

                        // Adjust precision for small amounts (use absolute value for comparison)
                        if (Math.abs(displayPaymentAmount) < 0.01 && displayPaymentAmount !== 0) {
                           displayValue = formatCurrency(displayPaymentAmount, 4);
                        } else if (Math.abs(displayPaymentAmount) < 1 && displayPaymentAmount !== 0) {
                            displayValue = formatCurrency(displayPaymentAmount, 3);
                        }
                    }
                    // ELSE: showPeriodPayout is false, displayValue remains the formatted rate/diff

                    return (
                        <td
                           key={`${coin.symbol}-${exchange}`}
                           className={cn("px-3 py-2 text-right text-sm font-medium whitespace-nowrap tabular-nums", textColor)}
                           title={tooltipContent ?? undefined} // Add tooltip if showing payments
                        >
                           {displayValue}
                        </td>
                    );
                })}
         </tr>
        );
     });
  };


  return (
    <div className="w-full p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">Funding Arbitrage</h1>
           {/* Update header text dynamically based on selectedRange */}
           <span className="text-xs text-muted-foreground">(Rates displayed as {selectedRange})</span>
          {/* Data source info - Keep as placeholder or update */}
          {/* <div className="text-xs text-muted-foreground flex items-center gap-1">
            <span>Data may be delayed</span>
            <Info className="h-3 w-3" />
          </div> */}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Checkbox for UniDex Arb Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
                id="unidex-arb"
                checked={showUniDexArb}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowUniDexArb(e.target.checked)}
                className="h-4 w-4"
            />
            <Label htmlFor="unidex-arb" className="text-xs font-medium cursor-pointer">
                Show UniDex Arb
            </Label>
          </div>

          <Tabs value={selectedRange} className="h-8">
            <TabsList className="bg-muted">
              {(["1H", "8H", "1D"] as TimeRange[]).map((range) => (
                <TabsTrigger
                  key={range}
                  value={range}
                  onClick={() => setSelectedRange(range)}
                  className={cn(
                    "h-8 px-3 text-xs", // Adjusted size and text size
                    selectedRange === range
                      ? "bg-background text-foreground" // Use theme colors
                      : "text-muted-foreground"
                  )}
                >
                  {range}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search Market"
              className="pl-8 h-8 w-48 md:w-64 bg-muted border-border focus:border-primary focus:ring-primary text-foreground" // Adjusted styling
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Selected Range Info & Arb Threshold Input */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs border-t border-border pt-3 mt-3">
         {/* Left Side Controls (Threshold + Legend) */}
         <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
            {/* Input Group */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground whitespace-nowrap">
                 Arb Threshold ({showUniDexArb ? "Diff" : "Rate"}):
              </span>
              {/* Control container */}
              <div className="flex items-center border border-border rounded-md overflow-hidden h-6">
                 {/* Decrease Button with updated events */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-full w-6 rounded-none border-r border-border hover:bg-muted p-1 select-none"
                  onMouseDown={() => startHolding('decrease')}
                  onMouseUp={stopHolding}
                  onMouseLeave={stopHolding}
                  onTouchStart={(e) => { e.preventDefault(); startHolding('decrease'); }}
                  onTouchEnd={stopHolding}
                  disabled={arbThreshold <= minThreshold}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                 {/* Value Display */}
                <span className="px-2 text-center font-medium text-primary tabular-nums w-16 select-none">
                  {arbThreshold.toFixed(4)}
                </span>
                 {/* Increase Button with updated events */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-full w-6 rounded-none border-l border-border hover:bg-muted p-1 select-none"
                  onMouseDown={() => startHolding('increase')}
                  onMouseUp={stopHolding}
                  onMouseLeave={stopHolding}
                  onTouchStart={(e) => { e.preventDefault(); startHolding('increase'); }}
                  onTouchEnd={stopHolding}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <span className="text-muted-foreground">%</span>
            </div>

            {/* Legend Group */}
            <div className="flex items-center gap-x-4 gap-y-1 flex-wrap">
              <span className="font-medium text-foreground whitespace-nowrap">Strategy Guide ({selectedRange}):</span>
              {/* Use arbThreshold state directly in legend */}
              <span className="text-green-500 font-medium whitespace-nowrap">
                 &gt; +{arbThreshold.toFixed(4)}%: Long {showUniDexArb ? "Other" : "Asset"}, Short {showUniDexArb ? "UniDex" : "Other"}
              </span>
              <span className="text-muted-foreground whitespace-nowrap">
                 ±{arbThreshold.toFixed(4)}%: Out of Range
              </span>
              <span className="text-red-500 font-medium whitespace-nowrap">
                 &lt; -{arbThreshold.toFixed(4)}%: Short {showUniDexArb ? "Other" : "Asset"}, Long {showUniDexArb ? "UniDex" : "Other"}
              </span>
            </div>
         </div>

         {/* NEW: Right Side Controls (Period Payout) */}
         <div className="flex items-center gap-2">
            <Checkbox
              id="period-payout" // Changed id
              checked={showPeriodPayout}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowPeriodPayout(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="period-payout" className="text-xs font-medium cursor-pointer whitespace-nowrap">
              Show Payout/{selectedRange} {/* Dynamically update label */}
            </Label>
            {showPeriodPayout && ( // Conditionally render position size controls
              <div className="flex items-center gap-1">
                 <span className="text-muted-foreground">$</span>
                 <span 
                   contentEditable={true}
                   suppressContentEditableWarning={true}
                   onBlur={(e) => {
                     let editedValue = e.currentTarget.textContent || '';
                     // 1. Clean: Remove commas and anything not a digit or period
                     const cleanedValue = editedValue.replace(/[^0-9.]/g, '');

                     // 2. Validate: Basic check for valid number format
                     // Allows empty string, single dot, numbers, numbers with one dot
                     if (/^\d*\.?\d*$/.test(cleanedValue)) {
                       // Avoid setting state for empty or just "."
                       if (cleanedValue === '' || cleanedValue === '.') {
                           // Revert display to formatted previous valid state
                           e.currentTarget.textContent = formatPositionSize(positionSize);
                       } else {
                           // Parse to ensure it's a valid number, handle potential precision
                           const numValue = parseFloat(cleanedValue);
                           if (!isNaN(numValue)) {
                             // Determine max 2 decimal places for the raw state value
                             const rawValueString = numValue.toFixed(Math.min(2, (cleanedValue.split('.')[1] || '').length));
                             // 3. Store the RAW numeric string in state
                             setPositionSize(rawValueString);
                             // 4. Update display with formatted value
                             e.currentTarget.textContent = formatPositionSize(rawValueString);
                           } else {
                             // Revert display if final parse failed (should be rare after regex)
                             e.currentTarget.textContent = formatPositionSize(positionSize);
                           }
                       }
                     } else {
                         // Revert display if initial format was invalid
                         e.currentTarget.textContent = formatPositionSize(positionSize);
                     }
                     // Remove focus style
                     e.currentTarget.style.borderBottom = 'none';
                   }}
                   onFocus={(e) => {
                     // Show the RAW value for editing
                     e.currentTarget.textContent = positionSize;
                     e.currentTarget.style.borderBottom = '1px dashed currentColor';
                     // Optional: Select text for easier editing
                     window.getSelection()?.selectAllChildren(e.currentTarget);
                   }}
                   onBlurCapture={(e) => {
                     // This might be redundant now, handled in onBlur
                     // e.currentTarget.style.borderBottom = 'none';
                   }}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter') {
                       e.preventDefault();
                       e.currentTarget.blur();
                     }
                   }}
                   className="text-xs font-medium text-foreground w-20 text-center cursor-text outline-none"
                 >
                   {/* Initial display is the formatted value */}
                   {formatPositionSize(positionSize)}
                 </span>
              </div>
            )}
         </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[1000px] border-collapse">
          <thead>
            <tr className="bg-muted text-muted-foreground text-xs uppercase">
              {/* Sticky header for Market column - Make it sortable */}
              <th
                 className="sticky left-0 z-10 bg-muted px-3 py-2 text-left font-medium hover:bg-muted-foreground/10 cursor-pointer select-none"
                 onClick={() => handleSort('symbol')} // Add onClick
              >
                <div className="flex items-center gap-1"> {/* Wrap in flex for icon */}
                   Market
                   {/* Add Sort Icon */}
                   {sortColumn === 'symbol' && (
                     sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                   )}
                </div>
              </th>
              {/* Dynamically generate ALL exchange headers - Make them sortable */}
              {exchanges
                .map((exchange) => (
                   <th
                     key={exchange}
                     className="px-3 py-2 text-right font-medium whitespace-nowrap hover:bg-muted-foreground/10 cursor-pointer select-none"
                     onClick={() => handleSort(exchange)} // Add onClick
                   >
                     <div className="flex items-center justify-end gap-1"> {/* Wrap in flex for icon */}
                        {/* Reverted header label to just show exchange name */}
                        {exchange}
                        {/* Add Sort Icon */}
                        {sortColumn === exchange && (
                           sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                     </div>
                   </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {/* Use the helper function to render tbody content with sortedData */}
            {renderTableContent(sortedData)}
          </tbody>
        </table>
      </div>
    </div>
  );
} 