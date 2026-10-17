import { CHARACTER_RIG_PART_NAMES, getCharacterRigProfile } from './character-rig-profile.js';

function clampInt(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, Math.round(value)));
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

function createPartMesh({ THREERef, kind, name, canonical, profilePart, frontCanvas, frontContext, documentRef }) {
  const width = profilePart.crop.width * canonical.width;
  const height = profilePart.crop.height * canonical.height;
  const depth = profilePart.depth;
  const frontTexture = createTexture(THREERef, frontCanvas);
  const backTexture = createTexture(THREERef, mirrorCanvas(documentRef, frontCanvas));
  const sideColor = deriveEdgeColor(frontContext, frontCanvas.width, frontCanvas.height);
  const sideMaterial = new THREERef.MeshStandardMaterial({ color: sideColor, roughness: .88, metalness: 0 });
  const topMaterial = sideMaterial.clone();
  const bottomMaterial = sideMaterial.clone();
  const frontMaterial = new THREERef.MeshStandardMaterial({ map: frontTexture, transparent: true, alphaTest: .08, roughness: .82, metalness: 0 });
  const backMaterial = new THREERef.MeshStandardMaterial({ map: backTexture, transparent: true, alphaTest: .08, roughness: .82, metalness: 0 });
  const geometry = new THREERef.BoxGeometry(width, height, depth);
  const mesh = new THREERef.Mesh(geometry, [sideMaterial, sideMaterial.clone(), topMaterial, bottomMaterial, frontMaterial, backMaterial]);
  mesh.name = `${kind}-${name}-mesh`;
  mesh.userData.semanticPart = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const pivot = new THREERef.Group();
  pivot.name = `${kind}-${name}`;
  pivot.userData.semanticPart = name;
  const frameLeft = (profilePart.crop.x - .5) * canonical.width;
  const frameTop = (1 - profilePart.crop.y) * canonical.height;
  const centerX = frameLeft + width / 2;
  const centerY = frameTop - height / 2;
  const pivotX = frameLeft + profilePart.pivot.x * width;
  const pivotY = frameTop - profilePart.pivot.y * height;
  pivot.position.set(pivotX, pivotY, profilePart.zOrder * .002);
  mesh.position.set(centerX - pivotX, centerY - pivotY, 0);
  pivot.add(mesh);

  return {
    pivot,
    mesh,
    resources: {
      geometries: [geometry],
      materials: mesh.material,
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
  if (!THREERef?.Group || !THREERef?.Mesh || !THREERef?.BoxGeometry) {
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
    root.add(built.pivot);
    parts[name] = built.pivot;
    resources.geometries.push(...built.resources.geometries);
    resources.materials.push(...built.resources.materials);
    resources.textures.push(...built.resources.textures);
  }

  function applyPoseToRig() {
    // Task 3 owns articulation. Keeping this function canvas-free is intentional.
  }

  return {
    root,
    parts,
    setPoseState(pose = {}) {
      root.userData.poseState = pose.state || 'idle';
      applyPoseToRig(pose);
    },
    setFrame(frame = 0) {
      root.userData.requestedFrame = Math.max(0, Math.floor(Number(frame) || 0));
    },
    faceCamera() {},
    dispose() {
      for (const geometry of resources.geometries) geometry.dispose?.();
      for (const material of resources.materials) material.dispose?.();
      for (const texture of resources.textures) texture.dispose?.();
      root.clear?.();
    },
  };
}
