import { useQuery } from '@tanstack/react-query';
import { create } from 'zustand';

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

interface GasPriceStore {
  gasCost: GasCost | null;
  setGasCost: (gasCost: GasCost) => void;
}

const useGasPriceStore = create<GasPriceStore>((set) => ({
  gasCost: null,
  setGasCost: (gasCost) => set({ gasCost }),
}));

export function useGetGasPrice() {
  const { setGasCost } = useGasPriceStore();
  
  const { data: gasCost, isLoading, error } = useQuery({
    queryKey: ['gasPrice', 'arbitrum'],
    queryFn: async () => {
      const response = await fetch('https://gasprice-micro-service-production.up.railway.app/gas-cost');
      const data: GasCostResponse = await response.json();
      setGasCost(data.gasCost);
      return data.gasCost;
    },
    refetchInterval: 5000,
  });

  return {
    gasCost: gasCost || useGasPriceStore.getState().gasCost,
    isLoading,
    error,
  };
}

export const getLatestGasPrice = () => useGasPriceStore.getState().gasCost;
