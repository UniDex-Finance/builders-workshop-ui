// src/lib/heatmap-categories.ts

// Define the specific categories for the heatmap visualization
export const HEATMAP_CATEGORIES = [
    "Layer 1",
    "Layer 2",
    "Meme Coins",
    "DeFi & Utility", // Combined for breadth
    "Infrastructure", // Keeping Infra for things like Oracles, DA
    "Interoperability",
    "NFT & Gaming",
    "Indices & FX",
    "Payment", // Simplified from "Payment & Value"
    // "Privacy", // Add if needed later
    // "Stablecoin", // Add if needed later
    "Other"   // Catch-all for pairs not fitting elsewhere
] as const; // Use "as const" for type safety

// Derive the type from the constant array
export type HeatmapCategory = typeof HEATMAP_CATEGORIES[number];

// --- Define Pairs for Each Category ---

const LAYER1_PAIRS: ReadonlySet<string> = new Set([
    "BTC/USD", "ETH/USD", "SOL/USD", "AVAX/USD", "BNB/USD",
    "ADA/USD", "NEAR/USD", "APT/USD", "SUI/USD", "TON/USD",
]);

const LAYER2_PAIRS: ReadonlySet<string> = new Set([
    "ARB/USD", "OP/USD", "MERL/USD", "STRK/USD",
]);

const MEME_COIN_PAIRS: ReadonlySet<string> = new Set([
    "DOGE/USD", "SHIB/USD", "BOME/USD", "POPCAT/USD", "MEW/USD",
    "PEPE/USD", "DEGEN/USD",
]);

const DEFI_UTILITY_PAIRS: ReadonlySet<string> = new Set([
     "AAVE/USD", "UNI/USD", // Kept old examples if relevant
     "GMX/USD", "AERO/USD", "REZ/USD", "ETHFI/USD", "RDNT/USD",
     "EIGEN/USD",
]);

const INFRASTRUCTURE_PAIRS: ReadonlySet<string> = new Set([
    "LINK/USD", "INJ/USD", "TIA/USD", "SAFE/USD", "ORDI/USD",
    "TAO/USD", "WLD/USD", "BEAM/USD",
]);

const INTEROPERABILITY_PAIRS: ReadonlySet<string> = new Set([
    "ATOM/USD", "ZRO/USD", "OMNI/USD", "DYM/USD", "AVAIL/USD",
    "RUNE/USD", // Moved RUNE here as cross-chain DEX
]);

const NFT_GAMING_PAIRS: ReadonlySet<string> = new Set([
    "APE/USD", "ALICE/USD", "RLB/USD", "NOT/USD",
]);

const INDICES_FX_PAIRS: ReadonlySet<string> = new Set([
    "EUR/USD", "GBP/USD", "XAU/USD", "XAG/USD", "GMCI30/USD",
    "GMCL2/USD", "GMMEME/USD", "QQQ/USD", "SPY/USD",
]);

const PAYMENT_PAIRS: ReadonlySet<string> = new Set([
    "LTC/USD", "XRP/USD",
]);

// Add sets for Privacy, Stablecoin if needed

/**
 * Determines the single heatmap category for a given trading pair.
 * Assigns the pair to the first matching category based on a defined priority.
 */
export function getHeatmapCategory(pair: string): HeatmapCategory {
    if (LAYER1_PAIRS.has(pair)) return "Layer 1";
    if (LAYER2_PAIRS.has(pair)) return "Layer 2";
    if (MEME_COIN_PAIRS.has(pair)) return "Meme Coins";
    if (DEFI_UTILITY_PAIRS.has(pair)) return "DeFi & Utility";
    if (INFRASTRUCTURE_PAIRS.has(pair)) return "Infrastructure";
    if (INTEROPERABILITY_PAIRS.has(pair)) return "Interoperability";
    if (NFT_GAMING_PAIRS.has(pair)) return "NFT & Gaming";
    if (INDICES_FX_PAIRS.has(pair)) return "Indices & FX";
    if (PAYMENT_PAIRS.has(pair)) return "Payment";
    // Add checks for Privacy, Stablecoin if those sets are created

    // Default category if none of the specific categories match
    return "Other";
}
