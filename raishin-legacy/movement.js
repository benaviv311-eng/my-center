(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RaishinMovement = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const KEY_MAP = {
    KeyW: [0, -1], ArrowUp: [0, -1],
    KeyS: [0, 1], ArrowDown: [0, 1],
    KeyA: [-1, 0], ArrowLeft: [-1, 0],
    KeyD: [1, 0], ArrowRight: [1, 0],
  };

  function inputVector(keys) {
    let x = 0;
    let y = 0;
    for (const code of keys) {
      const delta = KEY_MAP[code];
      if (!delta) continue;
      x += delta[0];
      y += delta[1];
    }
    x = Math.max(-1, Math.min(1, x));
    y = Math.max(-1, Math.min(1, y));
    return { x, y };
  }

  function directionFromVector(vector, lastDirection) {
    if (!vector.x && !vector.y) return lastDirection || 'down';
    if (Math.abs(vector.x) > Math.abs(vector.y)) return vector.x > 0 ? 'right' : 'left';
    if (Math.abs(vector.y) > Math.abs(vector.x)) return vector.y > 0 ? 'down' : 'up';
    if (vector.y) return vector.y > 0 ? 'down' : 'up';
    return vector.x > 0 ? 'right' : 'left';
  }

  function stepPlayer(position, vector, dt, bounds, speed) {
    let x = vector.x;
    let y = vector.y;
    const length = Math.hypot(x, y) || 1;
    if (length > 1) {
      x /= length;
      y /= length;
    }
    const nextX = position.x + x * speed * dt;
    const nextY = position.y + y * speed * dt;
    return {
      x: Math.max(bounds.minX, Math.min(bounds.maxX, nextX)),
      y: Math.max(bounds.minY, Math.min(bounds.maxY, nextY)),
    };
  }

  function frameAt(elapsedSeconds, moving, frameCount, fps) {
    if (!moving) return 0;
    return Math.floor(elapsedSeconds * fps) % frameCount;
  }

  function scaleForDepth(y, minY, maxY) {
    const range = Math.max(1, maxY - minY);
    const t = Math.max(0, Math.min(1, (y - minY) / range));
    return 0.72 + (0.34 * t);
  }

  return { inputVector, directionFromVector, stepPlayer, frameAt, scaleForDepth };
});
