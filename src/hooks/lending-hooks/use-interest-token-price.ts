import { useState, useEffect } from 'react';
import { type Hex } from 'viem';

// Re-using vault token definitions (Consider centralizing these)
const VAULT_TOKENS = {
  aave: { address: '0x724dc807b04555b71ed48a6896b6f41593b8c637' as Hex, decimals: 6 },
  compound: { address: '0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf' as Hex, decimals: 6 },
  fluid: { address: '0x1A996cb54bb95462040408C06122D45D6Cdb6096' as Hex, decimals: 6 },
};

export type VaultProtocol = keyof typeof VAULT_TOKENS;

interface TokenPrices {
  aave: number | null;
  compound: number | null;
  fluid: number | null;
}

interface UseInterestTokenPriceReturn {
  prices: TokenPrices;
  isLoading: boolean;
  error: string | null;
}

const LLAMA_API_BASE = "https://coins.llama.fi/prices/current/";
const ENSO_API_BASE = "https://api.enso.finance/api/v1/prices/42161/"; // Chain ID hardcoded for Arbitrum

export function useInterestTokenPrice(): UseInterestTokenPriceReturn {
  const [prices, setPrices] = useState<TokenPrices>({ aave: null, compound: null, fluid: null });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      setIsLoading(true);
      setError(null);

      const llamaTokens = `arbitrum:${VAULT_TOKENS.aave.address},arbitrum:${VAULT_TOKENS.fluid.address}`;
      const llamaUrl = `${LLAMA_API_BASE}${llamaTokens}`;
      const compoundUrl = `${ENSO_API_BASE}${VAULT_TOKENS.compound.address}`;

      try {
        // Use Promise.allSettled to fetch both endpoints concurrently and handle potential individual failures
        const results = await Promise.allSettled([
          fetch(llamaUrl).then(res => res.ok ? res.json() : Promise.reject(`Llama API Error: ${res.status}`)),
          fetch(compoundUrl).then(res => res.ok ? res.json() : Promise.reject(`Enso API Error: ${res.status}`))
        ]);

        const newPrices: TokenPrices = { aave: null, compound: null, fluid: null };
        let fetchError: string | null = null;

        // Process Llama results
        if (results[0].status === 'fulfilled') {
          const llamaData = results[0].value;
          // Llama structure: { coins: { "arbitrum:0x...": { price: ... } } }
          const aavePriceData = llamaData?.coins?.[`arbitrum:${VAULT_TOKENS.aave.address}`];
          const fluidPriceData = llamaData?.coins?.[`arbitrum:${VAULT_TOKENS.fluid.address}`];
          if (aavePriceData?.price) {
             newPrices.aave = typeof aavePriceData.price === 'string' ? parseFloat(aavePriceData.price) : aavePriceData.price;
          } else {
            console.warn("Could not extract Aave price from Llama response:", llamaData);
          }
          if (fluidPriceData?.price) {
            newPrices.fluid = typeof fluidPriceData.price === 'string' ? parseFloat(fluidPriceData.price) : fluidPriceData.price;
          } else {
            console.warn("Could not extract Fluid price from Llama response:", llamaData);
          }
        } else {
          console.error("Llama API fetch failed:", results[0].reason);
          fetchError = fetchError ? `${fetchError}; ${results[0].reason}` : results[0].reason;
        }

        // Process Enso results
        if (results[1].status === 'fulfilled') {
          const ensoData = results[1].value;
          // Enso structure: { price: ... }
          if (ensoData?.price) {
            newPrices.compound = typeof ensoData.price === 'string' ? parseFloat(ensoData.price) : ensoData.price;
          } else {
             console.warn("Could not extract Compound price from Enso response:", ensoData);
          }
        } else {
          console.error("Enso API fetch failed:", results[1].reason);
           fetchError = fetchError ? `${fetchError}; ${results[1].reason}` : results[1].reason;
        }

        // Check if any price is still null after processing
        if (newPrices.aave === null || newPrices.compound === null || newPrices.fluid === null) {
             const missing = Object.entries(newPrices)
                .filter(([, v]) => v === null)
                .map(([k]) => k)
                .join(', ');
             const warningMsg = `Failed to fetch prices for: ${missing}.`;
             console.warn(warningMsg);
             // Set error only if there wasn't a direct fetch error already
             if (!fetchError) {
                 fetchError = warningMsg;
             }
        }

        setPrices(newPrices);
        setError(fetchError);

      } catch (err: any) {
        console.error("Error fetching token prices:", err);
        setError(err.message || "An unknown error occurred while fetching prices.");
        setPrices({ aave: null, compound: null, fluid: null }); // Reset prices on critical error
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrices();
     // Add interval fetching if needed in the future, e.g., every 5 minutes
     // const intervalId = setInterval(fetchPrices, 300000);
     // return () => clearInterval(intervalId);
  }, []); // Empty dependency array means this runs once on mount

  return { prices, isLoading, error };
} 