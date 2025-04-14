# Trading Components Documentation

## Core Trading Components

### Chart Component
The Chart component integrates TradingView's charting library for displaying price charts.

**Location:** `src/components/features/trading/Chart.tsx`

**Props:**
```typescript
interface ChartProps {
  selectedPair?: string;     // Trading pair to display (e.g., "ETH/USD")
  height: number;            // Chart height in pixels
  onHeightChange: (height: number) => void;  // Callback for height changes
}
```

**Key Features:**
- Interactive TradingView chart integration
- Resizable chart height with drag handle
- Custom styling and theme configuration
- Support for special pairs (FX, Metal, Equity, Crypto indices)
- Real-time price updates via custom datafeed

**Usage Example:**
```tsx
<Chart 
  selectedPair="BTC/USD"
  height={500}
  onHeightChange={(newHeight) => setChartHeight(newHeight)}
/>
```

### WalletEquity Component
Displays user's wallet balances and position information.

**Location:** `src/components/features/trading/WalletEquity.tsx`

**Key Features:**
- Shows total account equity
- Displays unrealized PnL across all positions
- Shows margin wallet balance
- Shows USDC wallet balance
- Automatic updates via hooks

**Hooks Used:**
- `usePositions`: For position data and PnL
- `useBalances`: For wallet balances
- `useAccount`: For wallet connection status

**States:**
- Loading states for positions and balances
- Connected/disconnected wallet states
- PnL calculation with fees included

### LeverageDialog Component
A dialog for adjusting trading leverage.

**Location:** `src/components/features/trading/LeverageDialog.tsx`

**Props:**
```typescript
interface LeverageDialogProps {
  leverage: string;
  onLeverageChange: (value: string) => void;
}
```

**Features:**
- Slider-based leverage adjustment
- Range: 1x to 200x
- Visual markers at key leverage points
- Real-time value updates

**Usage Example:**
```tsx
<LeverageDialog
  leverage="20"
  onLeverageChange={(newLeverage) => setLeverage(newLeverage)}
/>
```

### PairHeader Component
Header component for displaying and selecting trading pairs.

**Location:** `src/components/features/trading/PairHeader.tsx`

**Props:**
```typescript
interface PairHeaderProps {
  selectedPair: string;
  onPairChange: (pair: string) => void;
}
```

**Features:**
- Trading pair selection
- Price display
- Market information
- Integration with market data hooks

### PositionsTable Component
Displays active trading positions and their details.

**Location:** `src/components/features/trading/PositionsTable.tsx`

**Key Features:**
- List of open positions
- Position details (size, entry price, PnL)
- Position management actions
- Real-time updates

**Hooks Used:**
- `usePositions`: For position data
- `useMarketData`: For price updates
- `useBalances`: For margin information

### OrderCard Component
Main component for placing trading orders.

**Location:** `src/components/features/trading/OrderCard.tsx`

**Props:**
```typescript
interface OrderCardProps {
  leverage: string;
  onLeverageChange: (value: string) => void;
  assetId: string;
  initialReferralCode?: string;
}
```

**Features:**
- Order type selection (Market/Limit)
- Position size input
- Leverage adjustment
- Long/Short position selection
- Order preview and confirmation
- Margin requirements calculation

## Component Interactions

### Data Flow
1. Market data flows from hooks to components
2. User actions in components trigger hook functions
3. State updates propagate through the component tree

### State Management
- Trading pair selection affects multiple components
- Position updates reflect across PositionsTable and WalletEquity
- Order placement updates positions and balances

### Hook Dependencies
- Components use multiple hooks for different functionalities
- Real-time updates handled through hook subscriptions
- Error states and loading states managed at component level

## Best Practices

### Performance
```typescript
// Use memo for expensive calculations
const memoizedValue = useMemo(() => {
  return expensiveCalculation(prop);
}, [prop]);

// Use callback for functions passed as props
const handleChange = useCallback((value) => {
  onChange(value);
}, [onChange]);
```

### Error Handling
```typescript
// Component level error handling
try {
  await someAction();
} catch (error) {
  setError(error.message);
  // Show error UI
}
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

## Styling
- Uses Tailwind CSS for styling
- Consistent dark theme across components
- Responsive design patterns
- Custom UI components from shared library 

## PositionsTable Component System

### Main Component (`PositionsTable.tsx`)
The main container component that manages the trading interface's position display system.

**Location:** `src/components/features/trading/PositionsTable.tsx`

**State Management:**
```typescript
const [activeTab, setActiveTab] = useState<"positions" | "orders" | "trades">("positions");
const [hoveredPosition, setHoveredPosition] = useState<string | null>(null);
const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
```

**Hook Dependencies:**
```typescript
const { positions, loading: positionsLoading } = usePositions();
const { orders, triggerOrders } = useOrders();
const { closePosition, closingPositions } = usePositionActions();
```

**Key Features:**
- Tabbed interface (Positions, Orders, History)
- Real-time position updates
- PnL tooltips with portal rendering
- Responsive design with mobile optimization

### Subcomponents

#### 1. PositionsContent
**Location:** `src/components/features/trading/PositionTable/PositionsContent.tsx`

**Props Interface:**
```typescript
interface PositionsContentProps {
  positions: Position[];
  triggerOrders?: TriggerOrder[];
  loading: boolean;
  error: Error | null;
  closingPositions: { [key: number]: boolean };
  handleClosePosition: (position: Position) => void;
  setRef: (positionId: string) => (el: HTMLTableCellElement | null) => void;
  handleMouseEnter: (positionId: string) => void;
  setHoveredPosition: (positionId: string | null) => void;
}
```

**Key Features:**
- Position details display
- Interactive row actions
- Mobile-responsive layout
- Real-time price updates
- Stop Loss/Take Profit management
- Position modification dialogs

**Calculations:**
```typescript
// PnL Calculation with Fees
const calculateFinalPnl = (position: Position) => {
  const pnlWithoutFees = parseFloat(position.pnl.replace(/[^0-9.-]/g, ""));
  const totalFees = parseFloat(position.fees.positionFee) +
                   parseFloat(position.fees.borrowFee) +
                   parseFloat(position.fees.fundingFee);
  return (pnlWithoutFees - totalFees).toFixed(2);
};

// Leverage Calculation
const calculateLeverage = (size: string, margin: string) => {
  const sizeValue = parseFloat(size.replace(/[^0-9.-]/g, ""));
  const marginValue = parseFloat(margin.replace(/[^0-9.-]/g, ""));
  return (sizeValue / marginValue).toFixed(1);
};
```

#### 2. OrdersContent
**Location:** `src/components/features/trading/PositionTable/OrdersContent.tsx`

**Props Interface:**
```typescript
interface OrdersContentProps {
  orders: Order[];
  triggerOrders: TriggerOrder[] | undefined;
  loading: boolean;
  error: Error | null;
}
```

**Features:**
- Active orders display
- Trigger orders management
- Order cancellation
- Order modification

#### 3. TradesContent
**Location:** `src/components/features/trading/PositionTable/TradesContent.tsx`

**Key Features:**
- Trade history display
- PnL tracking
- Date formatting
- Detailed trade information

**Date Formatting:**
```typescript
const formatShortDate = (dateStr: string) => ({
  date: new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  }).format(new Date(dateStr)),
  time: new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(new Date(dateStr))
});
```

#### 4. PnLTooltip
**Location:** `src/components/features/trading/PositionTable/PnLTooltip.tsx`

**Props Interface:**
```typescript
interface PnLTooltipProps {
  position: Position;
  rect: DOMRect;
}
```

**Features:**
- Detailed PnL breakdown
- Fee information display
- Position metrics
- Dynamic positioning

### Responsive Design

**Desktop View:**
- Full table view with all columns
- Hover effects for additional information
- Inline actions

**Mobile View:**
```typescript
<TableCell className="flex flex-col md:table-cell md:block">
  <div className="flex items-center justify-between">
    {/* Mobile-specific layout */}
  </div>
</TableCell>
```

### State Management Patterns

1. **Position Updates:**
```typescript
useEffect(() => {
  const interval = setInterval(refetch, 10000);
  return () => clearInterval(interval);
}, [refetch]);
```

2. **Dialog Management:**
```typescript
const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
const [isDialogOpen, setIsDialogOpen] = useState(false);
```

3. **Portal Management:**
```typescript
useEffect(() => {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.zIndex = "9999";
  document.body.appendChild(container);
  setPortalContainer(container);

  return () => {
    document.body.removeChild(container);
  };
}, []);
```

### Integration Examples

1. **Adding a New Position Row:**
```typescript
<TableRow 
  key={position.positionId}
  className="cursor-pointer hover:[background-color:#1f1f29]"
  onClick={() => handleRowClick(position)}
>
  {/* Position data cells */}
</TableRow>
```

2. **Implementing Position Actions:**
```typescript
const handleClosePosition = async (position: Position) => {
  try {
    await closePosition(
      position.positionId,
      position.isLong,
      Number(position.markPrice),
      parseFloat(position.size)
    );
  } catch (error) {
    console.error("Error closing position:", error);
  }
};
```

### Error Handling

```typescript
{error ? (
  <TableRow>
    <TableCell colSpan={8} className="text-center text-short">
      {error.message}
    </TableCell>
  </TableRow>
) : null}
```

### Performance Optimization

1. **Memoization:**
```typescript
const memoizedPositions = useMemo(() => 
  positions.map(formatPosition),
  [positions]
);
```

2. **Event Handling:**
```typescript
const handleMouseEnter = useCallback((positionId: string) => {
  const cell = cellRefs.current[positionId];
  if (cell) {
    setHoveredPosition(positionId);
  }
}, []);
```

### Testing Considerations

1. **Component Testing:**
```typescript
describe('PositionsTable', () => {
  it('renders positions correctly', () => {
    render(<PositionsTable address="0x..." />);
    expect(screen.getByText('Positions')).toBeInTheDocument();
  });
});
```

2. **Integration Testing:**
```typescript
test('closes position when close button clicked', async () => {
  render(<PositionsTable />);
  const closeButton = screen.getByText('Close');
  await userEvent.click(closeButton);
  expect(closePosition).toHaveBeenCalled();
});
``` 

## OrderCard Component System

### Main Component (`OrderCard.tsx`)
The core component for placing trading orders, managing positions, and handling user interactions.

**Location:** `src/components/features/trading/OrderCard/index.tsx`

**Props Interface:**
```typescript
interface OrderCardProps {
  leverage: string;
  onLeverageChange: (value: string) => void;
  assetId: string;
  initialReferralCode?: string;
}
```

### State Management

**Local State:**
```typescript
const [activeTab, setActiveTab] = useState("market");
const [referrerCode, setReferrerCode] = useState("");
const [resolvedReferrer, setResolvedReferrer] = useState(DEFAULT_REFERRER);
const [placingOrders, setPlacingOrders] = useState(false);
```

**Hook Dependencies:**
```typescript
const { isConnected } = useAccount();
const { smartAccount, setupSessionKey } = useSmartAccount();
const { allMarkets } = useMarketData();
const { prices } = usePrices();
const { balances } = useBalances("arbitrum");
```

### Key Features

#### 1. Order Types
- Market Orders
- Limit Orders
- Stop Orders
- Take Profit/Stop Loss settings

#### 2. Position Management
```typescript
const {
  formState,
  handleAmountChange,
  handleMarginChange,
  handleLimitPriceChange,
  handleSliderChange,
  toggleDirection,
  toggleTPSL,
} = useOrderForm({ leverage });
```

#### 3. Trade Calculations
```typescript
const calculatedMargin = formState.amount
  ? parseFloat(formState.amount) / parseFloat(leverage)
  : 0;

const calculatedSize = formState.amount ? parseFloat(formState.amount) : 0;
const tradingFee = calculatedSize * (routes[bestRoute]?.tradingFee || 0);
const totalRequired = calculatedMargin + tradingFee;
```

#### 4. Balance Checks
```typescript
const marginWalletBalance = parseFloat(balances?.formattedMusdBalance || "0");
const onectWalletBalance = parseFloat(balances?.formattedUsdcBalance || "0");
const combinedBalance = marginWalletBalance + onectWalletBalance;
const hasInsufficientBalance = totalRequired > combinedBalance;
```

### Subcomponents

#### 1. MarketOrderForm
**Purpose**: Handles market order entry
**Features**:
- Size input
- Leverage adjustment
- Direction selection (Long/Short)
- Real-time price updates

#### 2. LimitOrderForm
**Purpose**: Manages limit order creation
**Features**:
- Limit price input
- Size and leverage settings
- Advanced order types
- Price triggers

#### 3. TradeDetails
**Purpose**: Displays order information and calculations
**Features**:
- Entry price display
- Fee calculations
- Margin requirements
- Position size details
- Routing information

### Order Placement Flow

1. **Validation**:
```typescript
const isValid = (amount: string) => {
  const numAmount = parseFloat(amount);
  return !isNaN(numAmount) && numAmount > 0;
};
```

2. **Order Execution**:
```typescript
const handlePlaceOrder = async () => {
  try {
    setPlacingOrders(true);
    const orderParams = {
      pair: parseInt(assetId, 10),
      isLong: formState.isLong,
      price: tradeDetails.entryPrice!,
      margin: calculatedMargin,
      size: calculatedSize,
      // ... other parameters
    };
    await executeOrder(orderParams);
  } catch (error) {
    console.error('Error placing order:', error);
    // Error handling
  }
};
```

### Referral System

**Implementation:**
```typescript
const handleReferrerBlur = async () => {
  if (tempReferrerCode) {
    const address = await getReferralAddress(tempReferrerCode);
    if (address !== DEFAULT_REFERRER) {
      setReferrerCode(tempReferrerCode);
      setResolvedReferrer(address);
      localStorage.setItem(STORAGE_KEY_CODE, tempReferrerCode);
    }
  }
};
```

### Error Handling

1. **Balance Validation**:
```typescript
const needsDeposit = totalRequired > marginWalletBalance && 
                    totalRequired <= combinedBalance;
```

2. **Order Validation**:
```typescript
disabled={
  placingOrders ||
  isNetworkSwitching ||
  hasInsufficientBalance ||
  !isValid(formState.amount) ||
  calculatedSize > availableLiquidity
}
```

### Integration Examples

1. **Connecting OrderCard with Market Data**:
```typescript
const market = allMarkets.find((m) => m.assetId === assetId);
const basePair = market?.pair?.split("/")[0].toLowerCase();
const currentPrice = prices[basePair]?.price;
```

2. **Handling Order Submission**:
```typescript
<Button
  variant="market"
  className="w-full mt-4"
  disabled={/* validation logic */}
  onClick={handleButtonClick}
>
  {getButtonText()}
</Button>
```

### Mobile Responsiveness

```typescript
<Card className="w-full md:w-[350px]">
  <CardContent className="p-4">
    {/* Responsive layout content */}
  </CardContent>
</Card>
```

### Performance Considerations

1. **Price Updates**:
```typescript
useEffect(() => {
  if (currentPrice) {
    setFormState((prev) => ({
      ...prev,
      entryPrice: activeTab === "market" ? currentPrice : formState.limitPrice
    }));
  }
}, [prices, assetId, activeTab]);
```

2. **Memoization**:
```typescript
const memoizedTradeDetails = useMemo(() => 
  calculateTradeDetails(formState),
  [formState, leverage]
);
```

### Testing Scenarios

1. **Order Placement**:
```typescript
test('places market order successfully', async () => {
  render(<OrderCard {...props} />);
  // Test implementation
});
```

2. **Validation**:
```typescript
test('validates insufficient balance', () => {
  render(<OrderCard {...props} />);
  // Test implementation
});
``` 

## Deposit System

### Main Component (`DepositBox`)
**Location:** `src/components/features/trading/deposit/index.tsx`

The deposit system manages user funds across different wallets and networks.

**State Management:**
```typescript
const [smartAccountAmount, setSmartAccountAmount] = useState("");
const [tradingAmount, setTradingAmount] = useState("");
const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>("arbitrum");
```

### Key Features

#### 1. Multi-Wallet Support
- EOA (External Owned Account) Wallet
- Smart Account (1CT Wallet)
- Trading Account (Margin Balance)

#### 2. Cross-Chain Functionality
- Arbitrum support
- Optimism support
- Cross-chain deposits

### Subcomponents

#### 1. DepositForm
**Location:** `src/components/features/trading/deposit/DepositForm.tsx`

**Props Interface:**
```typescript
interface ExtendedDepositFormProps {
  type: "smart-account" | "trading";
  amount: string;
  onAmountChange: (value: string) => void;
  onMaxClick: () => void;
  isLoading: boolean;
  disabled: boolean;
  balances: any;
  selectedNetwork?: NetworkType;
  onNetworkChange?: (network: NetworkType) => void;
  onDeposit: () => void;
  onWithdraw: () => void;
  needsApproval?: boolean;
  isApproving?: boolean;
  chain?: number;
}
```

**Features:**
- Amount input with max button
- Network selection
- Deposit/Withdraw actions
- USDC approval handling
- Cross-chain deposit support

#### 2. BalanceDisplay
**Location:** `src/components/features/trading/deposit/BalanceDisplay.tsx`

**Purpose**: Shows balances across different wallets

**Features:**
- EOA balance display
- Smart account balance
- Margin balance
- Address display with copy function
- Loading states

#### 3. CrossChainDepositCall
**Location:** `src/components/features/trading/deposit/CrossChainDepositCall.tsx`

**Purpose**: Handles cross-chain deposits between networks

**Features:**
- Chain switching
- Cross-chain transfers
- Transaction tracking
- Error handling

### Transaction Handling

#### 1. Direct Deposits
```typescript
const handleTradingOperation = async (type: "deposit" | "withdraw", amount: string) => {
  try {
    const response = await fetch("API_ENDPOINT", {
      method: "POST",
      body: JSON.stringify({
        type,
        tokenAddress: USDC_TOKEN,
        amount,
        userAddress: smartAccount.address,
      }),
    });
    // Process response and execute transaction
  } catch (error) {
    // Error handling
  }
};
```

#### 2. Approval Flow
```typescript
const handleApproveAndDeposit = async (amount: string) => {
  // 1. Approve USDC spending
  const approveCalldata = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "approve",
    args: [TRADING_CONTRACT, parseUnits(amount, 6)],
  });

  // 2. Execute deposit
  await kernelClient.sendTransaction({
    calls: [
      { to: USDC_TOKEN, data: approveCalldata },
      { to: depositData.vaultAddress, data: depositData.calldata },
    ],
  });
};
```

### Network Management

```typescript
const isOnCorrectChain = () => {
  if (selectedNetwork === "arbitrum") {
    return chain?.id === arbitrum.id;
  } else {
    return chain?.id === optimism.id;
  }
};

const handleSwitchNetwork = () => {
  if (selectedNetwork === "arbitrum") {
    switchChain?.({ chainId: arbitrum.id });
  } else {
    switchChain?.({ chainId: optimism.id });
  }
};
```

### UI Components

#### 1. Action Buttons
```typescript
<ActionButtons
  type={type}
  onDeposit={handleTradingDeposit}
  onWithdraw={handleTradingWithdraw}
  isLoading={isLoading}
  isApproving={isApproving}
  needsApproval={needsApproval}
  depositDisabled={/* validation logic */}
  withdrawDisabled={/* validation logic */}
/>
```

#### 2. Network Selector
```typescript
<NetworkSelector
  selectedNetwork={selectedNetwork}
  onNetworkChange={onNetworkChange}
/>
```

### Error Handling

1. **Transaction Errors**:
```typescript
catch (error: any) {
  if (error?.message?.includes("User rejected")) {
    toast({
      title: "Error",
      description: "User rejected the transaction",
      variant: "destructive",
    });
  } else {
    toast({
      title: "Error",
      description: "Failed to process transaction",
      variant: "destructive",
    });
  }
}
```

2. **Balance Validation**:
```typescript
const depositDisabled = !amount || 
  parseFloat(amount) > parseFloat(balances.formattedUsdcBalance);
```

### Integration Examples

1. **Setting Up Smart Account**:
```typescript
const handleSetupSmartAccount = async () => {
  try {
    await setupSessionKey();
    toast({
      title: "Success",
      description: "1CT Account successfully created",
    });
    refetchBalances();
  } catch (error) {
    // Error handling
  }
};
```

2. **Cross-Chain Deposit**:
```typescript
const handleDeposit = async () => {
  const amountInUsdcUnits = parseUnits(amount, 6).toString();
  const quoteUrl = `https://li.quest/v1/quote?...`;
  const response = await fetch(quoteUrl);
  const { transactionRequest } = await response.json();
  
  const hash = await walletClient.sendTransaction({
    to: transactionRequest.to,
    data: transactionRequest.data,
    value: BigInt(transactionRequest.value || "0"),
  });
};
``` 