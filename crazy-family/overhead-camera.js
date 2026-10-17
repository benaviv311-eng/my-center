export const OVERHEAD_ROOM_CAMERA = Object.freeze({
  position: Object.freeze({ x: 7.2, y: 11.5, z: 8.0 }),
  target: Object.freeze({ x: 0, y: 0.45, z: 0 }),
  fov: 48,
  desktopAspect: 1.35,
  maxDistanceScale: 1.45,
});

function clone(v) {
  return { x: v.x, y: v.y, z: v.z };
}

export function createOverheadCameraPose({ width = 960, height = 600 } = {}) {
  const w = Math.max(1, Number(width) || 1);
  const h = Math.max(1, Number(height) || 1);
  const aspect = w / h;
  const base = OVERHEAD_ROOM_CAMERA;
  const scale = aspect < base.desktopAspect
    ? Math.min(base.maxDistanceScale, base.desktopAspect / Math.max(aspect, 1e-6))
    : 1;
  const target = clone(base.target);
  const ray = {
    x: base.position.x - base.target.x,
    y: base.position.y - base.target.y,
    z: base.position.z - base.target.z,
  };
  return {
    position: {
      x: target.x + ray.x * scale,
      y: target.y + ray.y * scale,
      z: target.z + ray.z * scale,
    },
    target,
    fov: base.fov,
  };
}
