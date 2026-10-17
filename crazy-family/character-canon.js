export const CHARACTER_CANON_LOCK_ID = 'crazy-family-character-canon-v1';

export const CHARACTER_CANON = Object.freeze({
  libi: Object.freeze({
    id: 'libi',
    version: 'v025',
    asset: 'assets/libi-sprites-v025.png',
    width: 0.9,
    height: 1.34,
    spriteColumns: 5,
    spriteRows: 2,
  }),
  dad: Object.freeze({
    id: 'dad',
    version: 'v028',
    asset: 'assets/crazy-family/dad-sprites-v028.png',
    width: 1.18,
    height: 1.9,
    spriteColumns: 5,
    spriteRows: 2,
  }),
});

export const APPROVED_LIBI_ASSET = CHARACTER_CANON.libi.asset;
export const APPROVED_DAD_ASSET = CHARACTER_CANON.dad.asset;

export function getCanonicalCharacter(kind) {
  const canonical = CHARACTER_CANON[kind];
  if (!canonical) throw new Error(`Unknown Crazy Family character kind: ${kind}`);
  return canonical;
}
