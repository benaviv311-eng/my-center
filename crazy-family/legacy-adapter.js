const noop = () => {};

export function createLegacyAdapter(windowRef = globalThis.window) {
  const retained = windowRef?.__crazyFamilyRetainedApi || {};
  return {
    getSnapshot: retained.getSnapshot?.bind(retained) || (() => ({
      player: { lives: 3, stamina: 100, shield: 0, inventory: [] },
      dad: { singing: false, state: 'idle' },
      dizziness: 0,
    })),
    setWorldPose: retained.setWorldPose?.bind(retained) || noop,
    collectItem: retained.collectItem?.bind(retained) || (() => false),
    useItem: retained.useItem?.bind(retained) || (() => false),
    damagePlayer: retained.damagePlayer?.bind(retained) || noop,
    setDadWorldDistance: retained.setDadWorldDistance?.bind(retained) || noop,
    tickRetainedSystems: retained.tickRetainedSystems?.bind(retained) || noop,
  };
}
