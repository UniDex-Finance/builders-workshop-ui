# Adding a New Chain to the DepositSystem
## Required Files and Changes
### 1. src/wagmi.ts
 Import chain from wagmi/chains
 Add to chains array
 Add RPC transport configuration
### 2. src/hooks/use-balances.ts
 Add USDC token address constant
 Add useContractRead hook for USDC balance
 Add new balance fields to Balances interface
 - `eoaNewChainUsdcBalance: bigint`
 - `formattedEoaNewChainUsdcBalance: string`
 Update setBalances calls with new chain balances
 Add refetch function to refetchBalances
### 3. src/components/features/trading/account/DepositCard.tsx
 Import chain logo from public/static/images/chain-logos/
 Add chain to CHAIN_CONFIG with configuration details
 Add case for new chain in getAvailableBalance()
 Add SelectItem to UI with chain logo and name
### 4. src/components/features/trading/deposit/CrossChainDepositCall.tsx
 Import chain from wagmi/chains
 Add chain to CHAIN_CONFIG with configuration details
## Required Information
### Chain Details
 Chain ID
 RPC URL
 USDC contract address
 Chain logo (.svg format)
### Configuration Options
 Whether chain needs quotes for transfers
 Whether chain needs approvals for transfers
## Example
dding Ethereum mainnet:typescript
// USDC address: 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
// Needs quotes: true
// Needs approvals: true