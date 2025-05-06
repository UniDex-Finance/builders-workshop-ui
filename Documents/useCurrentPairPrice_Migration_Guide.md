## Documentation: Migrating to `useCurrentPairPrice` Hook

**Date:** July 24, 2024

**Author:** AI Assistant

### 1. Problem Statement

Previously, components fetched the price for a specific trading pair (e.g., "EUR/USD") by:

1.  Getting the global `prices` object from the `usePrices` hook.
2.  Extracting the **base** currency (the part before the `/`, e.g., "EUR").
3.  Looking up the price using the lowercase base currency as the key (e.g., `prices['eur']?.price`).

This approach worked for pairs where the price feed uses the base currency as the key (like `eur` for "EUR/USD"). However, it failed for pairs like "USD/JPY" where the price feed uses the **quote** currency (`jpy`) as the key, while our logic was looking for `usd`. This led to inconsistent and incorrect price displays for USD-based pairs quoted against other currencies.

### 2. Solution: `useCurrentPairPrice` Hook

To address this inconsistency and centralize the price lookup logic, we introduced the `useCurrentPairPrice` hook.

**File:** `src/hooks/use-current-pair-price.ts`

**Purpose:** This hook provides a single, reliable way to get the latest price for *any* given trading pair string, handling the specific logic required for different base currencies.

**How it Works:**

1.  Accepts the `selectedPair` string (e.g., "EUR/USD", "USD/JPY") as an argument.
2.  Internally calls `usePrices` to get the latest price data.
3.  Splits the pair string into `base` and `quote` currencies.
4.  **Applies the core logic:**
    *   If `base.toLowerCase()` is `"usd"`, it uses `quote.toLowerCase()` as the lookup key in the `prices` object.
    *   Otherwise, it uses `base.toLowerCase()` as the lookup key.
5.  Returns the corresponding price (`number`) or `undefined` if the price is not available.

### 3. Migration Guide: How to Update Components

Follow these steps for any component that currently uses `usePrices` to look up the price of a specific trading pair:

1.  **Identify:** Locate the component file. Find where `usePrices()` is called and where its result (`prices`) is used to look up a price based on a pair string (e.g., `prices[basePair]?.price`).
2.  **Import:** Add the new hook import:
    ```typescript
    import { useCurrentPairPrice } from "../../../hooks/use-current-pair-price"; // Adjust path as needed
    ```
3.  **Remove `usePrices` (Optional):** If the component *only* used `usePrices` to get the price for this specific pair, you can remove the `usePrices()` call and its import (`import { usePrices } from '...';`). If `usePrices` is used for other purposes (e.g., iterating over all prices), leave it.
4.  **Replace Logic:** Find the line(s) deriving the lookup key (e.g., `basePair = pair.split('/')[0].toLowerCase()`) and the price lookup (e.g., `price = prices[basePair]?.price`). Replace this logic with a single call to the new hook:
    ```typescript
    // Assuming 'pairString' holds the relevant pair like "EUR/USD" or "market.pair"
    const currentPrice = useCurrentPairPrice(pairString); 
    ```
5.  **Update Usage:** Ensure any part of the component that previously used the old price variable now uses the `currentPrice` variable obtained from the hook.
6.  **Test:** Verify the component displays the correct price for both standard pairs (like "EUR/USD") and USD-base-swapped pairs (like "USD/JPY").

### 4. Example: Refactoring `MarketRow` in `PairSelector.tsx`

**Before:**

```typescript
// src/components/features/trading/PairSelector.tsx (within MarketRow)
import { usePrices } from "../../../lib/websocket-price-context";
// ... other imports ...

const MarketRow = ({ market /* ... */ }) => {
  const { formatPairPrice } = usePairPrecision();
  const { prices } = usePrices(); 
  // ... other hooks ...

  const formatPrice = (pair: string) => { // Old utility function
    const basePair = pair.split("/")[0].toLowerCase();
    const price = prices[basePair]?.price; 
    return formatPairPrice(pair, price);
  };

  return (
    // ... JSX ...
    <div className="w-[100px] text-right font-mono">
      {formatPrice(market.pair)} {/* Using the old function */}
    </div>
    // ... more JSX ...
  );
};
```

**After:**

```typescript
// src/components/features/trading/PairSelector.tsx (within MarketRow)
// Removed: import { usePrices } from "../../../lib/websocket-price-context";
import { useCurrentPairPrice } from "../../../hooks/use-current-pair-price"; 
// ... other imports ...

const MarketRow = ({ market /* ... */ }) => {
  const { formatPairPrice } = usePairPrecision();
  // Removed: const { prices } = usePrices();
  const marketPrice = useCurrentPairPrice(market.pair); // Use the new hook
  // ... other hooks ...

  // Removed: const formatPrice = (pair: string) => { ... };

  return (
    // ... JSX ...
    <div className="w-[100px] text-right font-mono">
      {formatPairPrice(market.pair, marketPrice)} {/* Using hook result directly */}
    </div>
    // ... more JSX ...
  );
};
```

### 5. Benefits of Migration

*   **Consistency:** Ensures correct price fetching for all pair types.
*   **Maintainability:** Centralizes the specific price lookup logic in one hook. Future changes only need to happen in `useCurrentPairPrice`.
*   **Reduced Bugs:** Eliminates potential errors from incorrect key lookups in multiple components.
*   **Readability:** Component code becomes simpler and more clearly expresses the intent of getting the current pair's price. 