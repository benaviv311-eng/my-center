export function buildGrayboxDescriptors(world) {
  if (!world?.renderables) return [];
  return world.renderables.map(def => ({
    id: String(def.id),
    kind: def.kind || 'object',
    x: Number(def.x) || 0,
    y: def.id === 'floor' ? -Math.max(0.02, Number(def.height) || 0.02) / 2 : (Number(def.y) || 0),
    z: Number(def.z) || 0,
    width: Math.max(0.02, Number(def.width) || 0.02),
    depth: Math.max(0.02, Number(def.depth) || 0.02),
    height: Math.max(0.02, Number(def.height) || 0.02),
    color: Number.isFinite(def.color) ? def.color : null,
    material: def.material || null,
    reactive: Boolean(def.reactive),
  }));
}
