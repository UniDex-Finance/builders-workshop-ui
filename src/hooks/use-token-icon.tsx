/**
 * This module provides components and hooks for handling token pair icons in a trading interface.
 * It includes utilities for displaying token icons with proper fallbacks and type safety.
 */
import Image from "next/image";
import { useState, useEffect, memo } from "react";

/**
 * Supported trading pairs and their corresponding icon file names.
 * This mapping ensures type safety and quick lookups for token icons.
 */
export const SUPPORTED_PAIRS = {
  'ETH/USD': 'ETH-USD.svg',
  'BTC/USD': 'BTC-USD.svg',
  'SOL/USD': 'SOL-USD.svg',
  'AVAX/USD': 'AVAX-USD.svg',
  'ARB/USD': 'ARB-USD.svg',
  'MATIC/USD': 'MATIC.svg',
  'LINK/USD': 'LINK-USD.svg',
  'AAVE/USD': 'AAVE-USD.svg',
  'ADA/USD': 'ADA-USD.svg',
  'ATOM/USD': 'ATOM-USD.svg',
  'AERO/USD': 'AERO-USD.webp',
  'AEVO/USD': 'AEVO-USD.svg',
  'ALICE/USD': 'ALICE-USD.svg',
  'APE/USD': 'APE-USD.webp',
  'APT/USD': 'APT-USD.svg',
  'BLUR/USD': 'BLUR-USD.webp',
  'BNB/USD': 'BNB-USD.svg',
  'BOBA/USD': 'BOBA-USD.svg',
  'BOME/USD': 'BOME-USD.webp',
  'CRV/USD': 'CRV-USD.svg',
  'DOGE/USD': 'DOGE-USD.svg',
  'DYDX/USD': 'DYDX-USD.webp',
  'DYM/USD': 'DYM-USD.png',
  'ENS/USD': 'ENS-USD.webp',
  'FTM/USD': 'FTM-USD.svg',
  'GMX/USD': 'GMX-USD.svg',
  'INJ/USD': 'INJ-USD.png',
  'JTO/USD': 'JTO-USD.webp',
  'JUP/USD': 'JUP-USD.png',
  'LDO/USD': 'LDO-USD.webp',
  'LTC/USD': 'LTC-USD.svg',
  'NEAR/USD': 'NEAR-USD.png',
  'OP/USD': 'OP-USD.svg',
  'ORDI/USD': 'ORDI-USD.webp',
  'PEPE/USD': 'PEPE-USD.webp',
  'PYTH/USD': 'PYTH-USD.webp',
  'RDNT/USD': 'RDNT-USD.svg',
  'RNDR/USD': 'RNDR-USD.svg',
  'RUNE/USD': 'RUNE-USD.svg',
  'SEI/USD': 'SEI-USD.webp',
  'SUI/USD': 'SUI-USD.svg',
  'TIA/USD': 'TIA-USD.png',
  'TON/USD': 'TON-USD.svg',
  'UNI/USD': 'UNI.svg',
  'WLD/USD': 'WLD-USD.webp',
  'XMR/USD': 'XMR-USD.svg',
  'XRP/USD': 'XRP-USD.svg',
  'MERL/USD': 'MERL-USD.svg',
  'SAFE/USD': 'SAFE-USD.svg',
  'OMNI/USD': 'OMNI-USD.svg',
  'REZ/USD': 'REZ-USD.svg',
  'ETHFI/USD': 'ETHFI-USD.svg',
  'TAO/USD': 'TAO-USD.png',
  'POPCAT/USD': 'POPCAT-USD.webp',
  'ZRO/USD': 'ZRO-USD.svg',
  'MEW/USD': 'MEW-USD.svg',
  'BEAM/USD': 'BEAM-USD.svg',
  'STRK/USD': 'STRK-USD.png',
  'NOT/USD': 'NOT-USD.svg',
  'RLB/USD': 'RLB-USD.png',
  'AVAIL/USD': 'AVAIL-USD.svg',
  'DEGEN/USD': 'DEGEN-USD.svg',
  'EIGEN/USD': 'EIGEN-USD.svg',
  'XAU/USD': 'XAU-USD.svg',
  'XAG/USD': 'XAG-USD.svg',
  'QQQ/USD': 'QQQ-USD.png',
  'SPY/USD': 'SPY-USD.png',
  'GMCI30/USD': 'GMCI30-USD.svg',
  'GMCL20/USD': 'GMCL20-USD.svg',
  'GMMEME/USD': 'GMMEME-USD.svg',
  'EUR/USD': 'EUR-USD.svg',
  'GBP/USD': 'GBP-USD.svg',
} as const;

// Type for supported trading pairs
export type SupportedPair = keyof typeof SUPPORTED_PAIRS;

// Validate that a string is a supported pair
export const isSupportedPair = (pair: string): pair is SupportedPair => {
  return pair in SUPPORTED_PAIRS;
};

/**
 * Hook to get the image path for a token pair's icon.
 * @param pair - The trading pair (e.g., "ETH/USD")
 * @returns The path to the token icon or null if not found
 */
export const useTokenImagePath = (pair: string) => {
  const [imagePath, setImagePath] = useState<string | null>(null);

  useEffect(() => {
    if (isSupportedPair(pair)) {
      setImagePath(`/static/images/tokens/${SUPPORTED_PAIRS[pair]}`);
    } else {
      setImagePath(null);
    }
  }, [pair]);

  return imagePath;
};

interface TokenIconProps {
  pair: string;
  size?: number;
  className?: string;
  square?: boolean;
}

/**
 * Component to display a token pair's icon with fallback.
 * Memoized to prevent unnecessary re-renders.
 */
export const TokenIcon: React.FC<TokenIconProps> = memo(({ 
  pair, 
  size = 24,
  className = '',
  square = false
}) => {
  const imagePath = useTokenImagePath(pair);
  const baseToken = pair.split("/")[0];

  if (!imagePath) {
    return (
      <div 
        className={`flex items-center justify-center text-xs font-medium ${!square ? 'rounded-full' : ''} bg-muted ${className}`}
        style={{ width: size, height: size }}
      >
        {baseToken[0]}
      </div>
    );
  }

  return (
    <div 
      className={`relative ${!square ? 'rounded-full' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={imagePath}
        alt={`${pair} icon`}
        width={size}
        height={size}
        className={!square ? 'rounded-full' : ''}
      />
    </div>
  );
});

TokenIcon.displayName = 'TokenIcon';

interface TokenPairDisplayProps {
  pair: string;
  iconSize?: number;
  className?: string;
}

/**
 * Component to display a token pair with its icon.
 * Memoized to prevent unnecessary re-renders.
 */
export const TokenPairDisplay: React.FC<TokenPairDisplayProps> = memo(({ 
  pair,
  iconSize = 24,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <TokenIcon pair={pair} size={iconSize} />
      <span>{pair}</span>
    </div>
  );
});

TokenPairDisplay.displayName = 'TokenPairDisplay';

/**
 * Legacy component maintained for backward compatibility.
 * @deprecated Use TokenIcon or TokenPairDisplay components directly
 */
export const PrefetchTokenImages: React.FC<{ pairs: string[] }> = () => null;
