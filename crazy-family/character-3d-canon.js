const CANON = Object.freeze({
  libi: Object.freeze({
    kind: 'libi',
    height: 1.18,
    shoulderWidth: 0.36,
    torsoHeight: 0.42,
    headRadius: 0.16,
    limbRadius: 0.055,
    colors: Object.freeze({
      skin: 0xf3c7a8,
      hair: 0x5a3828,
      flower: 0xff78ad,
      top: 0xf07f87,
      overalls: 0x2d9ba7,
      socksLight: 0xf7eef0,
      socksDark: 0x5b8095,
      shoes: 0xf35c95,
    }),
    markers: Object.freeze({ pigtails: true, flower: true, stripedSocks: true }),
  }),
  dad: Object.freeze({
    kind: 'dad',
    height: 1.78,
    shoulderWidth: 0.58,
    torsoHeight: 0.64,
    headRadius: 0.21,
    limbRadius: 0.075,
    colors: Object.freeze({
      skin: 0xd9aa8a,
      hair: 0x3a251d,
      stubble: 0x5a4035,
      overshirt: 0x2f7f7c,
      undershirt: 0xf0e8d5,
      pants: 0x72839a,
      slippers: 0x7b5037,
    }),
    markers: Object.freeze({ stubble: true, pajamaPants: true, broadTorso: true }),
  }),
});

export function getCharacter3DCanon(kind) {
  const value = CANON[kind];
  if (!value) throw new Error(`Unknown 3D character kind: ${kind}`);
  return value;
}

export const CHARACTER_3D_CANON = CANON;
