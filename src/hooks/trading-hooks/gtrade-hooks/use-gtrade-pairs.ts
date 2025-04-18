// Map UnidexV4 pairs to gTrade pair indices
export const GTRADE_PAIR_MAPPING: { [key: string]: number } = {
  'BTC/USD': 0,
  'ETH/USD': 1,
  'S/USD': 53,
  'SOL/USD': 33,
  'DOGE/USD': 3,
  'AVAX/USD': 102,
  'BNB/USD': 47,
  'ADA/USD': 5,
  'LINK/USD': 2,
  'ATOM/USD': 103,
  'NEAR/USD': 104,
  'ARB/USD': 109,
  'OP/USD': 141,
  'LTC/USD': 13,
  'GMX/USD': 136,
  'EUR/USD': 21,
  'GBP/USD': 23,
  'INJ/USD': 129,
  'TIA/USD': 144,
  'AERO/USD': 286,
  'MERL/USD': 226,
  'SAFE/USD': 227,
  'OMNI/USD': 224,
  'REZ/USD': 231,
  'ETHFI/USD': 212,
  'BOME/USD': 211,
  'ORDI/USD': 150,
  'DYM/USD': 201,
  'TAO/USD': 223,
  'WLD/USD': 171,
  'POPCAT/USD': 245,
  'ZRO/USD': 236,
  'RUNE/USD': 130,
  'MEW/USD': 251,
  'BEAM/USD': 157,
  'STRK/USD': 200,
  'AAVE/USD': 7,
  'XRP/USD': 19,
  'TON/USD': 107,
  'NOT/USD': 232,
  'ALICE/USD': 263,
  'APE/USD': 55,
  'APT/USD': 138,
  'AVAIL/USD': 255,
  'DEGEN/USD': 252,
  'RDNT/USD': 270,
  'SUI/USD': 153,
  'PEPE/USD': 134,
  'EIGEN/USD': 282,
};

// Reverse mapping function to get UnidexV4 pair from gTrade index
export function getUnidexPairFromGTradePair(gTradePairIndex: number): string | undefined {
  return Object.entries(GTRADE_PAIR_MAPPING).find(
    ([_, index]) => index === gTradePairIndex
  )?.[0];
}