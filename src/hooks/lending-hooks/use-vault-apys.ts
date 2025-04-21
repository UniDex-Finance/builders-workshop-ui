import { useState, useEffect } from "react";

// Define the structure of the returned APYs
interface VaultApys {
  aave?: number;
  compound?: number;
  fluid?: number;
}

// Define the structure of the hook's return value
interface UseVaultApysReturn {
  apys: VaultApys | null;
  isLoading: boolean;
  isError: boolean;
}

// --- Constants ---
const API_URL = "https://enso-microservice-production.up.railway.app/apy"; // Updated API URL

// --- Hook Implementation ---
export function useVaultApys(): UseVaultApysReturn {
  const [apys, setApys] = useState<VaultApys | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    const fetchApys = async () => {
      setIsLoading(true);
      setIsError(false);

      // Simplified URL for the new API
      const url = API_URL;

      try {
        // Simplified fetch call without specific headers or query params
        const response = await fetch(url, {
          method: "GET",
          // No Authorization or Content-Type needed based on the new API structure
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // The new API directly returns the structure we need
        const result: VaultApys = await response.json();

        if (!result) { // Basic check if the result is valid
          throw new Error("Invalid API response structure");
        }

        // Directly set the APYs from the response
        setApys(result);

      } catch (error) {
        console.error("Failed to fetch vault APYs:", error);
        setIsError(true);
        setApys(null); // Clear APYs on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchApys();
  }, []); // Empty dependency array means this runs once on mount

  return { apys, isLoading, isError };
} 