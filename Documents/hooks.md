# Hooks Documentation

## Trading Hooks

### `useMarketData`
Core hook for fetching and managing market data.

**Usage:**
```typescript
const { allMarkets, marketData, loading, error } = useMarketData({
  pollInterval: 10000,
  selectedPair: "BTC/USD"
});
```

**Returns:**
- `allMarkets`: Array of all available markets
- `marketData`: Data for selected market
- `loading`: Loading state
- `error`: Error state

### `useGTradeMarketData`
Hook for fetching gTrade-specific market data.

**Usage:**
```typescript
const { markets, loading, error } = useGTradeMarketData();
```

**Returns:**
- `markets`: Array of gTrade markets with detailed information
- `loading`: Loading state
- `error`: Error state

### `usePositions`
Manages user's trading positions.

**Usage:**
```typescript
const { positions, isLoading, refetch } = usePositions(address);
```

### `useTradeHistory`
Fetches user's trading history.

**Usage:**
```typescript
const { trades, isLoading, refetch } = useTradeHistory(address);
```

## Token & Price Hooks

### `useUsdm`
Manages USDM token interactions.

**Usage:**
```typescript
const {
  usdmData,
  isLoading,
  approveUsdc,
  approveUsdm,
  mint,
  burn
} = useUsdm();
```

**Returns:**
- `usdmData`: Object containing USDM balances and allowances
- `approveUsdc`: Function to approve USDC spending
- `approveUsdm`: Function to approve USDM spending
- `mint`: Function to mint USDM
- `burn`: Function to burn USDM

### `usePairPrecision`
Manages price formatting for different trading pairs.

**Usage:**
```typescript
const { formatPairPrice, getPrecision } = usePairPrecision();
```

**Functions:**
- `formatPairPrice(pair: string, price: number)`: Formats price with correct decimals
- `getPrecision(pair: string)`: Gets precision configuration for a pair

### `useUsdcPrice`
Fetches and manages USDC price data.

## Staking Hooks

### `useUsdmStaking`
Manages USDM staking functionality.

**Usage:**
```typescript
const {
  stakingData,
  isLoading,
  claim,
  stake,
  withdraw,
  approve
} = useUsdmStaking();
```

**Returns:**
- `stakingData`: Object containing staking information
- `claim`: Function to claim rewards
- `stake`: Function to stake tokens
- `withdraw`: Function to withdraw tokens
- `approve`: Function to approve token spending

### `useMoltenStaking`
Manages Molten token staking.

**Usage:**
```typescript
const {
  stakingData,
  isLoading,
  stake,
  withdraw,
  claim,
  approve
} = useMoltenStaking();
```

## Web3 Integration Hooks

### `useSmartAccount`
Manages smart contract wallet functionality.

**Usage:**
```typescript
const {
  smartAccount,
  isDeployed,
  deployAccount
} = useSmartAccount();
```

### `useBalances`
Fetches and manages token balances.

**Usage:**
```typescript
const { balances, isLoading, refetch } = useBalances(address);
```

### `useGTradeSdk`
Provides access to gTrade SDK functionality.

**Usage:**
```typescript
const sdk = useGTradeSdk();
```

## URL & Navigation Hooks

### `usePairFromUrl`
Manages trading pair from URL parameters.

**Usage:**
```typescript
const { selectedPair, setPair } = usePairFromUrl();
```

### `useRouting`
Manages application routing.

## Utility Hooks

### `useToast`
Provides toast notification functionality.

**Usage:**
```typescript
const { toast } = useToast();

toast({
  title: "Success",
  description: "Operation completed",
  variant: "success"
});
```

### `useNetworkSwitch`
Manages network switching functionality.

**Usage:**
```typescript
const { switchNetwork, isLoading } = useNetworkSwitch();
```

## Best Practices

### Error Handling
```typescript
try {
  const result = await someHook.someAction();
  // Handle success
} catch (error) {
  console.error('Error:', error);
  // Handle error appropriately
}
```

### Data Refreshing
```typescript
// Manual refresh
await refetch();

// Automatic refresh
useEffect(() => {
  const interval = setInterval(refetch, 10000);
  return () => clearInterval(interval);
}, []);
```

### Loading States
```typescript
if (isLoading) {
  return <LoadingSpinner />;
}

if (error) {
  return <ErrorMessage error={error} />;
}
```

### Cleanup
```typescript
useEffect(() => {
  // Setup subscriptions or intervals
  return () => {
    // Cleanup subscriptions or intervals
  };
}, []);
```

## Common Patterns

### Fetching Data
Most data fetching hooks follow this pattern:
1. Initial loading state
2. Data fetch on mount
3. Regular polling interval
4. Manual refresh capability
5. Error handling

### State Management
Hooks typically manage:
1. Local state for UI
2. Contract interactions
3. Data formatting
4. Error states
5. Loading states

### Contract Interactions
Web3 hooks follow this pattern:
1. Check for wallet connection
2. Simulate transaction
3. Return transaction request
4. Handle errors
5. Provide loading states