// Canonical KINDO NFT allocation. Founder and Owner are reserved Genius NFTs.
export const KINDO_ALLOCATION = Object.freeze({
  Common: 250,
  Uncommon: 140,
  Rare: 85,
  Epic: 45,
  Legendary: 22,
  Mythic: 10,
  Genius: 3,
});
export const PUBLIC_SUPPLY = 553;
export const TOTAL_SUPPLY = 555;
export const PUBLIC_GENIUS_COUNT = 1;
const total = Object.values(KINDO_ALLOCATION).reduce((sum, count) => sum + count, 0);
if (total !== TOTAL_SUPPLY) throw new Error(`Invalid KINDO allocation total: ${total}`);
if (KINDO_ALLOCATION.Genius - 2 !== PUBLIC_GENIUS_COUNT) throw new Error("Invalid Genius allocation");
export const RARITY_RANGES = Object.freeze([250, 390, 475, 520, 542, 552, 553]);
export function publicRarityNumber(id) {
  if (!Number.isInteger(id) || id < 1 || id > PUBLIC_SUPPLY) throw new Error(`Invalid public token id: ${id}`);
  return RARITY_RANGES.findIndex((upperBound) => id <= upperBound) + 1;
}
