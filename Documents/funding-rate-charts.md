# Market Data API

This API fetches and stores market data from Arbitrum chain contracts, including USDM price and funding rates for multiple assets.

## Base URLs
- Local Development: `http://localhost:3001`
- Production: `https://unidexv4-market-data.up.railway.app`

## ⚠️ Important: Timestamp Format
All timestamps in the API must be Unix timestamps in **milliseconds** (Unix timestamp * 1000).

Example of what NOT to do:
```http
# ❌ WRONG - timestamp in seconds
GET https://unidexv4-market-data.up.railway.app/api/market/1/history?startTime=1735072740
```
This will return data from 1970 because the timestamp is interpreted as seconds since epoch.

Correct way:
```http
# ✅ CORRECT - timestamp in milliseconds
GET https://unidexv4-market-data.up.railway.app/api/market/1/history?startTime=1735072740000
```

Common conversions:
- From seconds to milliseconds: multiply by 1000
- Current time in ms: `Date.now()`
- From Date object: `new Date().getTime()`

Real example from the API:
```javascript
// If you have a Unix timestamp in seconds
const timestampInSeconds = 1735072740;
const timestampInMs = timestampInSeconds * 1000; // 1735072740000

fetch(`https://unidexv4-market-data.up.railway.app/api/market/1/history?startTime=${timestampInMs}`);

// Response will look like:
{
  "market": {
    "id": 1,
    "pair": "BTC/USD"
  },
  "timeRange": {
    "start": "2024-12-24T20:59:00.000Z",  // Correct recent date
    "end": "2024-12-24T21:59:00.000Z"
  },
  "history": [
    {
      "timestamp": "1735072740000",
      "rate": "0.00006360",
      "usdm_price": "1.13694000"
    },
    // ... more data points
  ]
}
```

## Features

- Fetches USDM price from vault contract
- Fetches funding rates for 57 different markets
- Stores historical data in PostgreSQL database
- Provides REST API endpoints for data access
- Updates data every minute

## Setup for Local Development

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with the following variables:
```env
# Database configuration (example for Railway)
DATABASE_URL=postgresql://postgres:password@containers-us-west-XX.railway.app:XXXX/railway

# Server configuration
PORT=3001
```

3. Build the project:
```bash
npm run build
```

## Running the API Locally

Start the server:
```bash
npm start
```

For development with hot reload:
```bash
npm run dev
```

## API Endpoints

### Get Latest Data
```http
# Local
GET http://localhost:3001/api/latest

# Production
GET https://unidexv4-market-data.up.railway.app/api/latest
```
Returns the most recent market data including USDM price and funding rates.

### Get Historical Data for All Markets
```http
# Local
GET http://localhost:3001/api/historical?startTime=1703424343098&endTime=1703510743098

# Production
GET https://unidexv4-market-data.up.railway.app/api/historical?startTime=1703424343098&endTime=1703510743098
```
Returns historical market data between the specified timestamps (in milliseconds).

### Get Historical Data for Specific Market
```http
# Local
GET http://localhost:3001/api/market/1/history?startTime=1703424343098

# Production
GET https://unidexv4-market-data.up.railway.app/api/market/1/history?startTime=1703424343098
```
Returns historical data for a specific market (e.g., 1 for BTC/USD).

Example response:
```json
{
  "market": {
    "id": 1,
    "pair": "BTC/USD"
  },
  "timeRange": {
    "start": "2023-12-24T11:45:43.098Z",
    "end": "2023-12-24T12:45:43.098Z"
  },
  "dataPoints": 60,
  "history": [
    {
      "timestamp": 1703424343098,
      "rate": 0.00152,
      "usdm_price": 113.691
    }
  ]
}
```

### Get Analytics for Funding Rates
```http
# Local
GET http://localhost:3001/api/analytics/rates?startTime=1703424343098&endTime=1703510743098

# Production
GET https://unidexv4-market-data.up.railway.app/api/analytics/rates?startTime=1703424343098&endTime=1703510743098
```
Returns statistical analysis of funding rates for all markets.

Example response:
```json
[
  {
    "market_id": 1,
    "avg_rate": 0.00148,
    "min_rate": 0.00125,
    "max_rate": 0.00175,
    "data_points": 1440
  }
]
```

### Get USDM Price Statistics
```http
# Local
GET http://localhost:3001/api/analytics/usdm?startTime=1703424343098&endTime=1703510743098

# Production
GET https://unidexv4-market-data.up.railway.app/api/analytics/usdm?startTime=1703424343098&endTime=1703510743098
```
Returns statistical analysis of USDM price.

Example response:
```json
{
  "avg_price": 113.542,
  "min_price": 113.123,
  "max_price": 113.981,
  "data_points": 1440
}
```

### Debug Latest Full Data
```http
# Local
GET http://localhost:3001/api/debug/latest-full

# Production
GET https://unidexv4-market-data.up.railway.app/api/debug/latest-full
```
Returns detailed information about the latest data point with market names.

### Get Historical Data by Duration
```http
# Get last 30 days of data
GET https://unidexv4-market-data.up.railway.app/api/market/1/history/duration/30d

# Get last 24 hours of data
GET https://unidexv4-market-data.up.railway.app/api/market/1/history/duration/24h

# Get last 2 weeks of data
GET https://unidexv4-market-data.up.railway.app/api/market/1/history/duration/2w

# Get last 1 month of data
GET https://unidexv4-market-data.up.railway.app/api/market/1/history/duration/1m
```

Supported duration formats:
- `Xd`: Days (e.g., 30d, 7d, 1d)
- `Xh`: Hours (e.g., 24h, 12h, 1h)
- `Xw`: Weeks (e.g., 4w, 2w, 1w)
- `Xm`: Months (e.g., 6m, 3m, 1m)

Example response:
```json
{
  "market": {
    "id": 1,
    "pair": "BTC/USD"
  },
  "duration": "30d",
  "timeRange": {
    "start": "2023-11-24T21:59:00.000Z",
    "end": "2023-12-24T21:59:00.000Z"
  },
  "dataPoints": 43200,
  "history": [
    {
      "timestamp": "1703424343098",
      "rate": "0.00152",
      "usdm_price": "113.691"
    },
    // ... more data points
  ]
}
```

### Get Historical Data with Granularity
Both timestamp-based and duration-based endpoints support data granularity through the `granularity` parameter.

Supported granularities:
- `1m`: 1 minute (default)
- `5m`: 5 minutes
- `15m`: 15 minutes
- `30m`: 30 minutes
- `1h`: 1 hour
- `4h`: 4 hours
- `8h`: 8 hours
- `24h`: 24 hours

Examples:

```http
# Get 4-hour candles for the last 30 days
GET https://unidexv4-market-data.up.railway.app/api/market/1/history/duration/30d?granularity=4h

# Get hourly data points between timestamps
GET https://unidexv4-market-data.up.railway.app/api/market/1/history?startTime=1703424343098&endTime=1703510743098&granularity=1h
```

Example response with granularity:
```json
{
  "market": {
    "id": 1,
    "pair": "BTC/USD"
  },
  "timeRange": {
    "start": "2023-11-24T21:59:00.000Z",
    "end": "2023-12-24T21:59:00.000Z"
  },
  "granularity": "4h",
  "dataPoints": 180,
  "history": [
    {
      "timestamp": "1703424000000",
      "rate": "0.00152",
      "usdm_price": "113.691",
      "samples": 240  // Number of 1-minute samples in this 4h period
    },
    // ... more data points
  ]
}
```

The `samples` field indicates how many original data points were averaged to create each aggregated point.

## Available Markets

| Market ID | Trading Pair | Description |
|-----------|--------------|-------------|
| 1 | BTC/USD | Bitcoin |
| 2 | ETH/USD | Ethereum |
| 4 | SOL/USD | Solana |
| ... | ... | ... |
| 57 | SPY/USD | S&P 500 ETF |

## Common Use Cases

1. **Fetch BTC Funding Rate History (Last 24 Hours)**
```javascript
// Current time in ms - 24 hours in ms
const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
const baseUrl = "https://unidexv4-market-data.up.railway.app";

// Both timestamps will be in milliseconds
fetch(`${baseUrl}/api/market/1/history?startTime=${oneDayAgo}`);
```

2. **Get Historical Data with Specific Dates**
```javascript
// Convert dates to millisecond timestamps
const startTime = new Date('2023-12-24T00:00:00Z').getTime();
const endTime = new Date('2023-12-25T00:00:00Z').getTime();
fetch(`${baseUrl}/api/historical?startTime=${startTime}&endTime=${endTime}`);
```

3. **Get Average Funding Rates (Last Week)**
```javascript
const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
const now = Date.now();
fetch(`${baseUrl}/api/analytics/rates?startTime=${oneWeekAgo}&endTime=${now}`);
```

4. **Convert Unix Seconds to API Format**
```javascript
// If you have a timestamp in seconds
const unixSeconds = 1703419200;
const milliseconds = unixSeconds * 1000; // 1703419200000
fetch(`${baseUrl}/api/market/1/history?startTime=${milliseconds}`);
```

## Database Schema

### market_data
- id: SERIAL PRIMARY KEY
- timestamp: BIGINT
- usdm_price: DECIMAL(20,8)
- created_at: TIMESTAMP

### funding_rates
- id: SERIAL PRIMARY KEY
- market_data_id: INTEGER (foreign key)
- market_id: INTEGER
- rate: DECIMAL(20,8) 