import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { TRADING_PAIRS } from './use-market-data'; // Import the supported pairs
import { useMarketData } from './use-market-data'; // Import useMarketData

// Define the structure for the processed funding data row
export type ProcessedFundingData = {
  symbol: string; // Will now be the full pair, e.g., "BTC/USD"
  rates: Record<string, string>; // Exchange name -> Formatted rate string (e.g., '0.0050%') or 'Unidex' -> rate
};

// Define the structure returned by the select function
type SelectedFundingData = {
  processedData: ProcessedFundingData[];
  exchanges: string[];
};

// Define the structure for the raw API response (more specific typing)
type RawApiResponse = Record<string, Record<string, number | null>>;

// Define the desired order using the full names (Set maintains insertion order generally,
// but converting to Array makes it explicit)
const ORDERED_ALLOWED_EXCHANGES = [
  'Binance (Futures)',
  'Bybit (Futures)',
  'Hyperliquid (Futures)',
  'dYdX Chain',
  'Drift Protocol',
  'Crypto.com Exchange (Futures)',
  'Coinbase International Exchange (Derivatives)',
  'Bitget Futures',
  'Vertex Edge',
  'Vertex Edge (Arbitrum)',
  'Paradex',
  'Orderly (Derivatives)',
  'Aevo',
  'ApeX Pro',
  'RabbitX',
  'edgeX',
  'ApeX Omni',
  'WOO X (Futures)',
  'HTX Futures',
  'MEXC (Futures)',
  'Deribit'
];

// Map full exchange names to shorter display names
const EXCHANGE_NAME_MAP: Record<string, string> = {
  'Binance (Futures)': 'Binance',
  'Bybit (Futures)': 'Bybit',
  'Bitget Futures': 'Bitget',
  'HTX Futures': 'HTX',
  'MEXC (Futures)': 'MEXC',
  'Hyperliquid (Futures)': 'Hyperliquid',
  'Crypto.com Exchange (Futures)': 'Crypto.com',
  'Coinbase International Exchange (Derivatives)': 'Coinbase Int.',
  'dYdX Chain': 'dYdX',
  'Drift Protocol': 'Drift',
  'Vertex Edge': 'Vertex',
  'Vertex Edge (Arbitrum)': 'Vertex (Arb)',
  'Orderly (Derivatives)': 'Orderly',
  'ApeX Pro': 'ApeX',
  'WOO X (Futures)': 'WOO X',
  'Deribit': 'Deribit',
  'Paradex': 'Paradex',
  'Aevo': 'Aevo',
  'RabbitX': 'RabbitX',
  'edgeX': 'edgeX',
  'ApeX Omni': 'ApeX Omni',
};

// NEW: Define funding rate intervals (in hours) for each exchange
// These define the interval the RAW API VALUE represents.
const EXCHANGE_FUNDING_INTERVALS: Record<string, number> = {
  'Binance (Futures)': 8, // API provides 8H rate (needs *100)
  'Bybit (Futures)': 8,   // API provides 8H rate (needs *100)
  'Hyperliquid (Futures)': 8, // API provides 8H rate (needs *100)
  'dYdX Chain': 1,        // API provides 1H rate (NO *100)
  'Drift Protocol': 1,    // API provides 1H rate (NO *100)
  'Crypto.com Exchange (Futures)': 4, // API provides 4H rate (verify need for *100)
  'Coinbase International Exchange (Derivatives)': 8, // API provides 8H rate (verify need for *100)
  'Bitget Futures': 8,    // API provides 8H rate (verify need for *100)
  'Vertex Edge': 1,       // API provides 1H rate (NO *100)
  'Vertex Edge (Arbitrum)': 1, // API provides 1H rate (NO *100)
  'Paradex': 8,           // API provides 8H rate (verify need for *100)
  'Orderly (Derivatives)': 8, // API provides 8H rate (verify need for *100)
  'Aevo': 1,              // API provides 1H rate (NO *100)
  'ApeX Pro': 8,          // API provides 8H rate (verify need for *100)
  'RabbitX': 1,           // API provides 1H rate (NO *100)
  'edgeX': 4,             // API provides 4H rate (verify need for *100)
  'ApeX Omni': 8,         // API provides 8H rate (verify need for *100)
  'WOO X (Futures)': 8,   // API provides 8H rate (verify need for *100)
  'HTX Futures': 8,       // API provides 8H rate (verify need for *100)
  'MEXC (Futures)': 8,    // API provides 8H rate (verify need for *100)
  'Deribit': 8,           // API provides 8H rate (verify need for *100)
  // Add others as needed
};

// NEW: Define exchanges whose normalized rate needs multiplying by 100
const EXCHANGES_NEEDING_100X_MULTIPLIER = new Set([
    'Binance (Futures)',
    'Bybit (Futures)',
    'Hyperliquid (Futures)',
    // Add other full exchange names here if their raw API values are decimals needing x100
    // Example: 'Bitget Futures', 'Paradex', etc. - VERIFY THESE
]);

const DEFAULT_INTERVAL = 1; // Default source interval if not found in the map
const TARGET_INTERVAL = 8; // Target interval for normalization (8 hours)
const PLATFORM_INTERVAL = 1; // Assume Unidex platform rate is hourly source

const API_ENDPOINT = 'https://funding-rate-production.up.railway.app/api/v1/funding';

// Function to format the rate value (assumed to be the final percentage value)
const formatRate = (rate: number | null | undefined): string => {
    if (rate === null || typeof rate === 'undefined') {
      return 'N/A';
    }
    const precision = 4;
    let formattedRate = rate.toFixed(precision);
    const zeroString = `0.${'0'.repeat(precision)}`;
    if (formattedRate === `-${zeroString}`) {
        formattedRate = zeroString;
    }
    return `${formattedRate}%`;
};


// Create a reverse map for easy lookup: Base Asset -> Full Pair
// e.g., { "BTC": "BTC/USD", "ETH": "ETH/USD", ... }
const SYMBOL_TO_PAIR_MAP: Record<string, string> = {};
Object.values(TRADING_PAIRS).forEach(pair => {
  const base = pair.split('/')[0];
  // Only add if not already present, or decide on priority if duplicates exist
  if (base && !SYMBOL_TO_PAIR_MAP[base]) {
    SYMBOL_TO_PAIR_MAP[base] = pair;
  }
  // Handle cases like '1000PEPE' -> PEPE/USD if necessary, depends on API symbols vs TRADING_PAIRS
  if (base === 'PEPE' && pair === 'PEPE/USD' && !SYMBOL_TO_PAIR_MAP['1000PEPE']) {
     // Example: Map API's 1000PEPE to our PEPE/USD if needed
     // SYMBOL_TO_PAIR_MAP['1000PEPE'] = pair;
  }
  // Add more specific mappings if API symbols differ significantly (e.g., 'XAU' vs 'XAU/USD')
   if (base === 'XAU' && pair === 'XAU/USD' && !SYMBOL_TO_PAIR_MAP['XAU']) {
     SYMBOL_TO_PAIR_MAP['XAU'] = pair;
   }
    if (base === 'XAG' && pair === 'XAG/USD' && !SYMBOL_TO_PAIR_MAP['XAG']) {
     SYMBOL_TO_PAIR_MAP['XAG'] = pair;
   }
});

// Fetch function for external API
const fetchFundingRates = async (): Promise<RawApiResponse> => {
  const response = await fetch(API_ENDPOINT);
  if (!response.ok) {
    throw new Error('Network response was not ok fetching funding rates');
  }
  return response.json();
};

export function useFundingRateArb() {
  // Fetch platform market data
  const { allMarkets, loading: platformLoading, error: platformError } = useMarketData();

  const { data: apiData, isLoading: apiLoading, error: apiError, refetch } = useQuery<RawApiResponse, Error, SelectedFundingData>({
    queryKey: ['fundingRateArb', allMarkets], // Add allMarkets to query key so it refetches if platform data changes
    queryFn: fetchFundingRates,
    enabled: !platformLoading && !platformError, // Only fetch API data once platform data is ready
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
    placeholderData: keepPreviousData,
    select: (rawData): SelectedFundingData => {
      if (!rawData || !allMarkets) return { processedData: [], exchanges: [] };

      // Create a map of platform funding rates for quick lookup
      const platformRatesMap: Record<string, number> = {};
      allMarkets.forEach(market => {
        if (market && typeof market.fundingRate !== 'undefined') {
           platformRatesMap[market.pair] = market.fundingRate;
        }
      });

      const processedData: ProcessedFundingData[] = [];
      // Keep track of unique shortened names *found in the data*
      const uniqueShortNamesInData = new Set<string>();
      let platformRateFound = false; // Track if we found any platform rate

      for (const apiSymbol in rawData) {
        const unidexPair = SYMBOL_TO_PAIR_MAP[apiSymbol];

        if (unidexPair) {
            const assetRates = rawData[apiSymbol];
            const processedRates: Record<string, string> = {};

            // 1. Add Platform Rate first (Normalize if needed)
            const platformRawRate = platformRatesMap[unidexPair];
            if (typeof platformRawRate !== 'undefined' && platformRawRate !== null) {
                // Normalize the platform rate from PLATFORM_INTERVAL to TARGET_INTERVAL (8 hours)
                const normalizedPlatformRate = platformRawRate * (TARGET_INTERVAL / PLATFORM_INTERVAL);
                // Format the normalized platform rate (Platform rates assumed not to need x100)
                processedRates['Unidex'] = formatRate(normalizedPlatformRate);
                uniqueShortNamesInData.add('Unidex');
                platformRateFound = true;
            } else {
                 processedRates['Unidex'] = 'N/A';
                 // Don't add 'Unidex' to uniqueShortNamesInData here unless we want a column even with all N/A
            }


            // 2. Iterate through the *ordered* list of allowed external exchanges
            ORDERED_ALLOWED_EXCHANGES.forEach(fullExchangeName => {
               const rawRate = assetRates[fullExchangeName];
               if (typeof rawRate === 'number') {
                   const shortExchangeName = EXCHANGE_NAME_MAP[fullExchangeName] ?? fullExchangeName;
                   // Get the source interval for this exchange's raw rate
                   const exchangeInterval = EXCHANGE_FUNDING_INTERVALS[fullExchangeName] ?? DEFAULT_INTERVAL;

                   // Normalize the raw rate from its source interval to the TARGET_INTERVAL (8 hours)
                   const normalizedRate = rawRate * (TARGET_INTERVAL / exchangeInterval);

                   // Conditionally multiply by 100 based on the exchange
                   const valueToFormat = EXCHANGES_NEEDING_100X_MULTIPLIER.has(fullExchangeName)
                       ? normalizedRate * 100
                       : normalizedRate;

                   // Format the final value
                   processedRates[shortExchangeName] = formatRate(valueToFormat);
                   uniqueShortNamesInData.add(shortExchangeName);
               }
               // else: If exchange doesn't provide rate for this symbol or rate is null/undefined, we don't add it
            });

            // Only add the row if it has *any* rate data (platform or external)
            // Check if rates object has more keys than just 'Unidex' set to 'N/A'
            const rateKeys = Object.keys(processedRates);
            const hasExternalData = rateKeys.some(key => key !== 'Unidex' && processedRates[key] !== 'N/A');
            const hasPlatformData = processedRates['Unidex'] && processedRates['Unidex'] !== 'N/A';

            if (hasPlatformData || hasExternalData) {
                 processedData.push({
                   symbol: unidexPair,
                   rates: processedRates,
                 });
            }
        }
      }

      // Sort rows by symbol
      processedData.sort((a, b) => a.symbol.localeCompare(b.symbol));

      // Create the ordered list of exchanges for the header
      // Filter the desired external order based on exchanges actually present in the data
      let orderedExchangesInData = ORDERED_ALLOWED_EXCHANGES
        .map(fullName => EXCHANGE_NAME_MAP[fullName] ?? fullName) // Get the short name
        .filter(shortName => uniqueShortNamesInData.has(shortName)); // Keep only if data exists for it

      // Prepend 'Unidex' if platform rates were found for any symbol
      if (platformRateFound || uniqueShortNamesInData.has('Unidex')) { // Check if Unidex was added
          orderedExchangesInData = ['Unidex', ...orderedExchangesInData];
      }


      return { processedData, exchanges: orderedExchangesInData };
    },
  });

  // Combine loading states and errors
  const isLoading = platformLoading || apiLoading;
  const error = platformError || apiError;

  // Adapt the return based on the shape from the select function
  // data is now type SelectedFundingData | undefined
  return {
    data: apiData?.processedData ?? [], // Access processedData property
    isLoading,
    error,
    refetch,
    exchanges: apiData?.exchanges ?? [] // Access exchanges property
  };
}