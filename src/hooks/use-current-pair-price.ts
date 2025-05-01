import { usePrices } from "../lib/websocket-price-context";

/**
 * Hook to get the current price for a given trading pair from the WebSocket context.
 * Handles the specific case where pairs like "USD/JPY" have their price keyed
 * under the quote currency ("jpy") instead of the base currency ("usd").
 *
 * @param selectedPair - The trading pair string (e.g., "EUR/USD", "USD/JPY").
 * @returns The current price for the pair, or undefined if not available.
 */
export const useCurrentPairPrice = (selectedPair: string): number | undefined => {
  const { prices } = usePrices();

  if (!selectedPair) {
    return undefined;
  }

  const parts = selectedPair.split("/");
  if (parts.length !== 2) {
    console.error(`Invalid pair format: ${selectedPair}`);
    return undefined;
  }

  const [base, quote] = parts;
  
  // Determine the correct key for price lookup based on the base currency
  const priceLookupKey = base?.toLowerCase() === 'usd' 
    ? quote?.toLowerCase() 
    : base?.toLowerCase();
    
  if (!priceLookupKey) {
    return undefined; // Should not happen with valid pair format, but good practice
  }

  return prices[priceLookupKey]?.price;
}; 