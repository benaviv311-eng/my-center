import * as THREE from 'three';
import { getCanonicalCharacter, APPROVED_LIBI_ASSET, APPROVED_DAD_ASSET } from './character-canon.js';
import { createCanonicalSegmentedRig } from './character-rig.js';

export { APPROVED_LIBI_ASSET, APPROVED_DAD_ASSET };

function createCanonicalTexture(url, canonical) {
  const texture = new THREE.TextureLoader().load(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1 / canonical.spriteColumns, 1 / canonical.spriteRows);
  texture.offset.set(0, 1 / canonical.spriteRows);
  return texture;
}

function createCanonicalMaterial(texture) {
  return new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.08,
    roughness: 0.8,
    metalness: 0,
    side: THREE.DoubleSide,
  });
}

function setCanonicalTextureFrame(texture, canonical, frame = 0) {
  const frameCount = canonical.spriteColumns * canonical.spriteRows;
  const clamped = Math.max(0, Math.min(frameCount - 1, Math.floor(Number(frame) || 0)));
  texture.offset.x = (clamped % canonical.spriteColumns) / canonical.spriteColumns;
  texture.offset.y = Math.floor(clamped / canonical.spriteColumns) === 0 ? 1 / canonical.spriteRows : 0;
}

function createCanonicalSprite({ texture, canonical, kind }) {
  const geometry = new THREE.PlaneGeometry(canonical.width, canonical.height);
  geometry.translate(0, canonical.height / 2, 0);
  const material = createCanonicalMaterial(texture);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = kind === 'dad' ? 'dad-character' : 'libi-character';
  mesh.userData.semanticId = mesh.name;
  mesh.userData.canonicalAssetUrl = canonical.asset;
  mesh.userData.characterCanonVersion = canonical.version;
  mesh.userData.renderMode = 'canonical-sprite';
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return { mesh, geometries: [geometry], materials: [material], depth: 0 };
}

function createCanonical3DStack({ texture, canonical, kind }) {
  const depth = kind === 'dad' ? 0.20 : 0.14;
  const layerCount = 7;
  const group = new THREE.Group();
  group.name = kind === 'dad' ? 'dad-character-stack' : 'libi-character-stack';
  group.userData.semanticId = kind === 'dad' ? 'dad-character' : 'libi-character';
  group.userData.canonicalAssetUrl = canonical.asset;
  group.userData.characterCanonVersion = canonical.version;
  group.userData.renderMode = 'canonical-3d-stack';
  group.userData.depth = depth;

  const geometries = [];
  const materials = [];
  for (let index = 0; index < layerCount; index += 1) {
    const geometry = new THREE.PlaneGeometry(canonical.width, canonical.height);
    geometry.translate(0, canonical.height / 2, 0);
    const material = createCanonicalMaterial(texture);
    const layer = new THREE.Mesh(geometry, material);
    const t = layerCount === 1 ? 0.5 : index / (layerCount - 1);
    layer.position.z = THREE.MathUtils.lerp(-depth / 2, depth / 2, t);
    layer.name = `${group.name}-depth-${index + 1}`;
    layer.userData.canonicalDepthLayer = index;
    layer.castShadow = true;
    layer.receiveShadow = true;
    group.add(layer);
    geometries.push(geometry);
    materials.push(material);
  }

  const depthProxyGeometry = new THREE.BoxGeometry(
    canonical.width * 0.64,
    canonical.height * 0.86,
    depth,
  );
  depthProxyGeometry.translate(0, canonical.height * 0.46, 0);
  const depthProxyMaterial = new THREE.MeshBasicMaterial({ visible: false });
  const depthProxy = new THREE.Mesh(depthProxyGeometry, depthProxyMaterial);
  depthProxy.name = `${group.name}-depth-proxy`;
  depthProxy.userData.canonicalDepthProxy = true;
  group.add(depthProxy);
  geometries.push(depthProxyGeometry);
  materials.push(depthProxyMaterial);

  return { mesh: group, geometries, materials, depth };
}

function disposeStaticVisual(visual, texture) {
  for (const geometry of visual?.geometries || []) geometry.dispose?.();
  for (const material of visual?.materials || []) material.dispose?.();
  texture?.dispose?.();
}

function createImagePromise(url, documentRef = globalThis.document) {
  const ImageCtor = documentRef?.defaultView?.Image || globalThis.Image;
  if (!ImageCtor) return Promise.reject(new Error('browser Image constructor unavailable'));
  return new Promise((resolve, reject) => {
    const image = new ImageCtor();
    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      image.onload = null;
      image.onerror = null;
      callback(value);
    };
    image.onload = () => finish(resolve, image);
    image.onerror = () => finish(reject, new Error(`canonical image failed to load: ${url}`));
    image.src = url;
    if (image.complete && image.naturalWidth > 0) queueMicrotask(() => finish(resolve, image));
  });
}

function nowSeconds() {
  const now = globalThis.performance?.now?.() ?? Date.now();
  return Number(now) / 1000;
}

function createCinematicCharacter({ scene, kind, canonical, url }) {
  const texture = createCanonicalTexture(url, canonical);
  const visual = createCanonicalSprite({ texture, canonical, kind });
  const mesh = visual.mesh;
  scene.add(mesh);
  let facing = 1;

  return {
    mesh,
    canonicalAssetUrl: url,
    approvedAssetUrl: url,
    depth: 0,
    ready: Promise.resolve(true),
    setPose({ position, facing: nextFacing = facing, jumpHeight = 0, state = 'idle' }) {
      facing = nextFacing || facing || 1;
      mesh.position.set(position.x, position.y + jumpHeight, position.z);
      mesh.scale.x = Math.abs(mesh.scale.x) * (facing < 0 ? -1 : 1);
      mesh.userData.state = state;
    },
    faceCamera(cameraPosition) {
      if (!cameraPosition) return;
      const target = new THREE.Vector3(
        cameraPosition.x,
        mesh.position.y + canonical.height * 0.45,
        cameraPosition.z,
      );
      mesh.lookAt(target);
    },
    setVisible(value) { mesh.visible = Boolean(value); },
    setFrame(frame = 0) { setCanonicalTextureFrame(texture, canonical, frame); },
    dispose() {
      scene.remove(mesh);
      disposeStaticVisual(visual, texture);
    },
  };
}

function createWorld3DCharacter({ scene, kind, canonical, url }) {
  const stableRoot = new THREE.Group();
  stableRoot.name = kind === 'dad' ? 'dad-character' : 'libi-character';
  stableRoot.userData.semanticId = stableRoot.name;
  stableRoot.userData.canonicalAssetUrl = canonical.asset;
  stableRoot.userData.characterCanonVersion = canonical.version;
  stableRoot.userData.renderMode = 'canonical-3d-stack';

  const fallbackTexture = createCanonicalTexture(url, canonical);
  const fallback = createCanonical3DStack({ texture: fallbackTexture, canonical, kind });
  stableRoot.add(fallback.mesh);
  scene.add(stableRoot);

  const fallbackPresentation = {
    root: fallback.mesh,
    setPoseState() {},
    setFrame(frame = 0) { setCanonicalTextureFrame(fallbackTexture, canonical, frame); },
    faceCamera({ cameraPosition, characterPosition, facing = 1 } = {}) {
      if (!cameraPosition || !characterPosition) return;
      const dx = cameraPosition.x - characterPosition.x;
      const dz = cameraPosition.z - characterPosition.z;
      const cameraYaw = Math.atan2(dx, dz);
      const revealDirection = facing < 0 ? -1 : 1;
      const canonicalReveal = kind === 'dad' ? 0.14 : 0.12;
      fallback.mesh.rotation.set(0, cameraYaw + revealDirection * canonicalReveal, 0);
      fallback.mesh.userData.canonicalReveal = canonicalReveal;
    },
    dispose() { disposeStaticVisual(fallback, fallbackTexture); },
  };

  let activePresentation = fallbackPresentation;
  let disposed = false;
  let facing = 1;
  let lastFrame = 0;
  let lastCameraPosition = null;
  let lastMovementYaw = 0;
  let lastPoseAt = null;
  let lastPosition = null;
  let lastPoseState = {
    state: 'idle',
    timeSeconds: nowSeconds(),
    speed: 0,
    grounded: true,
    crouching: false,
    movementYaw: 0,
    facing: 1,
  };

  const ready = createImagePromise(url)
    .then((sourceImage) => createCanonicalSegmentedRig({
      kind,
      canonical,
      sourceImage,
      documentRef: globalThis.document,
      THREERef: THREE,
    }))
    .then((rig) => {
      if (disposed) {
        rig.dispose();
        return false;
      }
      stableRoot.remove(fallback.mesh);
      fallbackPresentation.dispose();
      stableRoot.add(rig.root);
      activePresentation = rig;
      stableRoot.userData.renderMode = 'canonical-segmented-rig';
      stableRoot.userData.rigReady = true;
      activePresentation.setFrame(lastFrame);
      activePresentation.setPoseState(lastPoseState);
      if (lastCameraPosition) {
        activePresentation.faceCamera({
          cameraPosition: lastCameraPosition,
          characterPosition: stableRoot.position,
          movementYaw: lastMovementYaw,
          facing,
        });
      }
      return true;
    })
    .catch((error) => {
      stableRoot.userData.rigReady = false;
      stableRoot.userData.rigError = String(error?.message || error);
      console.warn(`[Crazy Family segmented rig] ${kind}: keeping canonical-3d-stack fallback`, error);
      return false;
    });

  return {
    mesh: stableRoot,
    canonicalAssetUrl: url,
    approvedAssetUrl: url,
    depth: fallback.depth,
    ready,
    setPose({ position, facing: nextFacing = facing, jumpHeight = 0, state = 'idle' }) {
      facing = nextFacing || facing || 1;
      const timeSeconds = nowSeconds();
      let speed = 0;
      if (lastPosition && Number.isFinite(lastPoseAt)) {
        const dt = Math.max(.001, timeSeconds - lastPoseAt);
        const dx = position.x - lastPosition.x;
        const dz = position.z - lastPosition.z;
        const distance = Math.hypot(dx, dz);
        speed = Math.min(12, distance / dt);
        if (distance > .0005) lastMovementYaw = Math.atan2(dx, dz);
      }
      stableRoot.position.set(position.x, position.y + jumpHeight, position.z);
      stableRoot.userData.state = state;
      lastPoseAt = timeSeconds;
      lastPosition = { x: position.x, y: position.y, z: position.z };
      lastPoseState = {
        state,
        timeSeconds,
        speed,
        grounded: state !== 'jump' && state !== 'airborne',
        crouching: state === 'crouch',
        movementYaw: lastMovementYaw,
        facing,
      };
      activePresentation.setPoseState(lastPoseState);
    },
    faceCamera(cameraPosition) {
      if (!cameraPosition) return;
      lastCameraPosition = { x: cameraPosition.x, y: cameraPosition.y, z: cameraPosition.z };
      activePresentation.faceCamera({
        cameraPosition: lastCameraPosition,
        characterPosition: stableRoot.position,
        movementYaw: lastMovementYaw,
        facing,
      });
    },
    setVisible(value) { stableRoot.visible = Boolean(value); },
    setFrame(frame = 0) {
      lastFrame = frame;
      stableRoot.userData.requestedFrame = frame;
      activePresentation.setFrame(frame);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      scene.remove(stableRoot);
      activePresentation.dispose();
      stableRoot.clear();
    },
  };
}

export function createCharacterVisual(options = {}) {
  const { scene, kind } = options;
  const canonical = getCanonicalCharacter(kind);
  const requestedAsset = options.approvedAssetUrl || options.assetUrl || options.asset || null;
  if (requestedAsset && requestedAsset !== canonical.asset) {
    throw new Error('Character canon is locked. Use an explicit canonical-character update instead of a runtime asset override.');
  }

  const url = canonical.asset;
  const isWorld3D = scene?.name === 'world3d-stage';
  return isWorld3D
    ? createWorld3DCharacter({ scene, kind, canonical, url })
    : createCinematicCharacter({ scene, kind, canonical, url });
}
