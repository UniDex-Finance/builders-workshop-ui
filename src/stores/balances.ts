import { create } from 'zustand'
import { Balances } from '../hooks/use-balances'

interface BalancesState {
  balances: Balances | null
  isLoading: boolean
  isError: boolean
  setBalances: (balances: Balances | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: boolean) => void
}

export const useBalancesStore = create<BalancesState>((set) => ({
  balances: null,
  isLoading: false,
  isError: false,
  setBalances: (balances) => set({ balances }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ isError: error }),
})) 