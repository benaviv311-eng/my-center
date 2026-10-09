import { keyboardIntent, cameraRelativeIntent } from './input.js';
import { createCharacterState, stepCharacter, jumpCharacter, LIBI_MOVEMENT_DEFAULTS } from './movement.js';

export async function createCrazyFamilyGame({ root, legacyAdapter }) {
  const doc = root.ownerDocument || document;
  const canvas = doc.createElement('canvas');
  canvas.className = 'movie-set-canvas';
  canvas.setAttribute('aria-label', 'המשפחה המשגעת — סלון תלת־ממדי');
  canvas.width = 960;
  canvas.height = 600;
  root.replaceChildren(canvas);

  const keys = Object.create(null);
  const flatWorld = {
    groundHeightAt: () => 0,
    resolveCharacterMove: (_from, to) => to,
  };
  let player = createCharacterState({ position: { x: 0, y: 0, z: 3.6 }, ...LIBI_MOVEMENT_DEFAULTS });
  const cameraForward = { x: 0, z: -1 };
  const cameraRight = { x: 1, z: 0 };

  const onKeyDown = (event) => {
    keys[event.key] = true;
    keys[event.key.toLowerCase?.() || event.key] = true;
    if (event.key === ' ' && !event.repeat) player = jumpCharacter(player, 7.2);
  };
  const onKeyUp = (event) => {
    keys[event.key] = false;
    keys[event.key.toLowerCase?.() || event.key] = false;
  };
  globalThis.addEventListener?.('keydown', onKeyDown);
  globalThis.addEventListener?.('keyup', onKeyUp);

  let running = false;
  let raf = 0;
  let last = 0;
  const frame = (now) => {
    if (!running) return;
    const dt = last ? Math.min(0.033, (now - last) / 1000) : 0;
    last = now;
    const raw = keyboardIntent(keys);
    const intent = cameraRelativeIntent(raw, cameraForward, cameraRight);
    player = stepCharacter(player, intent, dt, flatWorld);
    legacyAdapter?.setWorldPose?.({ player: player.position });
    legacyAdapter?.tickRetainedSystems?.(dt);
    raf = requestAnimationFrame(frame);
  };

  return {
    canvas,
    get player() { return player; },
    start() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
    dispose() {
      this.stop();
      globalThis.removeEventListener?.('keydown', onKeyDown);
      globalThis.removeEventListener?.('keyup', onKeyUp);
      canvas.remove();
    },
  };
}
