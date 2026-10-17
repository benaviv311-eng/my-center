import { CHARACTER_RIG_PART_NAMES, getCharacterRigProfile } from './character-rig-profile.js';

function clampInt(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, Math.round(value)));
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function normalizeAngle(angle) {
  let normalized = Number(angle) || 0;
  while (normalized >= Math.PI) normalized -= Math.PI * 2;
  while (normalized < -Math.PI) normalized += Math.PI * 2;
  return normalized;
}

export function resolveReadableYaw({ cameraFacingYaw = 0, movementYaw = cameraFacingYaw, limitRadians = 25 * Math.PI / 180 } = {}) {
  const movementDelta = normalizeAngle(movementYaw - cameraFacingYaw);
  const visibleDelta = clamp(movementDelta, -Math.abs(limitRadians), Math.abs(limitRadians));
  return {
    yaw: normalizeAngle(cameraFacingYaw + visibleDelta),
    visibleDelta,
    movementDelta,
  };
}

function neutralJoints() {
  const joints = Object.create(null);
  for (const name of CHARACTER_RIG_PART_NAMES) joints[name] = { x: 0, y: 0, z: 0 };
  return joints;
}

function resolvePoseState(state, speed, grounded, crouching) {
  if (crouching || state === 'crouch') return 'crouch';
  if (!grounded || state === 'jump' || state === 'airborne') return 'jump';
  if (state === 'chase') return 'run';
  if (state === 'run') return 'run';
  if (state === 'walk') return 'walk';
  if (state === 'ground') {
    if (speed > 4.6) return 'run';
    if (speed > .18) return 'walk';
  }
  return 'idle';
}

export function calculateRigPose({
  kind,
  state = 'idle',
  timeSeconds = 0,
  speed = 0,
  grounded = true,
  crouching = false,
} = {}) {
  const profile = getCharacterRigProfile(kind);
  const joints = neutralJoints();
  const resolvedState = resolvePoseState(state, Number(speed) || 0, grounded !== false, Boolean(crouching));
  const result = {
    state: resolvedState,
    rootYOffset: 0,
    torso: { rotationX: 0, rotationY: 0, rotationZ: 0, offsetY: 0 },
    head: { rotationX: 0, rotationY: 0, rotationZ: 0, offsetY: 0 },
    joints,
  };

  if (resolvedState === 'idle') {
    const motion = profile.motion.idle;
    const phase = timeSeconds * motion.frequency;
    const breath = Math.sin(phase) * motion.breath;
    result.rootYOffset = breath * .16;
    result.torso.offsetY = breath;
    result.head.offsetY = breath * .45;
    result.head.rotationZ = Math.sin(phase * .63) * motion.head;
    joints.leftUpperArm.z = -motion.arm + Math.sin(phase * .72) * motion.arm * .2;
    joints.rightUpperArm.z = motion.arm - Math.sin(phase * .72) * motion.arm * .2;
    return result;
  }

  if (resolvedState === 'walk' || resolvedState === 'run') {
    const motion = profile.motion[resolvedState];
    const phase = timeSeconds * motion.frequency;
    const swing = Math.sin(phase);
    const opposite = -swing;
    joints.leftUpperArm.z = swing * motion.armSwing;
    joints.rightUpperArm.z = opposite * motion.armSwing;
    joints.leftLowerArm.z = swing * motion.armSwing * .34;
    joints.rightLowerArm.z = opposite * motion.armSwing * .34;
    joints.leftUpperLeg.z = opposite * motion.legSwing;
    joints.rightUpperLeg.z = swing * motion.legSwing;
    joints.leftLowerLeg.z = Math.max(0, swing) * motion.kneeBend;
    joints.rightLowerLeg.z = Math.max(0, opposite) * motion.kneeBend;
    result.torso.rotationY = swing * motion.torsoTwist;
    result.torso.rotationX = -(motion.lean || 0);
    result.head.rotationY = -result.torso.rotationY * .38;
    result.rootYOffset = Math.abs(Math.sin(phase * 2)) * (resolvedState === 'run' ? .018 : .010);
    return result;
  }

  if (resolvedState === 'jump') {
    const motion = profile.motion.jump;
    result.torso.rotationX = -motion.torsoLean;
    result.head.rotationX = motion.torsoLean * .25;
    joints.leftUpperArm.z = motion.armLift;
    joints.rightUpperArm.z = -motion.armLift;
    joints.leftLowerArm.z = motion.armLift * .28;
    joints.rightLowerArm.z = -motion.armLift * .28;
    joints.leftUpperLeg.z = -motion.legTuck;
    joints.rightUpperLeg.z = motion.legTuck;
    joints.leftLowerLeg.z = motion.legTuck * .85;
    joints.rightLowerLeg.z = -motion.legTuck * .85;
    return result;
  }

  if (resolvedState === 'crouch') {
    const motion = profile.motion.crouch;
    result.rootYOffset = -motion.hipDrop;
    result.torso.rotationX = motion.torsoLean;
    result.head.rotationX = -motion.torsoLean * .25;
    joints.leftUpperLeg.z = -.16;
    joints.rightUpperLeg.z = .16;
    joints.leftLowerLeg.z = motion.kneeBend;
    joints.rightLowerLeg.z = -motion.kneeBend;
    joints.leftUpperArm.z = -.08;
    joints.rightUpperArm.z = .08;
    return result;
  }

  return result;
}

export function cropRectToPixels(crop, frame, imageWidth, imageHeight, columns, rows) {
  const frameWidth = imageWidth / columns;
  const frameHeight = imageHeight / rows;
  const column = frame % columns;
  const row = Math.floor(frame / columns);
  return {
    x: Math.round(column * frameWidth + crop.x * frameWidth),
    y: Math.round(row * frameHeight + crop.y * frameHeight),
    width: Math.round(crop.width * frameWidth),
    height: Math.round(crop.height * frameHeight),
  };
}

export function extractRowSilhouetteBounds(imageData, width, height, alphaThreshold = 32) {
  const data = imageData?.data;
  if (!data || !(width > 0) || !(height > 0)) return [];
  const rows = [];
  for (let y = 0; y < height; y += 1) {
    let left = -1;
    let right = -1;
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3] || 0;
      if (alpha <= alphaThreshold) continue;
      if (left < 0) left = x;
      right = x;
    }
    if (left >= 0) rows.push({ y, left, right });
  }
  return rows;
}

function imageSize(sourceImage) {
  return {
    width: Number(sourceImage?.naturalWidth || sourceImage?.videoWidth || sourceImage?.width || 0),
    height: Number(sourceImage?.naturalHeight || sourceImage?.videoHeight || sourceImage?.height || 0),
  };
}

function makeCanvas(documentRef, width, height) {
  const canvas = documentRef?.createElement?.('canvas');
  if (!canvas) throw new Error('Crazy Family segmented rig: canvas unavailable');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

function drawCanonicalPart({ documentRef, sourceImage, sourceRect }) {
  const canvas = makeCanvas(documentRef, sourceRect.width, sourceRect.height);
  const context = canvas.getContext?.('2d', { willReadFrequently: true });
  if (!context) throw new Error('Crazy Family segmented rig: 2d canvas unavailable');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    sourceImage,
    sourceRect.x,
    sourceRect.y,
    sourceRect.width,
    sourceRect.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return { canvas, context };
}

function mirrorCanvas(documentRef, sourceCanvas) {
  const canvas = makeCanvas(documentRef, sourceCanvas.width, sourceCanvas.height);
  const context = canvas.getContext?.('2d');
  if (!context) throw new Error('Crazy Family segmented rig: 2d canvas unavailable');
  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  context.drawImage(sourceCanvas, 0, 0);
  return canvas;
}

function deriveEdgeColor(context, width, height) {
  const image = context.getImageData?.(0, 0, width, height);
  if (!image?.data) return 'rgb(128,128,128)';
  const data = image.data;
  const samples = [];
  const push = (x, y) => {
    const index = (y * width + x) * 4;
    if (data[index + 3] > 32) samples.push([data[index], data[index + 1], data[index + 2]]);
  };
  const edge = Math.min(3, Math.max(1, Math.floor(Math.min(width, height) / 8)));
  for (let inset = 0; inset < edge; inset += 1) {
    for (let x = inset; x < width - inset; x += 1) {
      push(x, inset);
      push(x, height - 1 - inset);
    }
    for (let y = inset + 1; y < height - 1 - inset; y += 1) {
      push(inset, y);
      push(width - 1 - inset, y);
    }
  }
  if (!samples.length) {
    for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 12))) {
      for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 12))) push(x, y);
    }
  }
  if (!samples.length) return 'rgb(128,128,128)';
  const totals = samples.reduce((sum, rgb) => [sum[0] + rgb[0], sum[1] + rgb[1], sum[2] + rgb[2]], [0, 0, 0]);
  return `rgb(${clampInt(totals[0] / samples.length, 0, 255)},${clampInt(totals[1] / samples.length, 0, 255)},${clampInt(totals[2] / samples.length, 0, 255)})`;
}

function createTexture(THREERef, canvas) {
  const texture = new THREERef.CanvasTexture(canvas);
  if ('SRGBColorSpace' in THREERef) texture.colorSpace = THREERef.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function appendQuad(positions, a, b, c, d) {
  positions.push(
    a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2],
    a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2],
  );
}

function buildSilhouetteSideGeometry({ THREERef, imageData, pixelWidth, pixelHeight, worldWidth, worldHeight, depth }) {
  const geometry = new THREERef.BufferGeometry();
  const rows = extractRowSilhouetteBounds(imageData, pixelWidth, pixelHeight, 32);
  const positions = [];
  if (!rows.length) {
    geometry.setAttribute('position', new THREERef.Float32BufferAttribute([], 3));
    return geometry;
  }

  const halfDepth = depth / 2;
  const point = (x, y, z) => [
    ((x + .5) / pixelWidth - .5) * worldWidth,
    (.5 - (y + .5) / pixelHeight) * worldHeight,
    z,
  ];
  const sampleStep = Math.max(1, Math.floor(pixelHeight / 64));
  const sampled = rows.filter((_, index) => index % sampleStep === 0 || index === rows.length - 1);

  for (let index = 0; index < sampled.length - 1; index += 1) {
    const current = sampled[index];
    const next = sampled[index + 1];
    if (next.y - current.y > sampleStep * 3) continue;

    const leftFront = point(current.left, current.y, halfDepth);
    const leftBack = point(current.left, current.y, -halfDepth);
    const nextLeftBack = point(next.left, next.y, -halfDepth);
    const nextLeftFront = point(next.left, next.y, halfDepth);
    appendQuad(positions, leftFront, leftBack, nextLeftBack, nextLeftFront);

    const rightFront = point(current.right, current.y, halfDepth);
    const nextRightFront = point(next.right, next.y, halfDepth);
    const nextRightBack = point(next.right, next.y, -halfDepth);
    const rightBack = point(current.right, current.y, -halfDepth);
    appendQuad(positions, rightFront, nextRightFront, nextRightBack, rightBack);
  }

  const first = sampled[0];
  const last = sampled[sampled.length - 1];
  appendQuad(
    positions,
    point(first.left, first.y, halfDepth),
    point(first.right, first.y, halfDepth),
    point(first.right, first.y, -halfDepth),
    point(first.left, first.y, -halfDepth),
  );
  appendQuad(
    positions,
    point(last.left, last.y, halfDepth),
    point(last.left, last.y, -halfDepth),
    point(last.right, last.y, -halfDepth),
    point(last.right, last.y, halfDepth),
  );

  geometry.setAttribute('position', new THREERef.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals?.();
  return geometry;
}

function createPartMesh({ THREERef, kind, name, canonical, profilePart, frontCanvas, frontContext, documentRef }) {
  const width = profilePart.crop.width * canonical.width;
  const height = profilePart.crop.height * canonical.height;
  const depth = profilePart.depth;
  const frontTexture = createTexture(THREERef, frontCanvas);
  const backTexture = createTexture(THREERef, mirrorCanvas(documentRef, frontCanvas));
  const sideColor = deriveEdgeColor(frontContext, frontCanvas.width, frontCanvas.height);

  const frontMaterial = new THREERef.MeshStandardMaterial({
    map: frontTexture,
    transparent: true,
    alphaTest: .08,
    roughness: .82,
    metalness: 0,
    side: THREERef.FrontSide,
  });
  const backMaterial = new THREERef.MeshStandardMaterial({
    map: backTexture,
    transparent: true,
    alphaTest: .08,
    roughness: .82,
    metalness: 0,
    side: THREERef.FrontSide,
  });
  const sideMaterial = new THREERef.MeshStandardMaterial({ color: sideColor, roughness: .88, metalness: 0, side: THREERef.DoubleSide });

  const frontGeometry = new THREERef.PlaneGeometry(width, height);
  const backGeometry = new THREERef.PlaneGeometry(width, height);
  const imageData = frontContext.getImageData?.(0, 0, frontCanvas.width, frontCanvas.height);
  const sideGeometry = buildSilhouetteSideGeometry({
    THREERef,
    imageData,
    pixelWidth: frontCanvas.width,
    pixelHeight: frontCanvas.height,
    worldWidth: width,
    worldHeight: height,
    depth,
  });

  const surface = new THREERef.Group();
  surface.name = `${kind}-${name}-surface`;
  surface.userData.semanticPart = name;

  const front = new THREERef.Mesh(frontGeometry, frontMaterial);
  front.name = `${kind}-${name}-front`;
  front.position.z = depth / 2;
  front.castShadow = true;
  front.receiveShadow = true;
  surface.add(front);

  const back = new THREERef.Mesh(backGeometry, backMaterial);
  back.name = `${kind}-${name}-back`;
  back.position.z = -depth / 2;
  back.rotation.y = Math.PI;
  back.castShadow = true;
  back.receiveShadow = true;
  surface.add(back);

  const sides = new THREERef.Mesh(sideGeometry, sideMaterial);
  sides.name = `${kind}-${name}-sides`;
  sides.castShadow = true;
  sides.receiveShadow = true;
  surface.add(sides);

  const pivot = new THREERef.Group();
  pivot.name = `${kind}-${name}`;
  pivot.userData.semanticPart = name;
  const frameLeft = (profilePart.crop.x - .5) * canonical.width;
  const frameTop = (1 - profilePart.crop.y) * canonical.height;
  const centerX = frameLeft + width / 2;
  const centerY = frameTop - height / 2;
  const pivotX = frameLeft + profilePart.pivot.x * width;
  const pivotY = frameTop - profilePart.pivot.y * height;
  const pivotZ = profilePart.zOrder * .002;
  pivot.position.set(pivotX, pivotY, pivotZ);
  pivot.userData.neutralPosition = { x: pivotX, y: pivotY, z: pivotZ };
  surface.position.set(centerX - pivotX, centerY - pivotY, 0);
  pivot.add(surface);

  return {
    pivot,
    mesh: surface,
    resources: {
      geometries: [frontGeometry, backGeometry, sideGeometry],
      materials: [frontMaterial, backMaterial, sideMaterial],
      textures: [frontTexture, backTexture],
    },
  };
}

export async function createCanonicalSegmentedRig({
  kind,
  canonical,
  sourceImage,
  documentRef = globalThis.document,
  THREERef,
}) {
  const size = imageSize(sourceImage);
  if (!(size.width > 0) || !(size.height > 0)) {
    throw new Error('Crazy Family segmented rig: canonical image unavailable');
  }
  if (!THREERef?.Group || !THREERef?.Mesh || !THREERef?.PlaneGeometry || !THREERef?.BufferGeometry || !THREERef?.Float32BufferAttribute) {
    throw new Error('Crazy Family segmented rig: Three.js unavailable');
  }

  const profile = getCharacterRigProfile(kind);
  const root = new THREERef.Group();
  root.name = `${kind}-canonical-segmented-rig`;
  root.userData.semanticId = kind === 'dad' ? 'dad-character' : 'libi-character';
  root.userData.canonicalAssetUrl = canonical.asset;
  root.userData.characterCanonVersion = canonical.version;
  root.userData.renderMode = 'canonical-segmented-rig';
  root.userData.requestedFrame = 0;

  const presentationRoot = new THREERef.Group();
  presentationRoot.name = `${kind}-rig-presentation`;
  presentationRoot.userData.semanticPart = 'presentationRoot';
  root.add(presentationRoot);

  const parts = Object.create(null);
  const resources = { geometries: [], materials: [], textures: [] };

  for (const name of CHARACTER_RIG_PART_NAMES) {
    const profilePart = profile.parts[name];
    const sourceRect = cropRectToPixels(
      profilePart.crop,
      profile.sourceFrame,
      size.width,
      size.height,
      canonical.spriteColumns,
      canonical.spriteRows,
    );
    const { canvas, context } = drawCanonicalPart({ documentRef, sourceImage, sourceRect });
    const built = createPartMesh({ THREERef, kind, name, canonical, profilePart, frontCanvas: canvas, frontContext: context, documentRef });
    presentationRoot.add(built.pivot);
    parts[name] = built.pivot;
    resources.geometries.push(...built.resources.geometries);
    resources.materials.push(...built.resources.materials);
    resources.textures.push(...built.resources.textures);
  }

  function applyPoseToRig(poseInput = {}) {
    const pose = calculateRigPose({ kind, ...poseInput });
    presentationRoot.position.y = pose.rootYOffset;
    for (const name of CHARACTER_RIG_PART_NAMES) {
      const pivot = parts[name];
      const neutralPosition = pivot.userData.neutralPosition;
      if (neutralPosition) pivot.position.set(neutralPosition.x, neutralPosition.y, neutralPosition.z);
      const joint = pose.joints[name] || { x: 0, y: 0, z: 0 };
      pivot.rotation.set(joint.x || 0, joint.y || 0, joint.z || 0);
    }
    const torso = parts.torso;
    torso.rotation.x += pose.torso.rotationX || 0;
    torso.rotation.y += pose.torso.rotationY || 0;
    torso.rotation.z += pose.torso.rotationZ || 0;
    torso.position.y = torso.userData.neutralPosition.y + (pose.torso.offsetY || 0);
    const head = parts.head;
    head.rotation.x += pose.head.rotationX || 0;
    head.rotation.y += pose.head.rotationY || 0;
    head.rotation.z += pose.head.rotationZ || 0;
    head.position.y = head.userData.neutralPosition.y + (pose.head.offsetY || 0);

    root.userData.poseState = pose.state;
    root.userData.poseDiagnostics = {
      state: pose.state,
      rootYOffset: pose.rootYOffset,
      leftUpperArm: pose.joints.leftUpperArm.z,
      leftUpperLeg: pose.joints.leftUpperLeg.z,
    };
    return pose;
  }

  let lastMovementYaw = null;
  return {
    root,
    parts,
    presentationRoot,
    setPoseState(pose = {}) {
      if (Number.isFinite(pose.movementYaw)) lastMovementYaw = pose.movementYaw;
      return applyPoseToRig(pose);
    },
    setFrame(frame = 0) {
      root.userData.requestedFrame = Math.max(0, Math.floor(Number(frame) || 0));
    },
    faceCamera(input = {}) {
      const cameraPosition = input?.cameraPosition || input;
      const characterPosition = input?.characterPosition || root.position;
      if (!cameraPosition || !characterPosition) return null;
      const dx = Number(cameraPosition.x) - Number(characterPosition.x);
      const dz = Number(cameraPosition.z) - Number(characterPosition.z);
      if (!Number.isFinite(dx) || !Number.isFinite(dz)) return null;
      const cameraFacingYaw = Math.atan2(dx, dz);
      const movementYaw = Number.isFinite(input?.movementYaw) ? input.movementYaw : lastMovementYaw;
      const resolved = resolveReadableYaw({
        cameraFacingYaw,
        movementYaw: Number.isFinite(movementYaw) ? movementYaw : cameraFacingYaw,
        limitRadians: profile.readableYawLimitRadians,
      });
      root.rotation.y = resolved.yaw;
      root.userData.cameraFacingYaw = cameraFacingYaw;
      root.userData.visibleYawDelta = resolved.visibleDelta;
      root.userData.movementYaw = movementYaw;
      return resolved;
    },
    dispose() {
      for (const geometry of resources.geometries) geometry.dispose?.();
      for (const material of resources.materials) material.dispose?.();
      for (const texture of resources.textures) texture.dispose?.();
      root.clear?.();
    },
  };
}
