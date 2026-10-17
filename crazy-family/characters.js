import * as THREE from 'three';
import { getCanonicalCharacter, APPROVED_LIBI_ASSET, APPROVED_DAD_ASSET } from './character-canon.js';

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
  // The locked canonical sprite remains the visible surface. World3d adds only real
  // depth/shadow layers; it does not redraw the face, hair, clothes or proportions.
  const depth = kind === 'dad' ? 0.20 : 0.14;
  const layerCount = 7;
  const group = new THREE.Group();
  group.name = kind === 'dad' ? 'dad-character' : 'libi-character';
  group.userData.semanticId = group.name;
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

export function createCharacterVisual(options = {}) {
  const { scene, kind } = options;
  const canonical = getCanonicalCharacter(kind);
  const requestedAsset = options.approvedAssetUrl || options.assetUrl || options.asset || null;
  if (requestedAsset && requestedAsset !== canonical.asset) {
    throw new Error('Character canon is locked. Use an explicit canonical-character update instead of a runtime asset override.');
  }

  const url = canonical.asset;
  const texture = createCanonicalTexture(url, canonical);
  const isWorld3D = scene?.name === 'world3d-stage';
  const canonicalReveal = kind === 'dad' ? 0.14 : 0.12;
  const visual = isWorld3D
    ? createCanonical3DStack({ texture, canonical, kind })
    : createCanonicalSprite({ texture, canonical, kind });
  const mesh = visual.mesh;
  scene.add(mesh);

  let facing = 1;
  return {
    mesh,
    canonicalAssetUrl: url,
    approvedAssetUrl: url,
    depth: visual.depth,
    setPose({ position, facing: nextFacing = facing, jumpHeight = 0, state = 'idle' }) {
      facing = nextFacing || facing || 1;
      mesh.position.set(position.x, position.y + jumpHeight, position.z);
      mesh.scale.x = Math.abs(mesh.scale.x) * (facing < 0 ? -1 : 1);
      mesh.userData.state = state;
    },
    faceCamera(cameraPosition) {
      if (!cameraPosition) return;
      if (isWorld3D) {
        // Keep the locked character art readable, but reveal a small amount of the
        // new world-space depth instead of presenting a perfectly flat billboard.
        const dx = cameraPosition.x - mesh.position.x;
        const dz = cameraPosition.z - mesh.position.z;
        const cameraYaw = Math.atan2(dx, dz);
        const revealDirection = facing < 0 ? -1 : 1;
        mesh.rotation.set(0, cameraYaw + revealDirection * canonicalReveal, 0);
        mesh.userData.canonicalReveal = canonicalReveal;
        return;
      }
      const target = new THREE.Vector3(
        cameraPosition.x,
        mesh.position.y + canonical.height * 0.45,
        cameraPosition.z,
      );
      mesh.lookAt(target);
    },
    setVisible(value) { mesh.visible = Boolean(value); },
    setFrame(frame = 0) {
      const frameCount = canonical.spriteColumns * canonical.spriteRows;
      const clamped = Math.max(0, Math.min(frameCount - 1, Math.floor(frame)));
      texture.offset.x = (clamped % canonical.spriteColumns) / canonical.spriteColumns;
      texture.offset.y = Math.floor(clamped / canonical.spriteColumns) === 0 ? 1 / canonical.spriteRows : 0;
    },
    dispose() {
      scene.remove(mesh);
      for (const geometry of visual.geometries) geometry.dispose();
      for (const material of visual.materials) material.dispose();
      texture.dispose();
    },
  };
}
