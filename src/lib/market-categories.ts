export type MarketCategory = 'All' | 'Favorites' | 'New' | 'Majors' | 'Meme' | 'Trending' | 'DeFi';

// Define the pairs for each category
const categoryPairs: Record<MarketCategory, string[]> = {
  All: [], // Special case - handled differently
  Favorites: [], // Special case - handled by user preferences
  New: [
    'SPY/USD',
    'QQQ/USD',
    'XAG/USD',
    'XAU/USD',
    'EIGEN/USD'
  ],
  Majors: [
    'BTC/USD',
    'ETH/USD',
    'SOL/USD',
    'BNB/USD',
    'XRP/USD',
    'AVAX/USD',
    'MATIC/USD',
    'LINK/USD',
    'DOT/USD',
    'ADA/USD'
  ],
  Meme: [
    'DOGE/USD',
    'SHIB/USD',
    'PEPE/USD',
    'BONK/USD',
    'FLOKI/USD',
    'WIF/USD',
    'MEW/USD'
  ],
  Trending: [
    'SOL/USD',
    'JUP/USD',
    'DOGE/USD',
    'WIF/USD',
    'BONK/USD'
  ],
  DeFi: [
    'UNI/USD',
    'AAVE/USD',
    'MKR/USD',
    'SNX/USD',
    'COMP/USD',
    'SUSHI/USD',
    'CRV/USD',
    'LDO/USD',
    'RAY/USD',
    'GMX/USD'
  ]
};

export const AVAILABLE_CATEGORIES = Object.keys(categoryPairs) as MarketCategory[];

export function getMarketCategory(pair: string): MarketCategory[] {
  const categories: MarketCategory[] = ['All'];
  
  // Check each category (except All and Favorites) for the pair
  Object.entries(categoryPairs).forEach(([category, pairs]) => {
    if (category !== 'All' && category !== 'Favorites') {
      if (pairs.includes(pair)) {
        categories.push(category as MarketCategory);
      }
    }
  });
  
  return categories;
}

export function getPairsInCategory(category: MarketCategory, allPairs: string[], favorites: string[]): string[] {
  if (category === 'All') {
    return allPairs;
  }
  
  if (category === 'Favorites') {
    return favorites;
  }
  
  return categoryPairs[category];
} 