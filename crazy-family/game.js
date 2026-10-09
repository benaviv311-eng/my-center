import { keyboardIntent, cameraRelativeIntent } from './input.js';
import { createCharacterState, stepCharacter, jumpCharacter, LIBI_MOVEMENT_DEFAULTS } from './movement.js';
import { createLivingRoomWorld } from './world.js';
import { createLivingRoomScene } from './scene.js';
import { createCharacterVisual, APPROVED_LIBI_ASSET, APPROVED_DAD_ASSET } from './characters.js';

export async function createCrazyFamilyGame({ root, legacyAdapter }) {
  const doc = root.ownerDocument || document;
  const canvas = doc.createElement('canvas');
  canvas.className = 'movie-set-canvas';
  canvas.setAttribute('aria-label', 'המשפחה המשגעת — סלון תלת־ממדי');
  canvas.width = 960;
  canvas.height = 600;
  root.replaceChildren(canvas);

  const world = createLivingRoomWorld();
  const sceneHandle = createLivingRoomScene({ canvas, world });
  const playerVisual = createCharacterVisual({ scene: sceneHandle.scene, kind: 'libi', approvedAssetUrl: APPROVED_LIBI_ASSET });
  const dadVisual = createCharacterVisual({ scene: sceneHandle.scene, kind: 'dad', approvedAssetUrl: APPROVED_DAD_ASSET });

  const keys = Object.create(null);
  let player = createCharacterState({ position: { x: 0, y: 0, z: 3.55 }, ...LIBI_MOVEMENT_DEFAULTS });
  const dadPosition = { x: 2.7, y: 0, z: -0.35 };
  const cameraForward = { x: 0, z: -1 };
  const cameraRight = { x: 1, z: 0 };

  const syncSize = () => {
    const rect = root.getBoundingClientRect?.() || { width: 960, height: 600 };
    const width = rect.width || 960;
    const height = rect.height || width * 0.625;
    sceneHandle.resize(width, height);
  };
  syncSize();
  globalThis.addEventListener?.('resize', syncSize);

  const onKeyDown = (event) => {
    keys[event.key] = true;
    keys[event.key.toLowerCase?.() || event.key] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault?.();
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
  let facing = 1;
  const frame = (now) => {
    if (!running) return;
    const dt = last ? Math.min(0.033, (now - last) / 1000) : 0;
    last = now;
    const raw = keyboardIntent(keys);
    const intent = cameraRelativeIntent(raw, cameraForward, cameraRight);
    player = stepCharacter(player, intent, dt, world);
    if (Math.abs(player.velocity.x) > 0.05) facing = player.velocity.x < 0 ? -1 : 1;

    playerVisual.setPose({ position: player.position, facing, state: player.grounded ? 'ground' : 'jump' });
    dadVisual.setPose({ position: dadPosition, facing: -1, state: 'idle' });

    const camera = sceneHandle.camera;
    camera.position.x += ((player.position.x * 0.24) - camera.position.x) * Math.min(1, dt * 4.2);
    camera.position.y += (4.25 - camera.position.y) * Math.min(1, dt * 4.2);
    camera.position.z += ((player.position.z + 7.2) - camera.position.z) * Math.min(1, dt * 4.2);
    camera.lookAt(player.position.x, 0.82, player.position.z - 0.45);
    playerVisual.faceCamera(camera.position);
    dadVisual.faceCamera(camera.position);

    legacyAdapter?.setWorldPose?.({ player: player.position, dad: dadPosition });
    legacyAdapter?.setDadWorldDistance?.(Math.hypot(player.position.x - dadPosition.x, player.position.z - dadPosition.z));
    legacyAdapter?.tickRetainedSystems?.(dt);
    sceneHandle.render(camera);
    raf = requestAnimationFrame(frame);
  };

  return {
    canvas,
    world,
    scene: sceneHandle,
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
      globalThis.removeEventListener?.('resize', syncSize);
      playerVisual.dispose();
      dadVisual.dispose();
      sceneHandle.dispose();
      canvas.remove();
    },
  };
}
