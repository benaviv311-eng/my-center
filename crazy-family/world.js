const ROOM_BOUNDS = Object.freeze({ minX: -6, maxX: 6, minZ: -4.6, maxZ: 4.6 });

function box(id, x, z, width, depth, height, extra = {}) {
  return { id, x, y: height / 2, z, width, depth, height, ...extra };
}

function insideExpandedBox(point, collider, radius = 0) {
  const halfW = collider.width / 2 + radius;
  const halfD = collider.depth / 2 + radius;
  return point.x >= collider.x - halfW && point.x <= collider.x + halfW && point.z >= collider.z - halfD && point.z <= collider.z + halfD;
}

function pushOutside(from, to, collider, radius) {
  if (!insideExpandedBox(to, collider, radius)) return to;
  const halfW = collider.width / 2 + radius;
  const halfD = collider.depth / 2 + radius;
  const left = collider.x - halfW;
  const right = collider.x + halfW;
  const near = collider.z + halfD;
  const far = collider.z - halfD;
  if (from.x <= left) return { ...to, x: left };
  if (from.x >= right) return { ...to, x: right };
  if (from.z >= near) return { ...to, z: near };
  if (from.z <= far) return { ...to, z: far };
  const choices = [
    { d: Math.abs(to.x - left), value: { ...to, x: left } },
    { d: Math.abs(to.x - right), value: { ...to, x: right } },
    { d: Math.abs(to.z - near), value: { ...to, z: near } },
    { d: Math.abs(to.z - far), value: { ...to, z: far } },
  ];
  choices.sort((a, b) => a.d - b.d);
  return choices[0].value;
}

function segmentBoxFraction(start, end, collider, padding = 0.1) {
  const minX = collider.x - collider.width / 2 - padding;
  const maxX = collider.x + collider.width / 2 + padding;
  const minZ = collider.z - collider.depth / 2 - padding;
  const maxZ = collider.z + collider.depth / 2 + padding;
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  let tMin = 0;
  let tMax = 1;
  for (const [p, q] of [[-dx, start.x - minX], [dx, maxX - start.x], [-dz, start.z - minZ], [dz, maxZ - start.z]]) {
    if (Math.abs(p) < 1e-9) { if (q < 0) return null; continue; }
    const r = q / p;
    if (p < 0) { if (r > tMax) return null; if (r > tMin) tMin = r; }
    else { if (r < tMin) return null; if (r < tMax) tMax = r; }
  }
  if (tMin <= 0.03 || tMin >= 1) return null;
  return tMin;
}

export function createLivingRoomWorld() {
  // Furniture/layout is canonical and fixed. Scenario state may move actors/items only.
  const objects = [
    box('floor', 0, 0, 12, 9.2, 0.08, { kind: 'floor', material: 'wood' }),
    box('sofa', -3.35, 0.55, 3.15, 1.25, 1.05, { kind: 'furniture', color: 0xc97e78, occluder: true, cameraBlocker: true }),
    box('coffee-table', -0.25, 0.55, 2.15, 1.2, 0.52, { kind: 'furniture', color: 0x9a6546, occluder: true, cameraBlocker: true }),
    box('rug', -0.55, 0.72, 5.8, 3.2, 0.025, { kind: 'surface', material: 'rug', color: 0xb95f55 }),
    box('toy-ball', 1.95, 1.65, 0.38, 0.38, 0.38, { kind: 'prop', color: 0xf0ba48, reactive: true }),
    box('doorway', 4.9, -3.62, 1.5, 0.18, 2.45, { kind: 'doorway', color: 0x79543f, cameraBlocker: false }),
    box('side-table', -5.05, 0.38, 0.85, 0.75, 0.68, { kind: 'furniture', color: 0x8b5a42, occluder: true, cameraBlocker: true }),
    box('lamp', -5.05, 0.25, 0.45, 0.45, 1.75, { kind: 'dressing', color: 0xe6c172 }),
    box('cushion-a', -3.9, 0.42, 0.66, 0.2, 0.48, { kind: 'dressing', color: 0xe7b18f, reactive: true }),
    box('cushion-b', -2.8, 0.42, 0.62, 0.2, 0.48, { kind: 'dressing', color: 0x86b5ad, reactive: true }),
    box('toy-blocks', 2.7, 1.85, 0.8, 0.65, 0.32, { kind: 'dressing', color: 0x6ba6b8, reactive: true }),
  ];

  const colliders = objects.filter(o => ['sofa', 'coffee-table', 'side-table'].includes(o.id)).map(o => o.id === 'side-table' ? { ...o, width: 0.5, depth: 0.62 } : o);
  const wallThickness = 0.18;
  const wallHeight = 3.2;
  const roomWidth = ROOM_BOUNDS.maxX - ROOM_BOUNDS.minX;
  const roomDepth = ROOM_BOUNDS.maxZ - ROOM_BOUNDS.minZ;
  const roomShell = [
    box('wall-north', 0, ROOM_BOUNDS.minZ - wallThickness / 2, roomWidth + wallThickness * 2, wallThickness, wallHeight, { kind: 'wall', cameraBlocker: true, color: 0xd7c9bc }),
    box('wall-south', 0, ROOM_BOUNDS.maxZ + wallThickness / 2, roomWidth + wallThickness * 2, wallThickness, wallHeight, { kind: 'wall', cameraBlocker: true, color: 0xd7c9bc }),
    box('wall-west', ROOM_BOUNDS.minX - wallThickness / 2, 0, wallThickness, roomDepth, wallHeight, { kind: 'wall', cameraBlocker: true, color: 0xd7c9bc }),
    box('wall-east', ROOM_BOUNDS.maxX + wallThickness / 2, 0, wallThickness, roomDepth, wallHeight, { kind: 'wall', cameraBlocker: true, color: 0xd7c9bc }),
  ];
  const renderables = [...objects, ...roomShell];
  const interactables = [
    { id: 'headphones', action: 'take', label: 'לקחת אוזניות', x: -4.15, y: 1.08, z: 0.1, radius: 0.9, priority: 20, enabled: true, surfaceId: 'sofa' },
    { id: 'sofa', action: 'climb', label: 'לטפס על הספה', x: -3.35, y: 0, z: 1.25, radius: 1.15, priority: 5, enabled: true },
    { id: 'toy-ball', action: 'push', label: 'לבעוט בכדור', x: 1.95, y: 0.19, z: 1.65, radius: 0.9, priority: 4, enabled: true },
    { id: 'doorway', action: 'open', label: 'לעבור לפינת האוכל', x: 4.9, y: 0, z: -3.35, radius: 1.2, priority: 3, enabled: true },
  ];
  const surfaces = [
    { id: 'wood', kind: 'wood', minX: -6, maxX: 6, minZ: -4.6, maxZ: 4.6 },
    { id: 'rug', kind: 'rug', minX: -3.45, maxX: 2.35, minZ: -0.88, maxZ: 2.32 },
    { id: 'tile', kind: 'tile', minX: 3.9, maxX: 6, minZ: -4.6, maxZ: -2.65 },
    { id: 'sofa', kind: 'sofa', minX: -4.9, maxX: -1.8, minZ: -0.08, maxZ: 1.18 },
  ];
  const scenarioSpawns = {
    item: [
      { id: 'sofa-left', zone: 'living', surfaceId: 'sofa', x: -4.15, y: 1.08, z: 0.1, rotationY: -0.35 },
      { id: 'side-table', zone: 'living', surfaceId: 'side-table', x: -5.05, y: 0.78, z: 0.38, rotationY: 0.2 },
      { id: 'coffee-table', zone: 'living', surfaceId: 'coffee-table', x: -0.45, y: 0.64, z: 0.35, rotationY: 0.55 },
      { id: 'dining-side', zone: 'dining', x: 3.35, y: 0.82, z: -2.3, rotationY: -0.4 },
      { id: 'kitchen-counter', zone: 'kitchen', x: 4.25, y: 1.02, z: -3.05, rotationY: 0.7 },
      { id: 'back-console', zone: 'dining', x: 2.05, y: 0.88, z: -3.82, rotationY: -0.1 },
    ],
    dad: [
      { id: 'dining-entry', zone: 'dining', x: 1.8, y: 0, z: -2.6 },
      { id: 'kitchen-entry', zone: 'kitchen', x: 4.25, y: 0, z: -3.3 },
      { id: 'rug-far-side', zone: 'living', x: 3.7, y: 0, z: 2.9 },
      { id: 'window-side', zone: 'living', x: -1.1, y: 0, z: -2.7 },
      { id: 'hall-side', zone: 'hall', x: 5.1, y: 0, z: -1.1 },
    ],
  };
  const navBlockers = colliders.map(c => ({ id: c.id, x: c.x, z: c.z, width: c.width, depth: c.depth, clearance: c.id === 'coffee-table' ? 0.55 : 0.75 }));
  const cameraBlockers = [...colliders.filter(c => c.cameraBlocker), ...roomShell];
  const occluders = objects.filter(o => o.occluder);

  return {
    id: 'living-room',
    bounds: { ...ROOM_BOUNDS },
    objects,
    colliders,
    roomShell,
    renderables,
    interactables,
    surfaces,
    scenarioSpawns,
    navBlockers,
    cameraBlockers,
    occluders,
    groundHeightAt() { return 0; },
    surfaceAt(x, z) {
      const matches = surfaces.filter(s => x >= s.minX && x <= s.maxX && z >= s.minZ && z <= s.maxZ);
      return matches.at(-1) || surfaces[0];
    },
    resolveCharacterMove(from, to, capsule = { radius: 0.3 }) {
      const radius = Number(capsule.radius) || 0.3;
      const dx = to.x - from.x;
      const dz = to.z - from.z;
      const dy = to.y - from.y;
      const maxStep = Math.max(0.08, radius * 0.5);
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dz)) / maxStep));
      const stepDx = dx / steps;
      const stepDy = dy / steps;
      const stepDz = dz / steps;
      let current = { ...from };
      for (let i = 0; i < steps; i += 1) {
        let resolved = {
          x: Math.max(ROOM_BOUNDS.minX + radius, Math.min(ROOM_BOUNDS.maxX - radius, current.x + stepDx)),
          y: current.y + stepDy,
          z: Math.max(ROOM_BOUNDS.minZ + radius, Math.min(ROOM_BOUNDS.maxZ - radius, current.z + stepDz)),
        };
        for (const collider of colliders) resolved = pushOutside(current, resolved, collider, radius);
        current = resolved;
      }
      return current;
    },
    traceCameraSegment(start, end, blockers = cameraBlockers, padding = 0.12) {
      let best = null;
      for (const blocker of blockers) {
        const fraction = segmentBoxFraction(start, end, blocker, padding);
        if (fraction == null || (best && fraction >= best.fraction)) continue;
        best = {
          id: blocker.id,
          fraction,
          point: {
            x: start.x + (end.x - start.x) * fraction,
            y: start.y + (end.y - start.y) * fraction,
            z: start.z + (end.z - start.z) * fraction,
          },
        };
      }
      return best;
    },
    traceAttackSegment(start, end, attack = {}) {
      let best = null;
      const radius = Number(attack.radius) || 0.1;
      for (const collider of colliders) {
        const attackY = Number(start.y) || 0;
        if (attackY - radius > collider.height) continue;
        const fraction = segmentBoxFraction(start, end, collider, radius * 0.75);
        if (fraction == null || (best && fraction >= best.fraction)) continue;
        best = {
          id: collider.id,
          fraction,
          point: {
            x: start.x + (end.x - start.x) * fraction,
            y: start.y + (end.y - start.y) * fraction,
            z: start.z + (end.z - start.z) * fraction,
          },
        };
      }
      return best;
    },
    setInteractableEnabled(id, enabled) {
      const item = interactables.find(i => i.id === id);
      if (item) item.enabled = Boolean(enabled);
      return item?.enabled ?? false;
    },
  };
}
