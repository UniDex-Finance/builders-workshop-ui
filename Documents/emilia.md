# UniDex Trading Assistant System Overview

## Introduction
This backend system powers Emilia, UniDex's dedicated trading assistant. The system processes natural language trading requests and converts them into structured trade parameters that can be used by the frontend to execute trades.

## System Components

### Trading Assistant (Emilia)
- Powered by Claude AI
- Only responds to trading-related queries
- Handles both single and multiple trade requests (up to 5 trades)
- Validates trading pairs and user balances
- Maintains consistent response formatting

### Supported Trading Pairs
Currently supported pairs:
- BTC/USD
- ETH/USD
- SOL/USD

## API Endpoints

### POST /api/chat
Main endpoint for interacting with Emilia.

#### Request Format
```json
{
  "message": "User's trading request",
  "balance": 1000
}
```

#### Response Format

For successful single trades:
```json
{
  "confirmationText": "Okay, so you want me to place a BTC/USD long for you using 10x leverage and $100 of collateral?",
  "trades": [
    {
      "isLong": true,
      "Pair": "BTC/USD",
      "Leverage": "10x",
      "Collateral": "100"
    }
  ],
  "messageId": "msg_xxx",
  "isError": false
}
```

For successful multiple trades:
```json
{
  "confirmationText": "Okay, so you want me to place these trades:\n1. BTC/USD long using 10x leverage and $100 of collateral\n2. ETH/USD short using 5x leverage and $50 of collateral\n\nTotal collateral needed: $150",
  "trades": [
    {
      "isLong": true,
      "Pair": "BTC/USD",
      "Leverage": "10x",
      "Collateral": "100"
    },
    {
      "isLong": false,
      "Pair": "ETH/USD",
      "Leverage": "5x",
      "Collateral": "50"
    }
  ],
  "messageId": "msg_xxx",
  "isError": false
}
```

For errors:
```json
{
  "confirmationText": "Error message explaining the issue",
  "trades": null,
  "messageId": "msg_xxx",
  "isError": true
}
```

### GET /health
Health check endpoint that returns `{ "status": "ok" }`.

## Error Handling

The system handles several types of errors:
1. Unsupported trading pairs
2. Insufficient balance
3. Exceeding maximum trade limit (5 trades)
4. Non-trading related queries

## Environment Setup

Required environment variables:
```env
CLAUDE_API_KEY=your_api_key_here
PORT=3000
```

## Usage Examples

### Single Trade Request
User: "I want to long BTC with 10x leverage and $100"
- System validates BTC/USD is supported
- Checks if balance ≥ $100
- Returns structured trade parameters

### Multiple Trade Request
User: "I want to long BTC and ETH with 10x leverage and $50 each"
- System validates both pairs
- Checks if balance ≥ $100 (total)
- Returns structured parameters for both trades

### Error Cases
1. "I want to trade DOGE/USD"
   - Returns error about unsupported pair
2. "What's the weather like?"
   - Returns message about trading-only functionality
3. Balance $50, requesting $100 trade
   - Returns insufficient balance error 