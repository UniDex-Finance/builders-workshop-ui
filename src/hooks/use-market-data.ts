import { useState, useEffect } from 'react';
import { useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import { lensAbi } from '../lib/abi/lens';
import { arbitrum } from 'viem/chains';

export const TRADING_PAIRS: { [key: string]: string } = {
  '1': 'BTC/USD', '2': 'ETH/USD', '3': 'S/USD', '4': 'SOL/USD', '5': 'DOGE/USD',
  '6': 'AVAX/USD', '7': 'BNB/USD', '8': 'ADA/USD', '9': 'LINK/USD', '10': 'ATOM/USD',
  '11': 'NEAR/USD', '12': 'ARB/USD', '13': 'OP/USD', '14': 'LTC/USD', '15': 'GMX/USD',
  '16': 'EUR/USD', '17': 'GBP/USD', '18': 'INJ/USD', '19': 'TIA/USD', '20': 'AERO/USD',
  '21': 'MERL/USD', '22': 'SAFE/USD', '23': 'OMNI/USD', '24': 'REZ/USD', '25': 'ETHFI/USD',
  '26': 'BOME/USD', '27': 'ORDI/USD', '28': 'DYM/USD', '29': 'TAO/USD', '30': 'WLD/USD',
  '31': 'POPCAT/USD', '32': 'ZRO/USD', '33': 'RUNE/USD', '34': 'MEW/USD', '35': 'BEAM/USD',
  '36': 'STRK/USD', '37': 'AAVE/USD', '38': 'XRP/USD', '39': 'TON/USD', '40': 'NOT/USD',
  '41': 'RLB/USD', '42': 'ALICE/USD', '43': 'APE/USD', '44': 'APT/USD', '45': 'AVAIL/USD',
  '46': 'DEGEN/USD', '47': 'RDNT/USD', '48': 'SUI/USD', '49': 'PEPE/USD', '50': 'EIGEN/USD',
  '51': 'XAU/USD', '52': 'XAG/USD', '53': 'GMCI30/USD', '54': 'GMCL2/USD', '55': 'GMMEME/USD',
  '56': 'QQQ/USD', '57': 'SPY/USD'
};

// Map of trading pairs to their full names
export const PAIR_FULL_NAMES: { [key: string]: string } = {
  'BTC/USD': 'Bitcoin to US Dollar',
  'ETH/USD': 'Ethereum to US Dollar',
  'S/USD': 'Sonic to US Dollar',
  'SOL/USD': 'Solana to US Dollar',
  'DOGE/USD': 'Dogecoin to US Dollar',
  'AVAX/USD': 'Avalanche to US Dollar',
  'BNB/USD': 'Binance Coin to US Dollar',
  'ADA/USD': 'Cardano to US Dollar',
  'LINK/USD': 'Chainlink to US Dollar',
  'ATOM/USD': 'Cosmos to US Dollar',
  'NEAR/USD': 'Near Protocol to US Dollar',
  'ARB/USD': 'Arbitrum to US Dollar',
  'OP/USD': 'Optimism to US Dollar',
  'LTC/USD': 'Litecoin to US Dollar',
  'GMX/USD': 'GMX to US Dollar',
  'EUR/USD': 'Euro to US Dollar',
  'GBP/USD': 'British Pound to US Dollar',
  'INJ/USD': 'Injective to US Dollar',
  'TIA/USD': 'Celestia to US Dollar',
  'AERO/USD': 'Aerodrome to US Dollar',
  'MERL/USD': 'Merlin to US Dollar',
  'SAFE/USD': 'Safe to US Dollar',
  'OMNI/USD': 'Omni Network to US Dollar',
  'REZ/USD': 'Rezoro to US Dollar',
  'ETHFI/USD': 'ETHFI to US Dollar',
  'BOME/USD': 'Book of Meme to US Dollar',
  'ORDI/USD': 'Ordinals to US Dollar',
  'DYM/USD': 'Dymension to US Dollar',
  'TAO/USD': 'Bittensor to US Dollar',
  'WLD/USD': 'Worldcoin to US Dollar',
  'POPCAT/USD': 'Popcat to US Dollar',
  'ZRO/USD': 'Zero to US Dollar',
  'RUNE/USD': 'THORChain to US Dollar',
  'MEW/USD': 'MEW to US Dollar',
  'BEAM/USD': 'Beam to US Dollar',
  'STRK/USD': 'Starknet to US Dollar',
  'AAVE/USD': 'Aave to US Dollar',
  'XRP/USD': 'Ripple to US Dollar',
  'TON/USD': 'Toncoin to US Dollar',
  'NOT/USD': 'Notation to US Dollar',
  'RLB/USD': 'Rollbit to US Dollar',
  'ALICE/USD': 'My Neighbor Alice to US Dollar',
  'APE/USD': 'ApeCoin to US Dollar',
  'APT/USD': 'Aptos to US Dollar',
  'AVAIL/USD': 'Avail to US Dollar',
  'DEGEN/USD': 'Degen to US Dollar',
  'RDNT/USD': 'Radiant Capital to US Dollar',
  'SUI/USD': 'Sui to US Dollar',
  'PEPE/USD': 'Pepe to US Dollar',
  'EIGEN/USD': 'Eigen Layer to US Dollar',
  'XAU/USD': 'Gold to US Dollar',
  'XAG/USD': 'Silver to US Dollar',
  'GMCI30/USD': 'GMCI30 Index to US Dollar',
  'GMCL2/USD': 'GMCL2 Index to US Dollar',
  'GMMEME/USD': 'GMMEME Index to US Dollar',
  'QQQ/USD': 'Nasdaq-100 ETF to US Dollar',
  'SPY/USD': 'S&P 500 ETF to US Dollar'
};

// Helper function to get the full name for a pair
export function getPairFullName(pair: string): string {
  return PAIR_FULL_NAMES[pair] || pair;
}

export interface Market {
  assetId: string;
  pair: string;
  pairFullName: string;
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

interface UseMarketDataOptions {
  pollInterval?: number;
  selectedPair?: string;
  address?: `0x${string}`;
}

interface UseMarketDataResult {
  marketData: Market | null;
  allMarkets: Market[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  getPairFullName: (pair: string) => string;
}

const LENS_CONTRACT_ADDRESS = '0xeae57c7bce5caf160343a83440e98bc976ab7274' as `0x${string}`;

export function useMarketData({
  pollInterval = 10000,
  selectedPair,
  address = '0x0000000000000000000000000000000000000000'
}: UseMarketDataOptions = {}): UseMarketDataResult {
  const [marketData, setMarketData] = useState<Market | null>(null);
  const [allMarkets, setAllMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Create contract configs for each asset
  const contracts = Object.keys(TRADING_PAIRS).map(assetId => ({
    address: LENS_CONTRACT_ADDRESS,
    abi: lensAbi,
    functionName: 'getGlobalInfo' as const,
    args: [address, BigInt(assetId)] as const,
    chainId: arbitrum.id // Explicitly set chainId to Arbitrum
  }));

  // Use wagmi's useReadContracts for multicall
  const { data: contractData, refetch } = useReadContracts({
    contracts: contracts,
    query: {
      enabled: true,
      refetchInterval: pollInterval,
      staleTime: 0
    }
  });

  // Process contract data into market data
  const processMarketData = () => {
    if (!contractData) return;

    try {
      const markets: Market[] = contractData.map((result, index) => {
        if (!result.result) return null;

        const assetId = Object.keys(TRADING_PAIRS)[index];
        const data = result.result as readonly [
          bigint,  // fundingRate
          bigint,  // borrowRateForLong
          bigint,  // borrowRateForShort
          bigint,  // longOpenInterest
          bigint,  // shortOpenInterest
          bigint,  // maxLongOpenInterest
          bigint,  // maxShortOpenInterest
          bigint,  // longTradingFee
          bigint   // shortTradingFee
        ];

        // Calculate values using the same scaling as before
        const longOI = Number(formatUnits(data[3], 30));
        const shortOI = Number(formatUnits(data[4], 30));
        const maxLongOI = Number(formatUnits(data[5], 30));
        const maxShortOI = Number(formatUnits(data[6], 30));

        // Calculate utilization
        const utilization = Math.max(
          maxLongOI > 0 ? (longOI / maxLongOI) * 100 : 0,
          maxShortOI > 0 ? (shortOI / maxShortOI) * 100 : 0
        );

        // Calculate long/short ratio
        const totalOI = longOI + shortOI;
        const longPercentage = totalOI > 0 ? (longOI / totalOI) * 100 : 50;
        const shortPercentage = totalOI > 0 ? (shortOI / totalOI) * 100 : 50;

        const pair = TRADING_PAIRS[assetId];

        return {
          assetId: assetId,
          pair: pair,
          pairFullName: getPairFullName(pair),
          fundingRate: Number(formatUnits(data[0], 13)),
          borrowRateForLong: Number(formatUnits(data[1], 4)),
          borrowRateForShort: Number(formatUnits(data[2], 4)),
          longOpenInterest: longOI,
          shortOpenInterest: shortOI,
          maxLongOpenInterest: maxLongOI,
          maxShortOpenInterest: maxShortOI,
          longTradingFee: Number(formatUnits(data[7], 28)),
          shortTradingFee: Number(formatUnits(data[8], 28)),
          utilization: Number(utilization.toFixed(2)),
          longShortRatio: {
            longPercentage: Number(longPercentage.toFixed(2)),
            shortPercentage: Number(shortPercentage.toFixed(2))
          },
          availableLiquidity: {
            long: Number((maxLongOI - longOI).toFixed(2)),
            short: Number((maxShortOI - shortOI).toFixed(2))
          }
        };
      }).filter((market): market is Market => market !== null);

      setAllMarkets(markets);

      if (selectedPair) {
        const market = markets.find(function (m) { return m.pair === selectedPair; });
        setMarketData(market || markets[0] || null);
      } else {
        setMarketData(markets[0] || null);
      }

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
      console.error('Error processing market data:', err);
      setLoading(false);
    }
  };

  // Effect to process data when contract data changes
  useEffect(function () {
    processMarketData();
  }, [contractData, selectedPair]);

  return {
    marketData,
    allMarkets,
    loading,
    error,
    refetch: async function () {
      await refetch();
      processMarketData();
    },
    getPairFullName
  };
}