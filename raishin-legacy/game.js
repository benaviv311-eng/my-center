(() => {
  'use strict';

  const root = document.querySelector('.game-app');
  const frame = document.querySelector('.game-frame');
  const canvas = document.getElementById('gameCanvas');
  const error = document.getElementById('loadError');
  const movement = window.RaishinMovement;
  if (!root || !frame || !canvas || !error || !movement) return;

  const ctx = canvas.getContext('2d');
  const background = new Image();
  const sprite = new Image();
  background.decoding = 'async';
  sprite.decoding = 'async';
  background.src = canvas.dataset.background;
  sprite.src = canvas.dataset.sprite;

  const keys = new Set();
  const bounds = { minX: 170, maxX: 1430, minY: 380, maxY: 835 };
  const state = {
    x: 800,
    y: 690,
    direction: 'down',
    moving: false,
    walkTime: 0,
    lastTimestamp: 0,
  };
  const rowByDirection = { down: 0, up: 1, left: 2, right: 3 };
  const speed = 245;
  const frameCount = 8;
  const walkFps = 10;

  const movementKeys = new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);

  function onKeyDown(event) {
    if (!movementKeys.has(event.code)) return;
    event.preventDefault();
    keys.add(event.code);
  }

  function onKeyUp(event) {
    if (!movementKeys.has(event.code)) return;
    event.preventDefault();
    keys.delete(event.code);
  }

  window.addEventListener('keydown', onKeyDown, { passive: false });
  window.addEventListener('keyup', onKeyUp, { passive: false });
  window.addEventListener('blur', () => keys.clear());
  frame.addEventListener('pointerdown', () => frame.focus());

  function markReady() {
    root.dataset.state = 'ready';
    error.hidden = true;
    frame.focus({ preventScroll: true });
  }

  function markError() {
    root.dataset.state = 'asset-error';
    error.hidden = false;
  }

  function drawPlayer(frameIndex) {
    const sourceW = sprite.naturalWidth / 8;
    const sourceH = sprite.naturalHeight / 4;
    const row = rowByDirection[state.direction];
    const scale = movement.scaleForDepth(state.y, bounds.minY, bounds.maxY);
    const displayH = 355 * scale;
    const displayW = displayH * (sourceW / sourceH);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      sprite,
      frameIndex * sourceW,
      row * sourceH,
      sourceW,
      sourceH,
      state.x - displayW / 2,
      state.y - displayH,
      displayW,
      displayH
    );
    ctx.restore();
  }

  function render(timestamp) {
    if (!state.lastTimestamp) state.lastTimestamp = timestamp;
    const dt = Math.min(0.033, (timestamp - state.lastTimestamp) / 1000);
    state.lastTimestamp = timestamp;

    const vector = movement.inputVector(keys);
    state.moving = Boolean(vector.x || vector.y);
    state.direction = movement.directionFromVector(vector, state.direction);
    if (state.moving) {
      const next = movement.stepPlayer(state, vector, dt, bounds, speed);
      state.x = next.x;
      state.y = next.y;
      state.walkTime += dt;
    } else {
      state.walkTime = 0;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    const frameIndex = movement.frameAt(state.walkTime, state.moving, frameCount, walkFps);
    drawPlayer(frameIndex);
    requestAnimationFrame(render);
  }

  Promise.all([
    background.decode ? background.decode() : Promise.resolve(),
    sprite.decode ? sprite.decode() : Promise.resolve(),
  ]).then(() => {
    if (!background.naturalWidth || !sprite.naturalWidth) throw new Error('missing game asset');
    markReady();
    requestAnimationFrame(render);
  }).catch(markError);
})();
