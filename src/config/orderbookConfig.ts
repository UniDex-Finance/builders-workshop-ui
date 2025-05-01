// Defines the structure for grouping options and sigfig mapping per pair

interface GroupingOption {
  value: string;
  label: string;
}

interface PairOrderbookConfig {
  groupingOptions: GroupingOption[];
  // Maps grouping value (string) to nSigFigs (number or null)
  sigFigMapping: { [groupingValue: string]: number | null };
}

// --- Define Reusable Orderbook Configuration Patterns ---

const pattern5Decimal: PairOrderbookConfig = { // Formerly DOGE
  groupingOptions: [
    { value: "0.00001", label: "0.00001" },
    { value: "0.0001", label: "0.0001" },
    { value: "0.001", label: "0.001" },
    { value: "0.01", label: "0.01" },
  ],
  sigFigMapping: {
    "0.00001": 5,
    "0.0001": 4,
    "0.001": 3,
    "0.01": 2,
  },
};

const pattern4Decimal: PairOrderbookConfig = { // Formerly SHIB
  groupingOptions: [
    { value: "0.0001", label: "0.0001" },
    { value: "0.001", label: "0.001" },
    { value: "0.01", label: "0.01" },
    { value: "0.1", label: "0.1" },
  ],
  sigFigMapping: {
    "0.0001": 5,
    "0.001": 4,
    "0.01": 3,
    "0.1": 2,
  },
};

const pattern3Decimal: PairOrderbookConfig = { // Formerly AVAX
  groupingOptions: [
    { value: "0.001", label: "0.001" },
    { value: "0.01", label: "0.01" },
    { value: "0.1", label: "0.1" },
    { value: "1", label: "1" },
  ],
  sigFigMapping: {
    "0.001": 5,
    "0.01": 4,
    "0.1": 3,
    "1": 2,
  },
};

const pattern2Decimal: PairOrderbookConfig = { // Formerly Default
  groupingOptions: [
    { value: "0.01", label: "0.01" },
    { value: "0.1", label: "0.1" },
    { value: "1", label: "1.0" },
    { value: "10", label: "10.0" },
  ],
  sigFigMapping: {
    "0.01": 5,
    "0.1": 4,
    "1": 3,
    "10": 2,
  },
};

const pattern1Decimal: PairOrderbookConfig = { // Formerly ETH
  groupingOptions: [
    { value: "0.1", label: "0.1" },
    { value: "1", label: "1" },
    { value: "10", label: "10" },
    { value: "100", label: "100" },
  ],
  sigFigMapping: {
    "0.1": 5,
    "1": 4,
    "10": 3,
    "100": 2,
  },
};

const patternInteger: PairOrderbookConfig = { // Formerly BTC
  groupingOptions: [
    { value: "1", label: "1" },
    { value: "10", label: "10" },
    { value: "100", label: "100" },
    { value: "1000", label: "1000" },
  ],
  sigFigMapping: {
    "1": 5,
    "10": 4,
    "100": 3,
    "1000": 2,
  },
};

// Main configuration object
// Keys are base currency names (e.g., "BTC", "AVAX")
// Includes a 'default' key for pairs not explicitly listed
// Currencies now reference the predefined patterns above.
export const orderbookConfig: { [currency: string]: PairOrderbookConfig; default: PairOrderbookConfig } = {
  // Default configuration uses the 2-decimal pattern
  default: pattern2Decimal,

  // --- Specific Asset Configurations ---
  BTC: patternInteger,
  ETH: pattern1Decimal,

  // Pattern 2 Decimal
  BNB: pattern2Decimal,
  TAO: pattern2Decimal,
  SOL: pattern2Decimal,
  AAVE: pattern2Decimal,

  // Pattern 3 Decimal
  AVAX: pattern3Decimal,
  LTC: pattern3Decimal,
  GMX: pattern3Decimal,
  LINK: pattern3Decimal,
  INJ: pattern3Decimal,

  // Pattern 4 Decimal
  APT: pattern4Decimal,
  SUI: pattern4Decimal,
  ZRO: pattern4Decimal,
  TIA: pattern4Decimal,
  OMNI: pattern4Decimal,
  NEAR: pattern4Decimal,
  XRP: pattern4Decimal,
  RUNE: pattern4Decimal,
  WLD: pattern4Decimal,
  ATOM: pattern4Decimal,
  ORDI: pattern4Decimal,

  // Pattern 5 Decimal
  DOGE: pattern5Decimal,
  S: pattern5Decimal,
  ADA: pattern5Decimal,
  ARB: pattern5Decimal,
  OP: pattern5Decimal,
  EUR: pattern5Decimal,
  GBP: pattern5Decimal,
  AERO: pattern5Decimal,
  MERL: pattern5Decimal,
  SAFE: pattern5Decimal,
  REZ: pattern5Decimal,
  ETHFI: pattern5Decimal,
  BOME: pattern5Decimal,
  DYM: pattern5Decimal,
  POPCAT: pattern5Decimal,
  MEW: pattern5Decimal,
  BEAM: pattern5Decimal,
  STRK: pattern5Decimal,
  TON: pattern5Decimal,
  NOT: pattern5Decimal,
  RLB: pattern5Decimal,
  ALICE: pattern5Decimal,
  APE: pattern5Decimal,
  AVAIL: pattern5Decimal,
  DEGEN: pattern5Decimal,
  RDNT: pattern5Decimal,
  PEPE: pattern5Decimal,
  EIGEN: pattern5Decimal,
  XAU: pattern5Decimal,
  XAG: pattern5Decimal,
  GMCI30: pattern5Decimal,
  GML2: pattern5Decimal,
  GMMEME: pattern5Decimal,
  QQQ: pattern5Decimal,
  SPY: pattern5Decimal,

}; 