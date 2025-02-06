import { useQuery } from '@tanstack/react-query';

interface GasPrice {
  wei: string;
  gwei: number;
}

interface GasCost {
  wei: string;
  eth: number;
  usd: number;
  gasPrice: GasPrice;
  ethPrice: number;
}

interface GasCostResponse {
  gasCost: GasCost;
}

const GAS_PRICE_QUERY_KEY = ['gasPrice', 'arbitrum'];
const POLLING_INTERVAL = 5000; // 5 seconds

export function useGetGasPrice() {
  const { data: gasCost, isLoading, error } = useQuery({
    queryKey: GAS_PRICE_QUERY_KEY,
    queryFn: async () => {
      const response = await fetch('https://gasprice-micro-service-production.up.railway.app/gas-cost');
      const data: GasCostResponse = await response.json();
      return data.gasCost;
    },
    refetchInterval: POLLING_INTERVAL,
  });

  return {
    gasCost,
    isLoading,
    error,
  };
}
