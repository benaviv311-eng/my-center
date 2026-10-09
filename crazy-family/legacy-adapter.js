const noop = () => {};

export function createLegacyAdapter(windowRef = globalThis.window) {
  const retained = windowRef?.__crazyFamilyRetainedApi || {};
  return {
    getSnapshot: retained.getSnapshot?.bind(retained) || (() => ({
      player: { lives: 3, stamina: 100, shield: 0, inventory: [], selected: 0 },
      dad: { singing: false, state: 'idle' },
      dizziness: 0,
      controlsReversed: false,
    })),
    setWorldPose: retained.setWorldPose?.bind(retained) || noop,
    collectItem: retained.collectItem?.bind(retained) || (() => false),
    useItem: retained.useItem?.bind(retained) || (() => false),
    damagePlayer: retained.damagePlayer?.bind(retained) || noop,
    updateStamina: retained.updateStamina?.bind(retained) || (() => 100),
    setDadWorldDistance: retained.setDadWorldDistance?.bind(retained) || noop,
    setDadSpatial: retained.setDadSpatial?.bind(retained) || noop,
    startDadSong: retained.startDadSong?.bind(retained) || (() => false),
    dadSongIsPlaying: retained.dadSongIsPlaying?.bind(retained) || (() => false),
    playDadPre: retained.playDadPreForMovieSet?.bind(retained) || (() => false),
    triggerDadHouseState: retained.triggerDadHouseState?.bind(retained) || (() => false),
    applyDadSongExposure: retained.applyDadSongExposure?.bind(retained) || (() => ({ controlsReversed: false })),
    tickRetainedSystems: retained.tickRetainedSystems?.bind(retained) || noop,
  };
}
