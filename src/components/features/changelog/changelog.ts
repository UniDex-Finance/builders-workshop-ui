export interface ChangelogEntry {
  id: string;
  version: string;
  date: string;
  title: string;
  description?: string;
  type: 'major' | 'minor' | 'patch' | 'hotfix';
  categories: ChangeCategory[];
}

export interface ChangeCategory {
  name: string;
  icon?: string;
  color?: string;
  changes: ChangeItem[];
}

export interface ChangeItem {
  text: string;
  badge?: 'new' | 'improved' | 'fixed' | 'breaking' | 'deprecated' | 'security';
}

// This is where you update the changelog - just add new entries to the top of the array
export const changelogData: ChangelogEntry[] = [
  {
    id: "v4.1.6",
    version: "4.1.6",
    date: "2025-04-28", 
    title: "RWA Asset Expansion & Trading System Upgrades",
    description: "Introduced a wide range of RWA asset pairs, a new dynamic spread system, and UI indicators for market status.",
    type: "minor",
    categories: [
      {
        name: "Trading Features",
        icon: "📈",
        changes: [
          { 
            text: "Added new RWA asset pairs: Forex (NZD/USD, USD/JPY, CHF/USD, USD/CAD, AUD/USD), Metals (XPT/USD), Indices (DJI/USD), Commodities (WTI/USD)", 
            badge: "new" 
          },
          { 
            text: "Implemented a new dynamic spread system that changes with market timing for RWA assets", 
            badge: "new" 
          },
          { 
            text: "Removed borrow rates in favor of more aggressive funding rates for applicable pairs", 
            badge: "improved" 
          }
        ]
      },
      {
        name: "UI/UX Updates",
        icon: "🎨",
        changes: [
          { 
            text: "Added UI indicators to show when the market is closed for a specific pair", 
            badge: "new" 
          }
        ]
      }
    ]
  },
  {
    id: "v4.1.5",
    version: "4.1.5",
    date: "2025-04-27", 
    title: "Market Overview & UI/UX Refinements",
    description: "Launched a comprehensive market overview page and several UI/UX enhancements for better trading experience.",
    type: "minor",
    categories: [
      {
        name: "Analytics",
        icon: "📊",
        changes: [
          { 
            text: "New Market Overview page: includes all trading pairs, 24h change, volume stats, sector heatmap, and change over time", 
            badge: "new" 
          }
        ]
      },
      {
        name: "UI/UX Updates",
        icon: "🎨",
        changes: [
          { 
            text: "Added a scrolling ticker in the bottom footer bar showing all pairs and their 24h change", 
            badge: "new" 
          },
          { 
            text: "Charts now automatically assign the most reasonable number of decimal places for improved readability", 
            badge: "improved" 
          }
        ]
      },
      {
        name: "Improvements",
        icon: "✨",
        changes: [
          { 
            text: "Enhanced scrolling ticker with filters for losers, gainers, or favorites", 
            badge: "improved" 
          }
        ]
      },
      {
        name: "Trading Features",
        icon: "📈",
        changes: [
          { 
            text: "Leverage selector now remembers the last used leverage for each pair; defaults to midpoint if no prior selection", 
            badge: "improved" 
          }
        ]
      }
    ]
  },
  {
    id: "v4.1.4",
    version: "4.1.4",
    date: "2024-04-19",
    title: "New Yield & Arbitrage Opportunities",
    description: "Introduced new pages for funding rates, arbitrage, and DeFi lending vaults.",
    type: "minor",
    categories: [
      {
        name: "New Features",
        icon: "🚀",
        color: "purple",
        changes: [
          { 
            text: "New page dedicated to showing funding rates and potential arbitrage opportunities", 
            badge: "new" 
          }
        ]
      },
      {
        name: "DeFi Features",
        icon: "💰",
        changes: [
          { 
            text: "New feature to deposit funds into popular lending vaults (Aave, Compound, 0xFluid) for additional yield", 
            badge: "new" 
          }
        ]
      }
    ]
  },
  {
    id: "v4.1.3",
    version: "4.1.3",
    date: "2025-03-01",
    title: "TP/SL Enhancements & UI Improvements",
    description: "Improved Take Profit / Stop Loss functionality and UI consistency.",
    type: "patch",
    categories: [
      {
        name: "Trading Features",
        icon: "📈",
        changes: [
          { 
            text: "Positions bar now displays closest TP/SL to execution and amount to close", 
            badge: "new" 
          },
          { 
            text: "Added functionality to replace existing TP/SL orders", 
            badge: "new" 
          }
        ]
      },
      {
        name: "UI/UX Updates",
        icon: "🎨",
        changes: [
          { 
            text: "Improved design and style consistency for TP/SL modal", 
            badge: "improved" 
          }
        ]
      }
    ]
  }  
];

// Helper function to get the latest version
export const getLatestVersion = () => changelogData[0];

// Helper function to get all versions
export const getAllVersions = () => changelogData.map(entry => ({
  version: entry.version,
  date: entry.date,
  type: entry.type
})); 